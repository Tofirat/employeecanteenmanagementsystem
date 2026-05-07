from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'employee', 'status', 'total_amount', 'order_date']
    list_filter = ['status', 'order_date']
    search_fields = ['employee__name']
    inlines = [OrderItemInline]
