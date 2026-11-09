
from django.urls import path

from .views import (
    DashboardAPIView,
    SalesPipelineReportAPIView,
    RevenueReportAPIView,
    LeadConversionReportAPIView,
    SalesPerformanceReportAPIView,
)

urlpatterns = [
    path(
        "dashboard/",
        DashboardAPIView.as_view(),
        name="dashboard",
    ),
    path(
        "sales-pipeline/",
        SalesPipelineReportAPIView.as_view(),
        name="sales-pipeline",
    ),
    path(
        "revenue/",
        RevenueReportAPIView.as_view(),
        name="revenue-report",
    ),
    path(
        "lead-conversion/",
        LeadConversionReportAPIView.as_view(),
        name="lead-conversion",
    ),
    path(
        "sales-performance/",
        SalesPerformanceReportAPIView.as_view(),
        name="sales-performance",
    ),
]
