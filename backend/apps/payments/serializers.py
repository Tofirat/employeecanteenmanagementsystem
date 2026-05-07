from rest_framework import serializers

from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.name", read_only=True)
    order_id = serializers.IntegerField(source="order.id", read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id",
            "payment_id",
            "employee",
            "employee_name",
            "order",
            "order_id",
            "amount",
            "status",
            "payment_method",
            "billing_month",
            "invoice_number",
            "notes",
            "paid_at",
            "ssl_session_key",
            "gateway_transaction_id",
            "validation_id",
            "gateway_status",
            "refunded_amount",
            "refund_fee",
            "refunded_at",
            "refund_note",
            "date",
            "updated_at",
        ]
        read_only_fields = [
            "payment_id",
            "invoice_number",
            "paid_at",
            "ssl_session_key",
            "gateway_transaction_id",
            "validation_id",
            "gateway_status",
            "refunded_amount",
            "refund_fee",
            "refunded_at",
            "date",
            "updated_at",
        ]
