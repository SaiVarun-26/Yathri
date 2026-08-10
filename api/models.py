from django.db import models

class User(models.Model):
    # Django automatically creates an auto-incrementing 'id' primary key for every model
    total_points = models.IntegerField(default=0)
    reward_tier = models.CharField(max_length=50)

    def __str__(self):
        return f"User {self.id} - {self.reward_tier}"

class Trip(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='trips')
    start_location = models.CharField(max_length=255)
    end_location = models.CharField(max_length=255)
    distance_km = models.FloatField()
    duration_min = models.IntegerField()
    transport_mode = models.CharField(max_length=50)
    cost_inr = models.FloatField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.start_location} to {self.end_location} ({self.transport_mode})"

class TransparencyLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='logs')
    mode = models.CharField(max_length=50)
    distance_band = models.CharField(max_length=50)
    time_of_day = models.CharField(max_length=50)
    timestamp = models.DateTimeField(auto_now_add=True)

class RewardsOffer(models.Model):
    partner_name = models.CharField(max_length=255)
    discount_text = models.CharField(max_length=255)
    category = models.CharField(max_length=100)

    def __str__(self):
        return self.partner_name
