from django.contrib import admin
from .models import Payment

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('payment_id', 'employee', 'amount', 'payment_method', 'status', 'date')
    list_filter = ('status', 'payment_method', 'date')
    search_fields = ('employee__name', 'payment_id')
