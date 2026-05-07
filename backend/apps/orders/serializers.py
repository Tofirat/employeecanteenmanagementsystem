from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from apps.menu.models import MenuItem
from apps.payments.models import Payment
from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    food_name = serializers.CharField(source="menu_item.food_name", read_only=True)
    meal_type = serializers.CharField(source="menu_item.meal_type", read_only=True)
    image = serializers.CharField(source="menu_item.image", read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "menu_item", "food_name", "meal_type", "image", "quantity", "item_price"]
        read_only_fields = ["id", "item_price"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    employee_name = serializers.CharField(source="employee.name", read_only=True)
    department_name = serializers.CharField(source="employee.department.department_name", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    payment_status = serializers.SerializerMethodField()
    latest_payment_id = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "employee",
            "employee_name",
            "department_name",
            "order_date",
            "status",
            "status_display",
            "total_amount",
            "notes",
            "payment_status",
            "latest_payment_id",
            "items",
            "updated_at",
        ]
        read_only_fields = ["id", "order_date", "total_amount", "updated_at", "payment_status", "latest_payment_id"]

    def get_payment_status(self, obj):
        payments = getattr(obj, "_prefetched_objects_cache", {}).get("payments")
        if payments is not None:
            latest = max(payments, key=lambda payment: payment.date, default=None)
        else:
            latest = obj.payments.order_by("-date").first()
        return latest.status if latest else "unpaid"

    def get_latest_payment_id(self, obj):
        generated_payment_id = getattr(obj, "_generated_payment_id", None)
        if generated_payment_id:
            return generated_payment_id
        payments = getattr(obj, "_prefetched_objects_cache", {}).get("payments")
        if payments is not None:
            latest = max(payments, key=lambda payment: payment.date, default=None)
        else:
            latest = obj.payments.order_by("-date").first()
        return latest.id if latest else None


class OrderCreateSerializer(serializers.Serializer):
    employee = serializers.IntegerField(required=False)
    items = serializers.ListField(child=serializers.DictField(), min_length=1)
    notes = serializers.CharField(required=False, allow_blank=True)
    payment_method = serializers.CharField(required=False, default="monthly_bill")

    def validate_items(self, value):
        for item in value:
            if "menu_item" not in item or "quantity" not in item:
                raise serializers.ValidationError("Each item must include menu_item and quantity.")
            if int(item["quantity"]) < 1:
                raise serializers.ValidationError("Quantity must be at least 1.")
        return value

    def create(self, validated_data):
        from apps.employees.models import Employee

        request = self.context["request"]
        user = request.user
        employee_id = validated_data.get("employee")
        frontend_method = validated_data.get("payment_method", "monthly_bill")

        # Map frontend methods to backend expected methods
        # User wants both 'card' and 'mobile' to use SSLCommerz
        if frontend_method in ["card", "mobile"]:
            payment_method = "sslcommerz"
        else:
            payment_method = frontend_method

        if user.role == "employee":
            employee = Employee.objects.get(user=user)
        else:
            employee = Employee.objects.get(id=employee_id)

        # Determine payment status based on method
        # methods: monthly_bill, cash, card, wallet, sslcommerz
        is_instant = payment_method in ["wallet"] # Removed 'card' from instant if it's SSLCommerz
        payment_status = "paid" if is_instant else "unpaid"
        if payment_method == "sslcommerz":
            payment_status = "processing"
        
        paid_at = timezone.now() if is_instant else None

        with transaction.atomic():
            order = Order.objects.create(employee=employee, notes=validated_data.get("notes", ""))
            total = 0
            for item_data in validated_data["items"]:
                menu_item = MenuItem.objects.get(id=item_data["menu_item"])
                quantity = int(item_data["quantity"])
                OrderItem.objects.create(order=order, menu_item=menu_item, quantity=quantity, item_price=menu_item.price)
                total += menu_item.price * quantity
            order.total_amount = total
            order.save(update_fields=["total_amount", "updated_at"])
            
            # Create payment record
            payment = Payment.objects.create(
                employee=employee,
                order=order,
                amount=total,
                payment_method=payment_method,
                status=payment_status,
                paid_at=paid_at,
                billing_month=timezone.now().date().replace(day=1),
                notes=f"Auto-generated from order placement. Method: {frontend_method}",
            )
            # Tag the payment to the order instance for the serializer to find it easily if needed
            order._generated_payment_id = payment.id
            return order


class OrderStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ["status"]
