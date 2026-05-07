# Generated manually for SSLCommerz payment tracking

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("payments", "0002_payment_billing_month_payment_invoice_number_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="payment",
            name="payment_method",
            field=models.CharField(
                choices=[
                    ("monthly_bill", "Monthly Bill"),
                    ("cash", "Cash"),
                    ("card", "Card"),
                    ("wallet", "Wallet"),
                    ("sslcommerz", "SSLCommerz"),
                ],
                default="monthly_bill",
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="payment",
            name="status",
            field=models.CharField(
                choices=[
                    ("unpaid", "Unpaid"),
                    ("paid", "Paid"),
                    ("overdue", "Overdue"),
                    ("failed", "Failed"),
                    ("cancelled", "Cancelled"),
                    ("processing", "Processing"),
                ],
                db_index=True,
                default="unpaid",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="payment",
            name="gateway_status",
            field=models.CharField(blank=True, max_length=40),
        ),
        migrations.AddField(
            model_name="payment",
            name="gateway_transaction_id",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="payment",
            name="ssl_session_key",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="payment",
            name="updated_at",
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AddField(
            model_name="payment",
            name="validation_id",
            field=models.CharField(blank=True, max_length=120),
        ),
    ]
