from django.contrib.auth import authenticate
from django.db import transaction
from django.db.models import Avg, Count, Sum
from rest_framework import serializers
from rest_framework.authtoken.models import Token

from .models import Announcement, Category, Employee, Feedback, MealSchedule, MenuItem, Order, OrderItem, Payment, User


class UserSerializer(serializers.ModelSerializer):
    employee_id = serializers.IntegerField(source="employee_profile.id", read_only=True)
    employee_name = serializers.CharField(source="employee_profile.full_name", read_only=True)

    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name", "role", "employee_id", "employee_name")


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(username=attrs.get("username"), password=attrs.get("password"))
        if not user:
            raise serializers.ValidationError("Invalid username or password.")
        attrs["user"] = user
        return attrs


class EmployeeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source="user", write_only=True, required=False, allow_null=True)

    class Meta:
        model = Employee
        fields = ("id", "user", "user_id", "full_name", "employee_code", "department", "email", "phone", "wallet_balance", "created_at", "updated_at")


class EmployeeUserCreateSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField()
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, default="employee")
    full_name = serializers.CharField()
    employee_code = serializers.CharField()
    department = serializers.CharField()
    phone = serializers.CharField(required=False, allow_blank=True)
    wallet_balance = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)

    @transaction.atomic
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            password=validated_data["password"],
            email=validated_data["email"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            role=validated_data.get("role", "employee"),
        )
        employee = Employee.objects.create(
            user=user,
            full_name=validated_data["full_name"],
            employee_code=validated_data["employee_code"],
            department=validated_data["department"],
            email=validated_data["email"],
            phone=validated_data.get("phone", ""),
            wallet_balance=validated_data.get("wallet_balance", 0),
        )
        return employee


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"


class MenuItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = MenuItem
        fields = "__all__"


class MealScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = MealSchedule
        fields = "__all__"


class PaymentSerializer(serializers.ModelSerializer):
    order_employee_name = serializers.CharField(source="order.employee.full_name", read_only=True)

    class Meta:
        model = Payment
        fields = "__all__"
        read_only_fields = ("amount",)


class OrderItemSerializer(serializers.ModelSerializer):
    menu_item_name = serializers.CharField(source="menu_item.name", read_only=True)

    class Meta:
        model = OrderItem
        fields = ("id", "menu_item", "menu_item_name", "quantity", "unit_price", "line_total")
        read_only_fields = ("unit_price", "line_total")


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    employee_name = serializers.CharField(source="employee.full_name", read_only=True)
    schedule_title = serializers.CharField(source="schedule.title", read_only=True)
    payment = PaymentSerializer(read_only=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "employee",
            "employee_name",
            "ordered_by",
            "schedule",
            "schedule_title",
            "status",
            "notes",
            "total_amount",
            "items",
            "payment",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("total_amount", "ordered_by", "created_at", "updated_at")

    @transaction.atomic
    def create(self, validated_data):
        request = self.context.get("request")
        items_data = validated_data.pop("items", [])
        user = request.user if request else None
        if user and user.role == "employee":
            employee = getattr(user, "employee_profile", None)
            if employee is None:
                raise serializers.ValidationError("Employee account is not linked to an employee profile.")
            validated_data["employee"] = employee
        order = Order.objects.create(ordered_by=user, **validated_data)
        for item_data in items_data:
            menu_item = item_data["menu_item"]
            quantity = item_data.get("quantity", 1)
            OrderItem.objects.create(
                order=order,
                menu_item=menu_item,
                quantity=quantity,
                unit_price=menu_item.price,
                line_total=menu_item.price * quantity,
            )
        order.recalculate_total()
        Payment.objects.get_or_create(order=order, defaults={"amount": order.total_amount})
        return order

    @transaction.atomic
    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                menu_item = item_data["menu_item"]
                quantity = item_data.get("quantity", 1)
                OrderItem.objects.create(
                    order=instance,
                    menu_item=menu_item,
                    quantity=quantity,
                    unit_price=menu_item.price,
                    line_total=menu_item.price * quantity,
                )
        instance.recalculate_total()
        Payment.objects.update_or_create(order=instance, defaults={"amount": instance.total_amount})
        return instance


class FeedbackSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.full_name", read_only=True)

    class Meta:
        model = Feedback
        fields = "__all__"


class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = "__all__"


class DashboardSerializer(serializers.Serializer):
    total_employees = serializers.IntegerField()
    total_menu_items = serializers.IntegerField()
    active_schedules = serializers.IntegerField()
    total_orders = serializers.IntegerField()
    pending_orders = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    paid_orders = serializers.IntegerField()
    average_feedback = serializers.FloatField()
    top_categories = serializers.ListField()
    recent_orders = serializers.ListField()


class ReportSerializer(serializers.Serializer):
    orders_by_status = serializers.ListField()
    revenue_by_method = serializers.ListField()
    department_spend = serializers.ListField()
    top_menu_items = serializers.ListField()
    payment_status_breakdown = serializers.ListField()


def build_dashboard_payload():
    top_categories = Category.objects.annotate(item_count=Count("menu_items")).values("name", "item_count").order_by("-item_count")[:5]
    recent_orders = Order.objects.select_related("employee").values("id", "employee__full_name", "status", "total_amount", "created_at").order_by("-created_at")[:6]
    return {
        "total_employees": Employee.objects.count(),
        "total_menu_items": MenuItem.objects.count(),
        "active_schedules": MealSchedule.objects.filter(is_active=True).count(),
        "total_orders": Order.objects.count(),
        "pending_orders": Order.objects.filter(status__in=["pending", "approved", "preparing"]).count(),
        "total_revenue": Payment.objects.filter(status="paid").aggregate(total=Sum("amount"))["total"] or 0,
        "paid_orders": Payment.objects.filter(status="paid").count(),
        "average_feedback": round(Feedback.objects.aggregate(avg=Avg("rating"))["avg"] or 0, 1),
        "top_categories": list(top_categories),
        "recent_orders": list(recent_orders),
    }


def build_reports_payload():
    orders_by_status = list(Order.objects.values("status").annotate(total=Count("id")).order_by("status"))
    revenue_by_method = list(Payment.objects.filter(status="paid").values("method").annotate(total=Sum("amount")).order_by("method"))
    department_spend = list(Order.objects.values("employee__department").annotate(total=Sum("total_amount"), orders=Count("id")).order_by("-total")[:8])
    top_menu_items = list(OrderItem.objects.values("menu_item__name").annotate(quantity=Sum("quantity"), revenue=Sum("line_total")).order_by("-quantity")[:8])
    payment_status_breakdown = list(Payment.objects.values("status").annotate(total=Count("id")).order_by("status"))
    return {
        "orders_by_status": orders_by_status,
        "revenue_by_method": revenue_by_method,
        "department_spend": department_spend,
        "top_menu_items": top_menu_items,
        "payment_status_breakdown": payment_status_breakdown,
    }


def build_auth_payload(user):
    token, _ = Token.objects.get_or_create(user=user)
    return {"token": token.key, "user": UserSerializer(user).data}

