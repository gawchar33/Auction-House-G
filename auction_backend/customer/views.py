from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Customer
from .serializers import CustomerSerializer


# =================================
# GET (list) + POST (create)
# URL: /customer/
# =================================
@api_view(['GET', 'POST'])
def customer_list_create(request):

    # 🔹 GET → LIST ALL CUSTOMERS
    if request.method == 'GET':
        customers = Customer.objects.all()
        serializer = CustomerSerializer(customers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # 🔹 POST → CREATE CUSTOMER
    if request.method == 'POST':
        serializer = CustomerSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Customer created successfully"},
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# =================================
# GET / PUT / DELETE
# URL: /customer/<id>/
# =================================
@api_view(['GET', 'PUT', 'DELETE'])
def customer_detail(request, id):

    try:
        customer = Customer.objects.get(id=id)
    except Customer.DoesNotExist:
        return Response(
            {"error": "Customer not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # 🔹 GET ONE CUSTOMER
    if request.method == 'GET':
        serializer = CustomerSerializer(customer)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # 🔹 UPDATE CUSTOMER
    if request.method == 'PUT':
        serializer = CustomerSerializer(
            customer,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Customer updated successfully"},
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # 🔹 DELETE CUSTOMER
    if request.method == 'DELETE':
        customer.delete()
        return Response(
            {"message": "Customer deleted successfully"},
            status=status.HTTP_200_OK
        )
