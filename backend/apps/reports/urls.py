from django.urls import path

from . import views

urlpatterns = [
    path("dashboard/stats/", views.DashboardStatsView.as_view(), name="dashboard_stats"),
    path("daily/", views.DailyMealReportView.as_view(), name="daily_report"),
    path("monthly/", views.MonthlyEmployeeReportView.as_view(), name="monthly_report"),
    path("consumption/", views.FoodConsumptionReportView.as_view(), name="consumption_report"),
    path("trends/weekly/", views.WeeklyTrendView.as_view(), name="weekly_trends"),
]
