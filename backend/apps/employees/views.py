from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from .models import Employee
from .serializers import EmployeeCreateSerializer, EmployeeSerializer


from apps.users.permissions import IsAdminUser

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.select_related("department", "user").all()
    serializer_class = EmployeeSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAdminUser()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == "create":
            return EmployeeCreateSerializer
        return EmployeeSerializer

    def get_queryset(self):
        queryset = Employee.objects.select_related("department", "user").all()
        user = self.request.user
        if user.role == "employee":
            queryset = queryset.filter(user=user)
        department = self.request.query_params.get("department")
        shift = self.request.query_params.get("shift")
        search = self.request.query_params.get("search")
        if department:
            queryset = queryset.filter(department_id=department)
        if shift:
            queryset = queryset.filter(shift=shift)
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset

    def destroy(self, request, *args, **kwargs):
        employee = self.get_object()
        employee.user.is_active = False
        employee.user.save(update_fields=["is_active"])
        employee.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["get", "patch"])
    def me(self, request):
        try:
            employee = Employee.objects.select_related("department", "user").get(user=request.user)
            if request.method.lower() == "patch":
                serializer = EmployeeSerializer(employee, data=request.data, partial=True)
                serializer.is_valid(raise_exception=True)
                serializer.save()
                return Response(serializer.data)
            return Response(EmployeeSerializer(employee).data)
        except Employee.DoesNotExist:
            return Response({"detail": "Employee profile not found."}, status=status.HTTP_404_NOT_FOUND)
