from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AnnouncementViewSet,
    CategoryViewSet,
    DashboardView,
    EmployeeViewSet,
    FeedbackViewSet,
    LoginView,
    LogoutView,
    MealScheduleViewSet,
    MeView,
    MenuItemViewSet,
    OrderViewSet,
    PaymentViewSet,
    ReportsView,
)

router = DefaultRouter()
router.register("employees", EmployeeViewSet)
router.register("categories", CategoryViewSet)
router.register("menu-items", MenuItemViewSet)
router.register("schedules", MealScheduleViewSet)
router.register("orders", OrderViewSet)
router.register("payments", PaymentViewSet)
router.register("feedback", FeedbackViewSet)
router.register("announcements", AnnouncementViewSet)

urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("reports/", ReportsView.as_view(), name="reports"),
    path("", include(router.urls)),
]

