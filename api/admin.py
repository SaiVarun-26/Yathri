from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import User, Trip, TransparencyLog, RewardsOffer

admin.site.register(User)
admin.site.register(Trip)
admin.site.register(TransparencyLog)
admin.site.register(RewardsOffer)