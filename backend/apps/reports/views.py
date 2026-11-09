
from decimal import Decimal

from django.db.models import (
    Case,
    Count,
    DecimalField,
    ExpressionWrapper,
    F,
    Q,
    Sum,
    Value,
    When,
)

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from .serializers import (
    DashboardResponseSerializer,
    SalesPipelineResponseSerializer,
    RevenueReportResponseSerializer,
    LeadConversionResponseSerializer,
    SalesPerformanceResponseSerializer,
)

from apps.customers.models import Customer
from apps.leads.models import Lead
from apps.opportunities.models import Opportunity
from django.db.models import ExpressionWrapper


class DashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]
    @extend_schema(responses=DashboardResponseSerializer)

    def get(self, request):
        user = request.user

        customers = Customer.objects.all()
        leads = Lead.objects.all()
        opportunities = Opportunity.objects.all()

        if user.role == "SALES_EMPLOYEE":
            customers = customers.filter(assigned_to=user)
            leads = leads.filter(assigned_to=user)
            opportunities = opportunities.filter(assigned_to=user)

        customer_stats = customers.aggregate(
            total=Count("id"),
            active=Count("id", filter=Q(status="ACTIVE")),
            inactive=Count("id", filter=Q(status="INACTIVE")),
        )

        lead_stats = leads.aggregate(
            total=Count("id"),
            new=Count("id", filter=Q(status="NEW")),
            contacted=Count("id", filter=Q(status="CONTACTED")),
            qualified=Count("id", filter=Q(status="QUALIFIED")),
            unqualified=Count("id", filter=Q(status="UNQUALIFIED")),
            converted=Count("id", filter=Q(status="CONVERTED")),
        )

        total_leads = lead_stats["total"]
        converted_leads = lead_stats["converted"]

        conversion_rate = (
            round(converted_leads / total_leads * 100, 2)
            if total_leads else 0
        )

        opportunity_stats = opportunities.aggregate(
            total=Count("id"),
            prospecting=Count("id", filter=Q(stage="PROSPECTING")),
            qualification=Count("id", filter=Q(stage="QUALIFICATION")),
            proposal=Count("id", filter=Q(stage="PROPOSAL")),
            negotiation=Count("id", filter=Q(stage="NEGOTIATION")),
            won=Count("id", filter=Q(stage="WON")),
            lost=Count("id", filter=Q(stage="LOST")),
        )

        weighted_expression = ExpressionWrapper(
            F("amount") * F("probability") / Value(100),
            output_field=DecimalField(
                max_digits=16,
                decimal_places=2,
            ),
        )

        revenue_by_currency = (
            opportunities
            .values("currency")
            .annotate(
                won_revenue=Sum(
                    Case(
                        When(stage="WON", then="amount"),
                        default=Value(Decimal("0.00")),
                        output_field=DecimalField(
                            max_digits=16,
                            decimal_places=2,
                        ),
                    )
                ),
                weighted_pipeline=Sum(
                    Case(
                        When(
                            stage__in=[
                                "PROSPECTING",
                                "QUALIFICATION",
                                "PROPOSAL",
                                "NEGOTIATION",
                            ],
                            then=weighted_expression,
                        ),
                        default=Value(Decimal("0.00")),
                        output_field=DecimalField(
                            max_digits=16,
                            decimal_places=2,
                        ),
                    )
                ),
            )
            .order_by("currency")
        )

        return Response({
            "customers": customer_stats,
            "leads": {
                **lead_stats,
                "conversion_rate": conversion_rate,
            },
            "opportunities": opportunity_stats,
            "revenue_by_currency": list(revenue_by_currency),
        })

class SalesPipelineReportAPIView(APIView):
    permission_classes = [IsAuthenticated]
    @extend_schema(responses=SalesPipelineResponseSerializer)

    def get(self, request):
        user = request.user

        opportunities = Opportunity.objects.all()

        if user.role == "SALES_EMPLOYEE":
            opportunities = opportunities.filter(assigned_to=user)

        weighted_expression = ExpressionWrapper(
            F("amount") * F("probability") / Value(100),
            output_field=DecimalField(
                max_digits=16,
                decimal_places=2,
            ),
        )

        pipeline = (
            opportunities
            .values("stage", "currency")
            .annotate(
                deal_count=Count("id"),
                total_value=Sum("amount"),
                weighted_value=Sum(weighted_expression),
            )
            .order_by("stage", "currency")
        )

        return Response({
            "report": "Sales Pipeline",
            "total_deals": opportunities.count(),
            "pipeline": list(pipeline),
        })

class RevenueReportAPIView(APIView):
    permission_classes = [IsAuthenticated]
    @extend_schema(responses=RevenueReportResponseSerializer)

    def get(self, request):
        user = request.user

        opportunities = Opportunity.objects.all()

        # Sales employees see only their assigned opportunities.
        if user.role == "SALES_EMPLOYEE":
            opportunities = opportunities.filter(assigned_to=user)

        open_stages = [
            Opportunity.Stage.PROSPECTING,
            Opportunity.Stage.QUALIFICATION,
            Opportunity.Stage.PROPOSAL,
            Opportunity.Stage.NEGOTIATION,
        ]

        weighted_expression = ExpressionWrapper(
            F("amount") * F("probability") / Value(100),
            output_field=DecimalField(
                max_digits=16,
                decimal_places=2,
            ),
        )

        revenue = (
            opportunities
            .values("currency")
            .annotate(
                total_deals=Count("id"),

                won_deals=Count(
                    "id",
                    filter=Q(stage=Opportunity.Stage.WON),
                ),

                lost_deals=Count(
                    "id",
                    filter=Q(stage=Opportunity.Stage.LOST),
                ),

                open_deals=Count(
                    "id",
                    filter=Q(stage__in=open_stages),
                ),

                won_revenue=Sum(
                    Case(
                        When(
                            stage=Opportunity.Stage.WON,
                            then="amount",
                        ),
                        default=Value(Decimal("0.00")),
                        output_field=DecimalField(
                            max_digits=16,
                            decimal_places=2,
                        ),
                    )
                ),

                lost_deal_value=Sum(
                    Case(
                        When(
                            stage=Opportunity.Stage.LOST,
                            then="amount",
                        ),
                        default=Value(Decimal("0.00")),
                        output_field=DecimalField(
                            max_digits=16,
                            decimal_places=2,
                        ),
                    )
                ),

                open_pipeline_value=Sum(
                    Case(
                        When(
                            stage__in=open_stages,
                            then="amount",
                        ),
                        default=Value(Decimal("0.00")),
                        output_field=DecimalField(
                            max_digits=16,
                            decimal_places=2,
                        ),
                    )
                ),

                weighted_pipeline_revenue=Sum(
                    Case(
                        When(
                            stage__in=open_stages,
                            then=weighted_expression,
                        ),
                        default=Value(Decimal("0.00")),
                        output_field=DecimalField(
                            max_digits=16,
                            decimal_places=2,
                        ),
                    )
                ),
            )
            .order_by("currency")
        )

        return Response({
            "report": "Revenue Report",
            "revenue_by_currency": list(revenue),
        })

class LeadConversionReportAPIView(APIView):
    permission_classes = [IsAuthenticated]
    @extend_schema(responses=LeadConversionResponseSerializer)

    def get(self, request):
        user = request.user

        leads = Lead.objects.all()

        if user.role == "SALES_EMPLOYEE":
            leads = leads.filter(assigned_to=user)

        # Overall conversion statistics
        overall = leads.aggregate(
            total_leads=Count("id"),
            converted_leads=Count(
                "id",
                filter=Q(status=Lead.Status.CONVERTED),
            ),
        )

        total = overall["total_leads"]
        converted = overall["converted_leads"]

        overall_rate = (
            round((converted / total) * 100, 2)
            if total else 0
        )

        # Conversion statistics grouped by lead source
        source_data = (
            leads
            .values("source")
            .annotate(
                total_leads=Count("id"),
                converted_leads=Count(
                    "id",
                    filter=Q(status=Lead.Status.CONVERTED),
                ),
            )
            .order_by("source")
        )

        conversion_by_source = []

        for item in source_data:
            source_total = item["total_leads"]
            source_converted = item["converted_leads"]

            conversion_rate = (
                round((source_converted / source_total) * 100, 2)
                if source_total else 0
            )

            conversion_by_source.append({
                "source": item["source"],
                "total_leads": source_total,
                "converted_leads": source_converted,
                "conversion_rate": conversion_rate,
            })

        return Response({
            "report": "Lead Conversion Report",
            "overall": {
                "total_leads": total,
                "converted_leads": converted,
                "conversion_rate": overall_rate,
            },
            "conversion_by_source": conversion_by_source,
        })

class SalesPerformanceReportAPIView(APIView):
    permission_classes = [IsAuthenticated]
    @extend_schema(responses=SalesPerformanceResponseSerializer)

    def get(self, request):
        user = request.user

        opportunities = Opportunity.objects.select_related(
            "assigned_to"
        )

        if user.role == "SALES_EMPLOYEE":
            opportunities = opportunities.filter(assigned_to=user)

        open_stages = [
            Opportunity.Stage.PROSPECTING,
            Opportunity.Stage.QUALIFICATION,
            Opportunity.Stage.PROPOSAL,
            Opportunity.Stage.NEGOTIATION,
        ]

        weighted_expression = ExpressionWrapper(
            F("amount") * F("probability") / Value(100),
            output_field=DecimalField(
                max_digits=16,
                decimal_places=2,
            ),
        )

        performance = (
            opportunities
            .values(
                "assigned_to_id",
                "assigned_to__username",
                "assigned_to__first_name",
                "assigned_to__last_name",
                "currency",
            )
            .annotate(
                total_deals=Count("id"),

                won_deals=Count(
                    "id",
                    filter=Q(stage=Opportunity.Stage.WON),
                ),

                lost_deals=Count(
                    "id",
                    filter=Q(stage=Opportunity.Stage.LOST),
                ),

                open_deals=Count(
                    "id",
                    filter=Q(stage__in=open_stages),
                ),

                won_revenue=Sum(
                    Case(
                        When(
                            stage=Opportunity.Stage.WON,
                            then="amount",
                        ),
                        default=Value(Decimal("0.00")),
                        output_field=DecimalField(
                            max_digits=16,
                            decimal_places=2,
                        ),
                    )
                ),

                weighted_pipeline=Sum(
                    Case(
                        When(
                            stage__in=open_stages,
                            then=weighted_expression,
                        ),
                        default=Value(Decimal("0.00")),
                        output_field=DecimalField(
                            max_digits=16,
                            decimal_places=2,
                        ),
                    )
                ),
            )
            .order_by(
                "assigned_to__username",
                "currency",
            )
        )

        return Response({
            "report": "Sales Performance Report",
            "performance": list(performance),
        })

