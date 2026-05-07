from django.db import models


class Department(models.Model):
    department_name = models.CharField(max_length=100, unique=True, db_index=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "departments"
        ordering = ["department_name"]
        indexes = [models.Index(fields=["department_name"])]

    def __str__(self):
        return self.department_name
