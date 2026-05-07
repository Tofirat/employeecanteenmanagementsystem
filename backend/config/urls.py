from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from apps.reports.views import AdminOrderSalesReportView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.users.urls")),
    path("api/employees/", include("apps.employees.urls")),
    path("api/departments/", include("apps.departments.urls")),
    path("api/menu/", include("apps.menu.urls")),
    path("api/orders/", include("apps.orders.urls")),
    path("api/payments/", include("apps.payments.urls")),
    path("api/reports/", include("apps.reports.urls")),
    path("api/admin/reports/orders/", AdminOrderSalesReportView.as_view(), name="admin_order_sales_report"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
