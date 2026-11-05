from rest_framework.permissions import BasePermission


class IsAdministrator(BasePermission):
    """
    Only CRM administrators can access the resource.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "ADMIN"
        )


class IsSalesManager(BasePermission):
    """
    Only sales managers can access the resource.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "SALES_MANAGER"
        )


class IsSalesEmployee(BasePermission):
    """
    Only sales employees can access the resource.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "SALES_EMPLOYEE"
        )


class IsAdminOrSalesManager(BasePermission):
    """
    Administrators and sales managers can access the resource.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in [
                "ADMIN",
                "SALES_MANAGER",
            ]
        )