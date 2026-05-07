from django.db import models


class Order(models.Model):
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("preparing", "Preparing"),
        ("served", "Served"),
        ("cancelled", "Cancelled"),
    )

    employee = models.ForeignKey("employees.Employee", on_delete=models.CASCADE, related_name="orders")
    order_date = models.DateTimeField(auto_now_add=True, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending", db_index=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "orders"
        ordering = ["-order_date"]
        indexes = [
            models.Index(fields=["status", "order_date"]),
            models.Index(fields=["employee", "order_date"]),
        ]

    def __str__(self):
        return f"Order #{self.id} - {self.employee.name} ({self.status})"

    def calculate_total(self):
        total = sum(item.quantity * item.item_price for item in self.items.all())
        self.total_amount = total
        self.save(update_fields=["total_amount", "updated_at"])
        return total


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    menu_item = models.ForeignKey("menu.MenuItem", on_delete=models.CASCADE, related_name="order_items")
    quantity = models.PositiveIntegerField(default=1)
    item_price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = "order_items"
        indexes = [models.Index(fields=["order", "menu_item"])]

    def __str__(self):
        return f"{self.quantity}x {self.menu_item.food_name}"

    def save(self, *args, **kwargs):
        if not self.item_price:
            self.item_price = self.menu_item.price
        super().save(*args, **kwargs)

    @property
    def total_price(self):
        return self.quantity * self.item_price
