from rest_framework import viewsets, permissions
from .models import Department
from .serializers import DepartmentSerializer


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class DepartmentViewSet(viewsets.ModelViewSet):
    """CRUD operations for departments."""
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsAdminUser()]
