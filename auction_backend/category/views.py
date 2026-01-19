from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Category
from .serializers import CategorySerializer

@api_view(['GET', 'POST'])
def category_list_create(request):
    if request.method == 'GET':
        qs = Category.objects.all()
        serializer = CategorySerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    serializer = CategorySerializer(data=request.data)
    if serializer.is_valid():
        obj = serializer.save()
        return Response(CategorySerializer(obj).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def category_detail(request, id):
    try:
        obj = Category.objects.get(id=id)
    except Category.DoesNotExist:
        return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(CategorySerializer(obj).data, status=status.HTTP_200_OK)

    if request.method == 'PUT':
        serializer = CategorySerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            obj = serializer.save()
            return Response(CategorySerializer(obj).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    obj.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)