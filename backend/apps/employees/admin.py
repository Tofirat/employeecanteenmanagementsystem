from django.contrib import admin
from .models import Employee

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['employee_id', 'name', 'email', 'department', 'shift', 'is_active']
    list_filter = ['department', 'shift', 'is_active']
    search_fields = ['name', 'email', 'employee_id']
