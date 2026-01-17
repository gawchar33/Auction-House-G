from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Auction
from .serializers import AuctionSerializer


@api_view(['GET', 'POST'])
def auction_list_create(request):

    # 🔹 GET → list all auctions
    if request.method == 'GET':
        auctions = Auction.objects.all()
        serializer = AuctionSerializer(auctions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # 🔹 POST → create auction
    if request.method == 'POST':
        serializer = AuctionSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Auction created successfully"},
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def auction_detail(request, id):

    try:
        auction = Auction.objects.get(id=id)
    except Auction.DoesNotExist:
        return Response(
            {"error": "Auction not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # 🔹 GET single auction
    if request.method == 'GET':
        serializer = AuctionSerializer(auction)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # 🔹 UPDATE auction
    if request.method == 'PUT':
        serializer = AuctionSerializer(
            auction,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Auction updated successfully"},
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # 🔹 DELETE auction
    if request.method == 'DELETE':
        auction.delete()
        return Response(
            {"message": "Auction deleted successfully"},
            status=status.HTTP_200_OK
        )

