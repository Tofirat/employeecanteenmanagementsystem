from django.db import models
from django.utils import timezone
import uuid


class Payment(models.Model):
    STATUS_CHOICES = (
        ("unpaid", "Unpaid"),
        ("paid", "Paid"),
        ("refunded", "Refunded"),
        ("overdue", "Overdue"),
        ("failed", "Failed"),
        ("cancelled", "Cancelled"),
        ("processing", "Processing"),
    )

    METHOD_CHOICES = (
        ("monthly_bill", "Monthly Bill"),
        ("cash", "Cash"),
        ("card", "Card"),
        ("wallet", "Wallet"),
        ("sslcommerz", "SSLCommerz"),
    )

    payment_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    employee = models.ForeignKey("employees.Employee", on_delete=models.CASCADE, related_name="payments")
    order = models.ForeignKey("orders.Order", on_delete=models.SET_NULL, related_name="payments", null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="unpaid", db_index=True)
    payment_method = models.CharField(max_length=20, choices=METHOD_CHOICES, default="monthly_bill")
    billing_month = models.DateField(default=timezone.now, db_index=True)
    invoice_number = models.CharField(max_length=40, unique=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    paid_at = models.DateTimeField(blank=True, null=True)
    ssl_session_key = models.CharField(max_length=120, blank=True)
    gateway_transaction_id = models.CharField(max_length=120, blank=True)
    validation_id = models.CharField(max_length=120, blank=True)
    gateway_status = models.CharField(max_length=40, blank=True)
    refunded_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    refund_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    refunded_at = models.DateTimeField(blank=True, null=True)
    refund_note = models.CharField(max_length=255, blank=True)
    date = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "payments"
        ordering = ["-date"]
        indexes = [
            models.Index(fields=["status", "billing_month"]),
            models.Index(fields=["employee", "billing_month"]),
        ]

    def __str__(self):
        return f"Payment {self.payment_id} - {self.employee.name} - ${self.amount}"

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            month_label = self.billing_month.strftime("%Y%m") if self.billing_month else timezone.now().strftime("%Y%m")
            self.invoice_number = f"INV-{month_label}-{str(self.payment_id).split('-')[0].upper()}"
        super().save(*args, **kwargs)
