from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Category
from .serializers import CategorySerializer


@api_view(['GET', 'POST'])
def category_list_create(request):

    # 🔹 GET → LIST ALL CATEGORIES
    if request.method == 'GET':
        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # 🔹 POST → CREATE CATEGORY
    if request.method == 'POST':
        serializer = CategorySerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Category created successfully"},
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def category_detail(request, id):

    try:
        category = Category.objects.get(id=id)
    except Category.DoesNotExist:
        return Response(
            {"error": "Category not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # 🔹 GET ONE CATEGORY
    if request.method == 'GET':
        serializer = CategorySerializer(category)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # 🔹 UPDATE CATEGORY
    if request.method == 'PUT':
        serializer = CategorySerializer(
            category,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Category updated successfully"},
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # 🔹 DELETE CATEGORY
    if request.method == 'DELETE':
        category.delete()
        return Response(
            {"message": "Category deleted successfully"},
            status=status.HTTP_200_OK
        )
