from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, TripViewSet, TransparencyLogViewSet, RewardsOfferViewSet,cost_summary

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'trips', TripViewSet)
router.register(r'logs', TransparencyLogViewSet)
router.register(r'offers', RewardsOfferViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('cost-summary/', cost_summary,name = 'cost-summary'),
]