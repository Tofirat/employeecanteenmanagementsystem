from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = (
        ("admin", "Administrator"),
        ("staff", "Canteen Staff"),
        ("employee", "Employee"),
    )

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="employee", db_index=True)
    phone = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        db_table = "users"
        ordering = ["-date_joined"]
        indexes = [models.Index(fields=["role"]), models.Index(fields=["email"])]

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    @property
    def is_admin_user(self):
        return self.role == "admin"

    @property
    def is_canteen_staff(self):
        return self.role == "staff"

    @property
    def is_employee(self):
        return self.role == "employee"
