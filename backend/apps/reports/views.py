from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Count, OuterRef, Prefetch, Subquery, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from datetime import timedelta

from apps.departments.models import Department
from apps.employees.models import Employee
from apps.menu.models import MenuItem
from apps.orders.models import Order, OrderItem
from apps.payments.models import Payment


class IsAdminOrStaffUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ["admin", "staff"]


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"


class DashboardStatsView(APIView):
    permission_classes = [IsAdminOrStaffUser]

    def get(self, request):
        today = timezone.now().date()
        month_start = today.replace(day=1)
        return Response({
            "total_employees": Employee.objects.filter(is_active=True).count(),
            "total_orders_today": Order.objects.filter(order_date__date=today).count(),
            "pending_orders": Order.objects.filter(status__in=["pending", "preparing"]).count(),
            "monthly_revenue": float(Payment.objects.filter(status="paid", billing_month__gte=month_start).aggregate(total=Sum("amount"))["total"] or 0),
            "total_departments": Department.objects.count(),
            "total_menu_items": MenuItem.objects.filter(is_available=True).count(),
            "staff_served_today": Order.objects.filter(order_date__date=today, status="served").count(),
        })


class DailyMealReportView(APIView):
    permission_classes = [IsAdminOrStaffUser]

    def get(self, request):
        report_date = request.query_params.get("date") or timezone.now().date()
        items = OrderItem.objects.filter(order__order_date__date=report_date).values(
            "menu_item__food_name", "menu_item__meal_type"
        ).annotate(total_quantity=Sum("quantity"), total_revenue=Sum("item_price")).order_by("-total_quantity")
        return Response({"date": str(report_date), "items": list(items)})


class MonthlyEmployeeReportView(APIView):
    permission_classes = [IsAdminOrStaffUser]

    def get(self, request):
        today = timezone.now().date()
        month = int(request.query_params.get("month", today.month))
        year = int(request.query_params.get("year", today.year))
        month_start = today.replace(year=year, month=month, day=1)
        month_end = month_start.replace(year=year + 1, month=1, day=1) if month == 12 else month_start.replace(month=month + 1, day=1)
        employees = Order.objects.filter(order_date__date__gte=month_start, order_date__date__lt=month_end).values(
            "employee__name", "employee__employee_id", "employee__department__department_name"
        ).annotate(total_orders=Count("id"), total_amount=Sum("total_amount")).order_by("-total_amount")
        return Response({"month": month_start.strftime("%B %Y"), "employees": list(employees)})


class FoodConsumptionReportView(APIView):
    permission_classes = [IsAdminOrStaffUser]

    def get(self, request):
        days = int(request.query_params.get("days", 7))
        start_date = timezone.now().date() - timedelta(days=days)
        items = OrderItem.objects.filter(order__order_date__date__gte=start_date).values(
            "menu_item__food_name", "menu_item__meal_type"
        ).annotate(total_quantity=Sum("quantity")).order_by("-total_quantity")
        return Response({"period": f"Last {days} days", "items": list(items)})


class WeeklyTrendView(APIView):
    permission_classes = [IsAdminOrStaffUser]

    def get(self, request):
        today = timezone.now().date()
        start_date = today - timedelta(days=6)

        order_counts = {
            item["day"]: item["orders"]
            for item in Order.objects.filter(order_date__date__gte=start_date, order_date__date__lte=today)
            .annotate(day=TruncDate("order_date"))
            .values("day")
            .annotate(orders=Count("id"))
        }
        revenue_totals = {
            item["day"]: float(item["revenue"] or 0)
            for item in Payment.objects.filter(date__date__gte=start_date, date__date__lte=today, status="paid")
            .annotate(day=TruncDate("date"))
            .values("day")
            .annotate(revenue=Sum("amount"))
        }

        trends = []
        for i in range(6, -1, -1):
            current_date = today - timedelta(days=i)
            trends.append(
                {
                    "date": current_date.strftime("%Y-%m-%d"),
                    "orders": order_counts.get(current_date, 0),
                    "revenue": revenue_totals.get(current_date, 0.0),
                }
            )
        return Response({"trends": trends})


class AdminOrderSalesReportView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        latest_payment = Payment.objects.filter(order=OuterRef("pk")).order_by("-date")
        queryset = (
            Order.objects.select_related("employee", "employee__user")
            .prefetch_related(
                Prefetch(
                    "items",
                    queryset=OrderItem.objects.select_related("menu_item").order_by("id"),
                )
            )
            .annotate(
                latest_payment_method=Subquery(latest_payment.values("payment_method")[:1]),
                latest_payment_status=Subquery(latest_payment.values("status")[:1]),
            )
            .order_by("-order_date")
        )

        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")
        status_filter = request.query_params.get("status")
        payment_method_filter = request.query_params.get("payment_method")

        if start_date:
            queryset = queryset.filter(order_date__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(order_date__date__lte=end_date)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if payment_method_filter:
            queryset = queryset.filter(latest_payment_method=payment_method_filter)

        payment_method_labels = dict(Payment.METHOD_CHOICES)
        report_rows = []
        for order in queryset:
            items = list(order.items.all())
            report_rows.append(
                {
                    "order_id": order.id,
                    "employee_name": order.employee.name,
                    "food_items": ", ".join(item.menu_item.food_name for item in items),
                    "quantity": sum(item.quantity for item in items),
                    "total_price": float(order.total_amount or 0),
                    "payment_method": payment_method_labels.get(order.latest_payment_method, order.latest_payment_method or "Not assigned"),
                    "payment_method_key": order.latest_payment_method or "",
                    "status": "Completed" if order.status == "served" else order.get_status_display(),
                    "status_key": order.status,
                    "created_at": order.order_date.isoformat(),
                }
            )
        return Response(report_rows)
