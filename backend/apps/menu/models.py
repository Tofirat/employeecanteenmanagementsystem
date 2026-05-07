from django.db import models


class MenuItem(models.Model):
    MEAL_TYPE_CHOICES = (
        ("breakfast", "Breakfast"),
        ("lunch", "Lunch"),
        ("dinner", "Dinner"),
        ("snack", "Snack"),
    )

    food_name = models.CharField(max_length=200, db_index=True)
    meal_type = models.CharField(max_length=20, choices=MEAL_TYPE_CHOICES, db_index=True)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    availability_date = models.DateField(null=True, blank=True, db_index=True)
    is_available = models.BooleanField(default=True, db_index=True)
    image = models.FileField(upload_to="menu_images/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "menu_items"
        ordering = ["meal_type", "food_name"]
        indexes = [
            models.Index(fields=["meal_type", "is_available"]),
            models.Index(fields=["availability_date"]),
        ]

    def __str__(self):
        return f"{self.food_name} ({self.get_meal_type_display()})"
