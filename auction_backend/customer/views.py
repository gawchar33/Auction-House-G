from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Customer, Media
from .serializers import CustomerSerializer
from django.views.decorators.csrf import csrf_exempt
import base64
from django.core.files.base import ContentFile


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
# GET / PATCH (update current customer)
# URL: /customer/   (acts as "me" endpoint)
# =================================
@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
@csrf_exempt
def customer_me(request):
    # get or create customer row linked to the current user
    user = request.user
    customer, _ = Customer.objects.get_or_create(user=user)

    if request.method == 'GET':
        data = {
            'id': customer.id,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'phone': customer.phone if hasattr(customer, 'phone') else '',
            'address': customer.address if hasattr(customer, 'address') else '',
            'avatar_base64': customer.avatar_base64 or ''
        }
        # include media info if present
        try:
            if customer.media:
                data['media'] = {'id': customer.media.id, 'filename': customer.media.filename}
        except Exception:
            pass
        return Response(data, status=status.HTTP_200_OK)

    # PATCH update
    payload = request.data or {}

    # update user fields
    fn = payload.get('first_name')
    ln = payload.get('last_name')
    em = payload.get('email')
    if fn is not None: user.first_name = fn
    if ln is not None: user.last_name = ln
    if em is not None: user.email = em
    user.save()

    # update customer fields if exist
    if hasattr(customer, 'phone') and payload.get('phone') is not None:
        customer.phone = payload.get('phone')
    if hasattr(customer, 'address') and payload.get('address') is not None:
        customer.address = payload.get('address')
    # set avatar_base64 (raw base64 string without data: prefix)
    avatar_b64 = payload.get('avatar_base64') or payload.get('image_base64') or payload.get('image')
    if avatar_b64:
        if isinstance(avatar_b64, str) and avatar_b64.startswith('data:'):
            parts = avatar_b64.split(',', 1)
            if len(parts) > 1:
                avatar_b64 = parts[1]
        # create media row and attach; store raw base64 in Media
        try:
            fname = f"{user.username}_avatar_{timezone.now().strftime('%Y%m%d%H%M%S')}.png"
            # create empty media row first then save binary file
            media = Media(owner=user, filename=fname, base64=avatar_b64)
            # attempt to decode base64 and save to ImageField file
            try:
                img_data = base64.b64decode(avatar_b64)
                media.file.save(fname, ContentFile(img_data), save=False)
            except Exception as img_err:
                # decoding or saving file failed; keep base64 but no file
                media.file = None
            try:
                media.save()
            except Exception:
                media = None
            if media:
                customer.media = media
        except Exception:
            media = None
        # store raw base64 in customer.avatar_base64 (no username prefix)
        try:
            customer.avatar_base64 = avatar_b64
        except Exception:
            customer.avatar_base64 = avatar_b64
    customer.save()

    # return response that mirrors /user/profile/ with nested customer
    resp = {
        'id': user.id,
        'username': user.username,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'email': user.email,
        'customer': {
            'id': customer.id,
            'phone': getattr(customer, 'phone', ''),
            'address': getattr(customer, 'address', ''),
            'avatar_base64': customer.avatar_base64 or ''
        }
    }
    try:
        if customer.media:
            resp['customer']['media'] = {'id': customer.media.id, 'filename': customer.media.filename}
    except Exception:
        pass
    return Response(resp, status=status.HTTP_200_OK)
