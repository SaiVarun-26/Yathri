from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets
from .models import User, Trip, TransparencyLog, RewardsOffer
from .serializers import UserSerializer, TripSerializer, TransparencyLogSerializer, RewardsOfferSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class TripViewSet(viewsets.ModelViewSet):
    queryset = Trip.objects.all()
    serializer_class = TripSerializer

class TransparencyLogViewSet(viewsets.ModelViewSet):
    queryset = TransparencyLog.objects.all()
    serializer_class = TransparencyLogSerializer

class RewardsOfferViewSet(viewsets.ModelViewSet):
    queryset = RewardsOffer.objects.all()
    serializer_class = RewardsOfferSerializer


from django.db.models import Sum
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['GET'])
def cost_summary(request):
    # 1. Grab all trips from the database
    trips = Trip.objects.all()
    
    # 2. Calculate the grand total
    total_cost = trips.aggregate(Sum('cost_inr'))['cost_inr__sum'] or 0
    
    # 3. Group the trips by mode and sum the costs for each group
    # This acts just like a SQL: SELECT transport_mode, SUM(cost_inr) GROUP BY transport_mode
    breakdown_query = trips.values('transport_mode').annotate(amount=Sum('cost_inr')).order_by('-amount')
    
    # 4. Format the output to exactly match what your React app expects
    formatted_breakdown = [
        {"mode": item['transport_mode'], "amount": item['amount']} 
        for item in breakdown_query
    ]
    
    # 5. Send it back as JSON
    return Response({
        "total": total_cost,
        "breakdown": formatted_breakdown
    })