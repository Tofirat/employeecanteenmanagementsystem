from django.contrib.auth import logout
from django.utils import timezone
from rest_framework import filters, status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Announcement, Category, Employee, Feedback, MealSchedule, MenuItem, Order, Payment
from .permissions import IsAdminManagerOrReadOnly, IsAdminOrManager, IsFeedbackOwnerOrStaff, IsOrderOwnerOrStaff
from .serializers import (
    AnnouncementSerializer,
    CategorySerializer,
    DashboardSerializer,
    EmployeeSerializer,
    EmployeeUserCreateSerializer,
    FeedbackSerializer,
    LoginSerializer,
    MealScheduleSerializer,
    MenuItemSerializer,
    OrderSerializer,
    PaymentSerializer,
    ReportSerializer,
    UserSerializer,
    build_auth_payload,
    build_dashboard_payload,
    build_reports_payload,
)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(build_auth_payload(serializer.validated_data["user"]))


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.select_related("user").all()
    serializer_class = EmployeeSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["full_name", "employee_code", "department", "email"]
    ordering_fields = ["full_name", "wallet_balance", "created_at"]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy", "create_with_user"]:
            return [IsAdminOrManager()]
        return [IsAuthenticated()]

    @action(detail=False, methods=["post"], url_path="create-with-user")
    def create_with_user(self, request):
        serializer = EmployeeUserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        employee = serializer.save()
        return Response(EmployeeSerializer(employee).data, status=status.HTTP_201_CREATED)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminManagerOrReadOnly]


class MenuItemViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.select_related("category").all()
    serializer_class = MenuItemSerializer
    permission_classes = [IsAdminManagerOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "description", "category__name"]
    ordering_fields = ["name", "price", "created_at"]

    def get_queryset(self):
        queryset = super().get_queryset()
        category_id = self.request.query_params.get("category")
        available = self.request.query_params.get("available")
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        if available is not None:
            queryset = queryset.filter(is_available=available.lower() == "true")
        return queryset


class MealScheduleViewSet(viewsets.ModelViewSet):
    queryset = MealSchedule.objects.all()
    serializer_class = MealScheduleSerializer
    permission_classes = [IsAdminManagerOrReadOnly]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["service_date", "start_time", "created_at"]


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.select_related("employee", "schedule", "ordered_by").prefetch_related("items__menu_item").all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["employee__full_name", "employee__employee_code", "status"]
    ordering_fields = ["created_at", "total_amount", "status"]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.role == "employee":
            employee = getattr(user, "employee_profile", None)
            queryset = queryset.filter(employee=employee) if employee else queryset.none()
        employee_id = self.request.query_params.get("employee")
        status_value = self.request.query_params.get("status")
        if employee_id and user.role in ["admin", "manager"]:
            queryset = queryset.filter(employee_id=employee_id)
        if status_value:
            queryset = queryset.filter(status=status_value)
        return queryset

    def perform_create(self, serializer):
        serializer.save()

    def get_permissions(self):
        if self.action in ["update", "partial_update", "destroy", "advance_status", "record_payment"]:
            return [IsAuthenticated(), IsOrderOwnerOrStaff()]
        return [IsAuthenticated()]

    @action(detail=True, methods=["post"])
    def advance_status(self, request, pk=None):
        order = self.get_object()
        if request.user.role not in ["admin", "manager"]:
            return Response({"detail": "Only admin or manager can advance order status."}, status=status.HTTP_403_FORBIDDEN)
        transitions = {
            "pending": "approved",
            "approved": "preparing",
            "preparing": "ready",
            "ready": "completed",
        }
        if order.status not in transitions:
            return Response({"detail": "Order cannot be advanced."}, status=status.HTTP_400_BAD_REQUEST)
        order.status = transitions[order.status]
        order.save(update_fields=["status", "updated_at"])
        return Response(self.get_serializer(order).data)

    @action(detail=True, methods=["post"])
    def record_payment(self, request, pk=None):
        order = self.get_object()
        payment, _ = Payment.objects.get_or_create(order=order, defaults={"amount": order.total_amount})
        serializer = PaymentSerializer(payment, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        payment = serializer.save(amount=order.total_amount)
        if payment.status == "paid" and payment.paid_at is None:
            payment.paid_at = timezone.now()
            payment.save(update_fields=["paid_at", "updated_at"])
            if payment.method == "wallet" and order.employee.wallet_balance >= payment.amount:
                order.employee.wallet_balance -= payment.amount
                order.employee.save(update_fields=["wallet_balance", "updated_at"])
        return Response(PaymentSerializer(payment).data)


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Payment.objects.select_related("order", "order__employee").all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["created_at", "amount", "paid_at"]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.role == "employee":
            employee = getattr(user, "employee_profile", None)
            queryset = queryset.filter(order__employee=employee) if employee else queryset.none()
        return queryset


class FeedbackViewSet(viewsets.ModelViewSet):
    queryset = Feedback.objects.select_related("employee").all()
    serializer_class = FeedbackSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["created_at", "rating"]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.role == "employee":
            employee = getattr(user, "employee_profile", None)
            queryset = queryset.filter(employee=employee) if employee else queryset.none()
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == "employee":
            employee = getattr(user, "employee_profile", None)
            serializer.save(employee=employee)
        else:
            serializer.save()

    def get_permissions(self):
        if self.action in ["update", "partial_update", "destroy"]:
            return [IsAuthenticated(), IsFeedbackOwnerOrStaff()]
        return [IsAuthenticated()]


class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAdminManagerOrReadOnly]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["published_at", "created_at"]

    def get_queryset(self):
        queryset = super().get_queryset()
        active_only = self.request.query_params.get("active")
        if active_only is not None:
            queryset = queryset.filter(is_active=active_only.lower() == "true")
        return queryset


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = DashboardSerializer(build_dashboard_payload())
        return Response(serializer.data)


class ReportsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrManager]

    def get(self, request):
        serializer = ReportSerializer(build_reports_payload())
        return Response(serializer.data)

