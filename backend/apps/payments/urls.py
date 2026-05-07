from django.urls import path

from . import views

urlpatterns = [
    path("", views.PaymentListCreateView.as_view(), name="payment-list-create"),
    path("<int:pk>/", views.PaymentDetailView.as_view(), name="payment-detail"),
    path("<int:pk>/sslcommerz/initiate/", views.SSLCommerzInitiateView.as_view(), name="payment-sslcommerz-initiate"),
    path("<int:pk>/invoice/public/", views.PublicInvoiceDownloadView.as_view(), name="payment-invoice-public"),
    path("sslcommerz/success/", views.sslcommerz_success, name="sslcommerz-success"),
    path("sslcommerz/fail/", views.sslcommerz_fail, name="sslcommerz-fail"),
    path("sslcommerz/cancel/", views.sslcommerz_cancel, name="sslcommerz-cancel"),
    path("sslcommerz/ipn/", views.sslcommerz_ipn, name="sslcommerz-ipn"),
    path("<int:pk>/invoice/", views.InvoiceDownloadView.as_view(), name="payment-invoice"),
]
