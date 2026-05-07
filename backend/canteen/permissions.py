from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsAdminOrManager(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ["admin", "manager"])


class IsAdminManagerOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        return bool(request.user and request.user.is_authenticated and request.user.role in ["admin", "manager"])


class IsOrderOwnerOrStaff(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role in ["admin", "manager"]:
            return True
        employee = getattr(request.user, "employee_profile", None)
        return employee is not None and obj.employee_id == employee.id


class IsFeedbackOwnerOrStaff(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role in ["admin", "manager"]:
            return True
        employee = getattr(request.user, "employee_profile", None)
        return employee is not None and obj.employee_id == employee.id

