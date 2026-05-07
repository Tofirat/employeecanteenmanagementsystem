from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """
    Allows access only to users with the 'admin' role.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "admin")


class IsStaffUser(permissions.BasePermission):
    """
    Allows access only to users with the 'staff' or 'admin' role.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ["admin", "staff"])


class IsEmployeeUser(permissions.BasePermission):
    """
    Allows access only to users with the 'employee' role.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "employee")
