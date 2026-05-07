from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import Announcement, Category, Employee, Feedback, MealSchedule, MenuItem, Order, OrderItem, Payment, User


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (("Canteen", {"fields": ("role",)}),)
    list_display = ("username", "email", "role", "is_staff", "is_active")
    list_filter = ("role", "is_staff", "is_active")


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ("employee_code", "full_name", "department", "wallet_balance", "user")
    search_fields = ("employee_code", "full_name", "email")
    list_filter = ("department",)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "description")
    search_fields = ("name",)


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "price", "is_available", "is_vegetarian")
    search_fields = ("name",)
    list_filter = ("category", "is_available", "is_vegetarian")


@admin.register(MealSchedule)
class MealScheduleAdmin(admin.ModelAdmin):
    list_display = ("title", "shift", "service_date", "start_time", "end_time", "is_active")
    list_filter = ("shift", "is_active", "service_date")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "employee", "status", "total_amount", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("employee__full_name", "employee__employee_code")
    inlines = [OrderItemInline]


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("order", "method", "status", "amount", "paid_at")
    list_filter = ("method", "status")
    search_fields = ("transaction_reference", "order__employee__full_name")


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ("employee", "rating", "created_at")
    list_filter = ("rating",)


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ("title", "is_active", "published_at")
    list_filter = ("is_active",)

