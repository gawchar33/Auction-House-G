from rest_framework import serializers
from .models import Auction


class AuctionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Auction
        fields = [
            'id',
            'title',
            'description',
            'starting_price',
            'current_price',
            'category',
            'seller',
            'start_time',
            'end_time',
            'is_active',
            'created_at'
        ]
