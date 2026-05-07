from django.contrib import admin
from .models import MenuItem

@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ['food_name', 'meal_type', 'price', 'is_available', 'availability_date']
    list_filter = ['meal_type', 'is_available']
    search_fields = ['food_name']
