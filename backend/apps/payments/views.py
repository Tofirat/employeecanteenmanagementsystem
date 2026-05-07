from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response

from .models import Payment
from .serializers import PaymentSerializer
from django.shortcuts import render, get_object_or_404
from django.http import HttpResponseForbidden
from django.core import signing


class PaymentListCreateView(generics.ListCreateAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Payment.objects.select_related("employee", "order").all()
        if user.role in ["admin", "staff"]:
            return queryset
        return queryset.filter(employee__user=user)

    def create(self, request, *args, **kwargs):
        if request.user.role != "admin":
            return Response({"detail": "Only admin can create payment records manually."}, status=status.HTTP_403_FORBIDDEN)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment = serializer.save()
        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)


class PaymentDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Payment.objects.select_related("employee", "order").all()
        if user.role in ["admin", "staff"]:
            return queryset
        return queryset.filter(employee__user=user)

    def patch(self, request, *args, **kwargs):
        if request.user.role not in ["admin", "staff"]:
            return Response({"detail": "You do not have permission to update payment status."}, status=status.HTTP_403_FORBIDDEN)
        payment = self.get_object()
        serializer = self.get_serializer(payment, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        payment = serializer.save()
        if payment.status == "paid" and payment.paid_at is None:
            payment.paid_at = timezone.now()
            payment.save(update_fields=["paid_at"])
        return Response(PaymentSerializer(payment).data)


class SSLCommerzInitiateView(generics.GenericAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        from django.conf import settings
        from .sslcommerz import create_session

        payment = Payment.objects.select_related("employee", "employee__department", "employee__user").filter(pk=pk).first()
        if not payment:
            return Response({"detail": "Payment not found."}, status=status.HTTP_404_NOT_FOUND)
        if request.user.role == "employee" and payment.employee.user != request.user:
            return Response({"detail": "You cannot pay another employee's invoice."}, status=status.HTTP_403_FORBIDDEN)
        if payment.status == "paid":
            return Response({"detail": "This invoice is already paid."}, status=status.HTTP_400_BAD_REQUEST)
        if not settings.SSLCOMMERZ_STORE_ID or not settings.SSLCOMMERZ_STORE_PASSWORD:
            return Response({"detail": "SSLCommerz is not configured yet."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            payload, gateway_response = create_session(payment, request.user)
        except Exception as exc:
            return Response({"detail": f"Unable to initiate SSLCommerz session: {exc}"}, status=status.HTTP_502_BAD_GATEWAY)

        gateway_page = gateway_response.get("GatewayPageURL")
        if not gateway_page:
            return Response(
                {
                    "detail": gateway_response.get("failedreason") or gateway_response.get("failed_reason") or "Unable to generate payment session.",
                    "gateway_response": gateway_response,
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        payment.status = "processing"
        payment.payment_method = "sslcommerz"
        payment.ssl_session_key = gateway_response.get("sessionkey", "")
        payment.gateway_transaction_id = payload["tran_id"]
        payment.gateway_status = gateway_response.get("status", "VALID")
        payment.save(update_fields=["status", "payment_method", "ssl_session_key", "gateway_transaction_id", "gateway_status", "updated_at"])

        return Response(
            {
                "payment": PaymentSerializer(payment).data,
                "payment_url": gateway_page,
                "gateway_response": gateway_response,
            }
        )



class InvoiceDownloadView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        payment = get_object_or_404(Payment.objects.select_related("employee", "order", "employee__department"), pk=pk)
        
        # Check permission: Only admin or the employee themselves can view the invoice
        if request.user.role not in ["admin", "staff"] and payment.employee.user != request.user:
            return HttpResponseForbidden("You do not have permission to view this invoice.")
            
        context = {
            "payment": payment,
        }
        return render(request, "payments/invoice.html", context)


class PublicInvoiceDownloadView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        token = request.query_params.get("token", "")
        payment = get_object_or_404(Payment.objects.select_related("employee", "order", "employee__department"), pk=pk)

        try:
            payload = signing.loads(token, salt="payment-invoice-download", max_age=60 * 60 * 24)
        except signing.BadSignature:
            return HttpResponseForbidden("This invoice download link is invalid or expired.")

        if str(payload.get("payment_id")) != str(payment.id):
            return HttpResponseForbidden("This invoice download link does not match the requested payment.")

        return render(request, "payments/invoice.html", {"payment": payment})


def _frontend_redirect(**params):
    from django.conf import settings
    from django.shortcuts import redirect
    from urllib.parse import urlencode

    base = settings.FRONTEND_APP_URL.rstrip("/")
    query = urlencode(params)
    return redirect(f"{base}/?{query}" if query else f"{base}/")


def _extract_request_value(request, key):
    return request.data.get(key) or request.query_params.get(key)


def _build_public_invoice_token(payment):
    return signing.dumps({"payment_id": payment.id}, salt="payment-invoice-download")


def _mark_order_confirmed(payment):
    order = payment.order
    if not order:
        return None
    if order.status == "cancelled":
        order.status = "pending"
        order.save(update_fields=["status", "updated_at"])
    return order


from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes


@api_view(["POST", "GET"])
@permission_classes([permissions.AllowAny])
@csrf_exempt
def sslcommerz_success(request):
    from .sslcommerz import validate_payment

    print(f"DEBUG: SSLCommerz Success Callback received. Data: {request.data or request.query_params}")

    payment_id = _extract_request_value(request, "value_a")
    val_id = _extract_request_value(request, "val_id")
    tran_id = _extract_request_value(request, "tran_id") or ""

    if not payment_id:
        return _frontend_redirect(payment="failed", reason="payment_reference_missing")

    payment = Payment.objects.filter(pk=payment_id).first()
    if not payment:
        return _frontend_redirect(payment="failed", reason="payment_not_found")

    validation_response = {}
    if val_id:
        try:
            validation_response = validate_payment(val_id)
        except Exception:
            validation_response = {}

    status_value = (validation_response.get("status") or _extract_request_value(request, "status") or "").upper()
    if status_value in {"VALID", "VALIDATED"}:
        payment.status = "paid"
        payment.payment_method = "sslcommerz"
        payment.paid_at = timezone.now()
        payment.validation_id = val_id or payment.validation_id
        payment.gateway_transaction_id = tran_id or payment.gateway_transaction_id
        payment.gateway_status = status_value
        payment.save(update_fields=["status", "payment_method", "paid_at", "validation_id", "gateway_transaction_id", "gateway_status", "updated_at"])
        order = _mark_order_confirmed(payment)
        return _frontend_redirect(
            payment="success",
            invoice=payment.invoice_number,
            payment_id=payment.id,
            order_id=order.id if order else "",
            invoice_token=_build_public_invoice_token(payment),
        )

    payment.status = "failed"
    payment.validation_id = val_id or payment.validation_id
    payment.gateway_transaction_id = tran_id or payment.gateway_transaction_id
    payment.gateway_status = status_value or "FAILED"
    payment.save(update_fields=["status", "validation_id", "gateway_transaction_id", "gateway_status", "updated_at"])
    return _frontend_redirect(payment="failed", invoice=payment.invoice_number)


@api_view(["POST", "GET"])
@permission_classes([permissions.AllowAny])
@csrf_exempt
def sslcommerz_fail(request):
    print(f"DEBUG: SSLCommerz Fail Callback received. Data: {request.data or request.query_params}")
    payment_id = _extract_request_value(request, "value_a")
    payment = Payment.objects.filter(pk=payment_id).first()
    if payment:
        payment.status = "failed"
        payment.gateway_status = "FAILED"
        payment.save(update_fields=["status", "gateway_status", "updated_at"])
        return _frontend_redirect(payment="failed", invoice=payment.invoice_number)
    return _frontend_redirect(payment="failed")


@api_view(["POST", "GET"])
@permission_classes([permissions.AllowAny])
@csrf_exempt
def sslcommerz_cancel(request):
    print(f"DEBUG: SSLCommerz Cancel Callback received. Data: {request.data or request.query_params}")
    payment_id = _extract_request_value(request, "value_a")
    payment = Payment.objects.filter(pk=payment_id).first()
    if payment:
        payment.status = "cancelled"
        payment.gateway_status = "CANCELLED"
        payment.save(update_fields=["status", "gateway_status", "updated_at"])
        return _frontend_redirect(payment="cancelled", invoice=payment.invoice_number)
    return _frontend_redirect(payment="cancelled")


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def sslcommerz_ipn(request):
    payment_id = request.data.get("value_a")
    payment = Payment.objects.filter(pk=payment_id).first()
    if payment:
        payment.gateway_status = request.data.get("status", payment.gateway_status or "IPN")
        payment.validation_id = request.data.get("val_id", payment.validation_id)
        payment.gateway_transaction_id = request.data.get("tran_id", payment.gateway_transaction_id)
        payment.save(update_fields=["gateway_status", "validation_id", "gateway_transaction_id", "updated_at"])
    return Response({"status": "ok"})
