from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserSerializer


@api_view(["POST"])
def signup(request):
    username = request.data.get("username")
    email = request.data.get("email")
    password = request.data.get("password")

    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already exists"}, status=400)

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password
    )

    return Response({
        "message": "Signup successful",
        "user_id": user.id
    }, status=201)


@api_view(["POST"])
def login(request):
    username = request.data.get("username")
    password = request.data.get("password")

    user = authenticate(username=username, password=password)

    if user is not None:
        return Response({
            "message": "Login successful",
            "user_id": user.id,
            "username": user.username,
            "email": user.email
        }, status=200)

    return Response({"error": "Invalid credentials"}, status=401)


@api_view(["GET", "PUT"])
def user_profile(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    if request.method == "GET":
        serializer = UserSerializer(user)
        return Response(serializer.data)

    if request.method == "PUT":
        user.username = request.data.get("username", user.username)
        user.email = request.data.get("email", user.email)
        user.save()

        serializer = UserSerializer(user)
        return Response(serializer.data)
