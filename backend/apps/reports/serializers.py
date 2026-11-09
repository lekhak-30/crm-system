
from rest_framework import serializers


class DashboardResponseSerializer(serializers.Serializer):
    customers = serializers.JSONField()
    leads = serializers.JSONField()
    opportunities = serializers.JSONField()
    revenue_by_currency = serializers.ListField(
        child=serializers.JSONField()
    )


class SalesPipelineResponseSerializer(serializers.Serializer):
    report = serializers.CharField()
    total_deals = serializers.IntegerField()
    pipeline = serializers.ListField(
        child=serializers.JSONField()
    )


class RevenueReportResponseSerializer(serializers.Serializer):
    report = serializers.CharField()
    revenue_by_currency = serializers.ListField(
        child=serializers.JSONField()
    )


class LeadConversionResponseSerializer(serializers.Serializer):
    report = serializers.CharField()
    overall = serializers.JSONField()
    conversion_by_source = serializers.ListField(
        child=serializers.JSONField()
    )


class SalesPerformanceResponseSerializer(serializers.Serializer):
    report = serializers.CharField()
    performance = serializers.ListField(
        child=serializers.JSONField()
    )
