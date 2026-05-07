from rest_framework import permissions, viewsets
from rest_framework.parsers import FormParser, MultiPartParser, JSONParser

from .models import MenuItem
from .serializers import MenuItemSerializer


from apps.users.permissions import IsAdminUser

class MenuItemViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.AllowAny()]
        return [IsAdminUser()]

    def get_queryset(self):
        queryset = MenuItem.objects.all()
        search = self.request.query_params.get("search")
        date = self.request.query_params.get("date")
        meal_type = self.request.query_params.get("meal_type")
        available = self.request.query_params.get("is_available")
        if search:
            queryset = queryset.filter(food_name__icontains=search)
        if date:
            queryset = queryset.filter(availability_date=date)
        if meal_type:
            queryset = queryset.filter(meal_type=meal_type)
        if available:
            queryset = queryset.filter(is_available=available.lower() == "true")
        if not (self.request.user.is_authenticated and self.request.user.is_admin_user):
            queryset = queryset.filter(is_available=True)
        return queryset.order_by("meal_type", "food_name")
