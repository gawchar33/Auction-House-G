from django.urls import path
from .views import BidListCreateAPIView, BidRetrieveUpdateDestroyAPIView

urlpatterns = [
    path('bidding/', BidListCreateAPIView.as_view(), name='bidding-list'),
    path('bidding/<int:pk>/', BidRetrieveUpdateDestroyAPIView.as_view(), name='bidding-detail'),
]