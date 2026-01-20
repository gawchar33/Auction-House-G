from rest_framework import serializers
from .models import Customer, Media

class MediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Media
        fields = ['id','filename','base64','created_at']

class CustomerSerializer(serializers.ModelSerializer):
    media = MediaSerializer(read_only=True)

    class Meta:
        model = Customer
        fields = [
            'id',
            'user',
            'phone',
            'address',
            'avatar_base64',
            'media',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']
