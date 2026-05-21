# products/views.py
import razorpay
from django.conf import settings
from rest_framework.views import APIView


from rest_framework.permissions import IsAuthenticated


from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import Product, Category, Order,OrderItem
from .serializers import ProductSerializer, CategorySerializer, OrderSerializer
from accounts.permissions import IsVendorUserRole, IsAdminUserRole


# Razorpay client init
razorpay_client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

class CategoryViewSet(viewsets.ModelViewSet):
    """
    🔒 CATEGORY CONTROL BLOCK:
    - Koyi bhi normal user ya customer category dekh sakta hai (List/Retrieve).
    - Category add/modify/delete karne ka haq SIRF ADMIN (`IsAdminUserRole`) ko hai.
    """
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        # Category badalne ka permission Vendor se hata kar strict Admin par set kiya
        return [IsAdminUserRole()]


class VendorProductViewSet(viewsets.ModelViewSet):
    """
    🏪 MARKETPLACE PRODUCT CORE SYSTEM:
    - POST (Create), PUT/PATCH (Update) -> Sirf Vendor role wala kar sakta hai.
    - DELETE (Destroy) -> Admin kisi ka bhi product, aur Vendor sirf khud ka product hata sakta hai.
    - GET (List/Retrieve) -> Agar normal browser feed hai toh saare vendors ke products mix hokar dikhenge.
    """
    serializer_class = ProductSerializer

    def get_permissions(self):
        # Product add aur edit sirf authentic Vendors hi kar sakte hain
        if self.action in ['create', 'update', 'partial_update']:
            return [IsVendorUserRole()]
        
        if self.action == 'destroy':
            return [permissions.IsAuthenticated()]
            
        # Shopping route publicly hamesha open rahega
        return [permissions.AllowAny()]

    def get_queryset(self):
        user = self.request.user

        # 1. 🏪 VENDOR DASHBOARD ACTIONS (List/Update/Delete via Dashboard)
        # Agar vendor khud apne products dekhna ya edit karna chahta hai
        if (self.action in ['update', 'partial_update', 'destroy'] or 
            self.request.query_params.get('dashboard') == 'true'):
            
            if user.is_authenticated and hasattr(user, 'role'):
                if user.role == 'VENDOR':
                    return Product.objects.filter(vendor=user).order_by('-created_at')
                elif user.role == 'ADMIN':
                    return Product.objects.all().order_by('-created_at')

        # 2. 👤 CUSTOMER FRONT HOME (Default Case):
        # Jab koi bhi normal customer ya bina login kiya user homepage par aaye,
        # toh bina kisi filter ke saare vendors ke products live dikhne chahiye!
        
        # Base Query: Sabhi vendors ke saare products uthao
        queryset = Product.objects.all().order_by('-created_at')
        
        # Agar aapke model mein 'is_available' field hai aur aap use check karna chahte hain,
        # toh check karke filter karo, nahi toh bina filter ke saare dikhao (Safe Fallback)
        if hasattr(Product, 'is_available'):
            # Agar 'is_available' field filter laga kar data gayab ho raha hai,
            # toh check karo ki database mein products available marked hain ya nahi.
            # Safe side ke liye hum filter hata kar seedhe all() return kar rahe hain.
            pass

        return queryset

    def destroy(self, request, *args, **kwargs):
        """
        Custom Delete Action for security
        """
        product = self.get_object()
        user = request.user

        if not hasattr(user, 'role'):
            return Response({"detail": "User role definition missing!"}, status=status.HTTP_403_FORBIDDEN)

        # Admin power check
        if user.role == 'ADMIN':
            product.delete()
            return Response({"message": "Admin ne product platform se delete kar diya."}, status=status.HTTP_200_OK)

        # Vendor ownership check
        if user.role == 'VENDOR' and product.vendor == user:
            product.delete()
            return Response({"message": "Product kamyabi se delete ho gaya."}, status=status.HTTP_200_OK)

        return Response(
            {"detail": "Aapke paas is product ko delete karne ki permission nahi hai."}, 
            status=status.HTTP_403_FORBIDDEN
        )
    def perform_create(self, serializer):
        # Jab vendor naya product banaye, toh login user automatic vendor ban jaye
        serializer.save(vendor=self.request.user)


class OrderViewSet(viewsets.ModelViewSet):
    """
    📦 UNIFIED ORDER HANDLING VIEWSET
    """
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user    
        
        # Admin pure platform ke saare active orders dekh sakta hai audit ke liye
        if hasattr(user, 'role') and user.role == 'ADMIN':
            return Order.objects.all().order_by('-created_at')
            
        # 🛠️ VENDOR FILTER FIX: Order ke nested items ke raste se vendor filter hoga
        if hasattr(user, 'role') and user.role == 'VENDOR':
            return Order.objects.filter(items__product__vendor=user).distinct().order_by('-created_at')
                
        # Customer ko uske khud ke order history panel ka data dikhao
        return Order.objects.filter(customer=user).order_by('-created_at')

    def create(self, request, *args, **kwargs):
        product_id = request.data.get('product')
        quantity = int(request.data.get('quantity', 1))

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({"error": "Product nahi mila!"}, status=status.HTTP_404_NOT_FOUND)

        # Stock compliance verification
        if product.stock_qty < quantity:
            return Response(
                {"error": f"Kshama karein, sirf {product.stock_qty} units hi bache hain!"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Dynamic pricing calculator
        base_price = product.discount_price if product.discount_price else product.price
        total_price = base_price * quantity

        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                customer=request.user,
                product=product,
                vendor=product.vendor, 
                total_price=total_price
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

# 📂 backend/products/views.py ke niche check karo/add karo:



# 🚨 CHECK THIS NAME EXACTLY:
class CreateRazorpayOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # 📥 Data Extraction
            amount = request.data.get('amount')
            shipping_address = request.data.get('address')
            cart_items = request.data.get('items')

            # 🛠️ 1. Validation Check
            if not amount or not shipping_address or not cart_items:
                return Response({"error": "Sari details (amount, address, items) dena zaroori hai!"}, status=status.HTTP_400_BAD_REQUEST)

            # 🛠️ 2. Stock Verification & Key Safe-Check
            for item in cart_items:
                # Safe-check: Agar frontend se id kisi aur key me aa rahi ho
                product_id = item.get('id') or item.get('_id')
                if not product_id:
                    return Response({"error": "Frontend se product id nahi mil rahi hai! Item structure check karein."}, status=status.HTTP_400_BAD_REQUEST)
                
                product = Product.objects.get(id=product_id)
                if product.stock_qty < item['quantity']:
                    return Response({"error": f"Product '{product.name}' ka stock available nahi hai!"}, status=status.HTTP_400_BAD_REQUEST)

            # 🛠️ 3. Razorpay Client Local Instance (Keys configuration safety ke liye)
            try:
                # Settings se bina kisi space ke clean keys uthaiye
                key_id = str(settings.RAZORPAY_KEY_ID).strip()
                key_secret = str(settings.RAZORPAY_KEY_SECRET).strip()
                client = razorpay.Client(auth=(key_id, key_secret))
            except Exception as rzp_init_err:
                return Response({"error": f"Razorpay Initialize Fail: settings.py ki keys check karein. {str(rzp_init_err)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # 🛠️ 4. Amount Conversion (Float handle karne ke liye pehle float fir int)
            razorpay_amount = int(float(amount) * 100)
            
            razorpay_order_data = {
                "amount": razorpay_amount,
                "currency": "INR",
                "payment_capture": 1
            }
            
            # Real Razorpay Order Creation Hit
            try:
                razorpay_order = client.order.create(data=razorpay_order_data)
            except Exception as rzp_api_err:
                return Response({"error": f"Razorpay API Refused Order: Keys invalid hain ya dashboard Blocked hai! Details: {str(rzp_api_err)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # 🛠️ 5. DB Order Creation
            new_order = Order.objects.create(
                customer=request.user,
                shipping_address=shipping_address,
                total_amount=amount,
                razorpay_order_id=razorpay_order['id'],
                status='PENDING'
            )

            # 🛠️ 6. Order Items Linking
            for item in cart_items:
                product_id = item.get('id') or item.get('_id')
                product = Product.objects.get(id=product_id)
                item_price = item.get('discount_price') or item.get('price')
                
                OrderItem.objects.create(
                    order=new_order,
                    product=product,
                    vendor=product.vendor,
                    quantity=item['quantity'],
                    price=item_price
                )

            return Response({
                "razorpay_order_id": razorpay_order['id'],
                "amount": razorpay_amount,
                "currency": "INR",
                "order_id": new_order.id
            }, status=status.HTTP_201_CREATED)

        except Product.DoesNotExist:
            return Response({"error": "Cart ka koi product DB me exist nahi karta!"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            # Agar upar se alag koi unexpected error ho toh pakad me aayegi
            import traceback
            traceback.print_exc() # Yeh terminal par poori detail nikal kar phekega line number ke sath
            return Response({"error": f"Server Side Exception: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# 🚨 CHECK THIS NAME EXACTLY:
class VerifyRazorpayPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            razorpay_order_id = request.data.get('razorpay_order_id')
            razorpay_payment_id = request.data.get('razorpay_payment_id')
            razorpay_signature = request.data.get('razorpay_signature')

            params_dict = {
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature
            }

            try:
                razorpay_client.utility.verify_payment_signature(params_dict)
                
                order = Order.objects.get(razorpay_order_id=razorpay_order_id)
                order.status = 'PAID'
                order.razorpay_payment_id = razorpay_payment_id
                order.razorpay_signature = razorpay_signature
                order.save()

                for item in order.items.all():
                    product = item.product
                    product.stock_qty -= item.quantity
                    product.save()

                return Response({"message": "🎉 Payment successful!"}, status=status.HTTP_200_OK)

            except razorpay.errors.SignatureVerificationError:
                return Response({"error": "Signature mismatch!"}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)