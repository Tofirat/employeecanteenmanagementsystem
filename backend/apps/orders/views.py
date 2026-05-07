from decimal import Decimal, ROUND_HALF_UP

from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Order
from .serializers import OrderCreateSerializer, OrderSerializer, OrderStatusUpdateSerializer


class OrderViewSet(viewsets.ModelViewSet):
    queryset = (
        Order.objects.select_related("employee", "employee__department")
        .prefetch_related("items", "items__menu_item", "payments")
        .all()
    )
    serializer_class = OrderSerializer

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == "create":
            return OrderCreateSerializer
        if self.action == "status":
            return OrderStatusUpdateSerializer
        return OrderSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Order.objects.select_related("employee", "employee__department").prefetch_related(
            "items", "items__menu_item", "payments"
        )
        if user.role == "employee":
            queryset = queryset.filter(employee__user=user)
        order_status = self.request.query_params.get("status")
        date = self.request.query_params.get("date")
        employee_id = self.request.query_params.get("employee")
        if order_status:
            queryset = queryset.filter(status=order_status)
        if date:
            queryset = queryset.filter(order_date__date=date)
        if employee_id and user.role in ["admin", "staff"]:
            queryset = queryset.filter(employee_id=employee_id)
        return queryset.order_by("-order_date")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["patch"], url_path="cancel")
    def cancel(self, request, pk=None):
        order = self.get_object()
        user = request.user

        if user.role == "employee" and order.employee.user_id != user.id:
            return Response({"detail": "You can only cancel your own orders."}, status=status.HTTP_403_FORBIDDEN)

        if order.status == "cancelled":
            return Response({"detail": "This order has already been cancelled."}, status=status.HTTP_400_BAD_REQUEST)

        if order.status == "served":
            return Response({"detail": "Served orders cannot be cancelled."}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        minutes_since_order = (now - order.order_date).total_seconds() / 60
        latest_payment = order.payments.order_by("-date").first()

        refund_rate = Decimal("0.00")
        refund_note = "Order cancelled before payment completion."

        if order.status == "pending":
            if minutes_since_order > 5 and user.role == "employee":
                return Response(
                    {"detail": "Pending orders can be cancelled with full refund within 5 minutes."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            refund_rate = Decimal("1.00")
            refund_note = "Full refund because cancellation happened before preparation started."
        elif order.status == "preparing":
            refund_rate = Decimal("0.98")
            refund_note = "Preparing orders refund 98% and keep a 2% service deduction."

        order.status = "cancelled"
        order.updated_at = now
        order.save(update_fields=["status", "updated_at"])

        refund_amount = Decimal("0.00")
        refund_fee = Decimal("0.00")

        if latest_payment:
            current_notes = (latest_payment.notes or "").strip()
            if latest_payment.status == "paid":
                refund_amount = (latest_payment.amount * refund_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                refund_fee = (latest_payment.amount - refund_amount).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                latest_payment.status = "refunded"
                latest_payment.refunded_amount = refund_amount
                latest_payment.refund_fee = refund_fee
                latest_payment.refunded_at = now
                latest_payment.refund_note = refund_note
                latest_payment.notes = f"{current_notes}\n{refund_note}".strip()
                latest_payment.save(
                    update_fields=[
                        "status",
                        "refunded_amount",
                        "refund_fee",
                        "refunded_at",
                        "refund_note",
                        "notes",
                        "updated_at",
                    ]
                )
            elif latest_payment.status in {"processing", "unpaid", "failed", "overdue"}:
                latest_payment.status = "cancelled"
                latest_payment.refunded_amount = Decimal("0.00")
                latest_payment.refund_fee = Decimal("0.00")
                latest_payment.refund_note = "Order cancelled before successful payment."
                latest_payment.notes = f"{current_notes}\nOrder cancelled before successful payment.".strip()
                latest_payment.save(
                    update_fields=["status", "refunded_amount", "refund_fee", "refund_note", "notes", "updated_at"]
                )

        refreshed_order = (
            Order.objects.select_related("employee", "employee__department")
            .prefetch_related("items", "items__menu_item", "payments")
            .get(pk=order.pk)
        )

        return Response(
            {
                "order": OrderSerializer(refreshed_order).data,
                "refund": {
                    "refund_amount": str(refund_amount),
                    "refund_fee": str(refund_fee),
                    "refund_note": refund_note,
                },
            }
        )

    @action(detail=True, methods=["patch"], url_path="status")
    def status(self, request, pk=None):
        order = self.get_object()
        if request.user.role not in ["admin", "staff"]:
            return Response(
                {"detail": "Only canteen staff or admin can update order status."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = OrderStatusUpdateSerializer(order, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_at=timezone.now())
        return Response(OrderSerializer(order).data)

    @action(detail=False, methods=["get"], url_path="today")
    def today(self, request):
        today = timezone.now().date()
        queryset = self.get_queryset().filter(order_date__date=today)
        return Response(OrderSerializer(queryset, many=True).data)
