from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("payments", "0003_payment_gateway_fields_and_ssl_method"),
    ]

    operations = [
        migrations.AddField(
            model_name="payment",
            name="refund_fee",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name="payment",
            name="refund_note",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="payment",
            name="refunded_amount",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name="payment",
            name="refunded_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="payment",
            name="status",
            field=models.CharField(
                choices=[
                    ("unpaid", "Unpaid"),
                    ("paid", "Paid"),
                    ("refunded", "Refunded"),
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
    ]
