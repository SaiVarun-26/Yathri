from rest_framework import serializers
from .models import User, Trip, TransparencyLog, RewardsOffer

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'

class TripSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trip
        fields = '__all__'

class TransparencyLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransparencyLog
        fields = '__all__'

class RewardsOfferSerializer(serializers.ModelSerializer):
    class Meta:
        model = RewardsOffer
        fields = '__all__'