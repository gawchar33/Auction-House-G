from rest_framework import generics
from .models import Bid
from .serializers import BidSerializer

class BidListCreateAPIView(generics.ListCreateAPIView):
    queryset = Bid.objects.all().order_by('-created_at')
    serializer_class = BidSerializer

class BidRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Bid.objects.all()
    serializer_class = BidSerializer