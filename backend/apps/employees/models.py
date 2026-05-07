from django.db import models
from django.conf import settings


class Employee(models.Model):
    SHIFT_CHOICES = (
        ("morning", "Morning"),
        ("afternoon", "Afternoon"),
        ("night", "Night"),
    )

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="employee_profile")
    employee_id = models.CharField(max_length=20, unique=True, db_index=True)
    name = models.CharField(max_length=150, db_index=True)
    email = models.EmailField(db_index=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    favorite_food = models.CharField(max_length=150, blank=True, default="")
    profile_image = models.FileField(upload_to="profile_images/", blank=True, null=True)
    department = models.ForeignKey(
        "departments.Department",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="employees",
    )
    shift = models.CharField(max_length=20, choices=SHIFT_CHOICES, default="morning")
    wallet_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "employees"
        ordering = ["name"]
        indexes = [
            models.Index(fields=["employee_id"]),
            models.Index(fields=["department", "shift"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return f"{self.employee_id} - {self.name}"
