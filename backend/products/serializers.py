# products/serializers.py

from rest_framework import serializers
from .models import Product, Category, Order, OrderItem  # ✅ OrderItem ko add kiya
from accounts.serializers import UserSerializer
from django.contrib.auth import get_user_model

User = get_user_model()


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class ProductSerializer(serializers.ModelSerializer):
    vendor = UserSerializer(read_only=True) 
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'vendor', 'category', 'category_name', 'name', 
            'description', 'price', 'discount_price', 'stock_qty', 
            'image', 'is_available', 'created_at', 'updated_at'
        ]
        read_only_fields = ['vendor']

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['vendor'] = request.user
        return super().create(validated_data)


# --- 📦 1. NAYA SERIALIZER: ORDER KE ITEMS DIKHANE KE LIYE ---
class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'product_image', 'quantity', 'price']

    def get_product_image(self, obj):
        # Aapka purana absolute URL wala logic ab yahan item ke liye kaam karega
        if obj.product.image:
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.product.image.url)
            return obj.product.image.url
        return None


# --- 💳 2. UPDATED SERIALIZER: MAIN ORDER DATA ---
class OrderSerializer(serializers.ModelSerializer):
    # 🔥 Yeh magic line ek order ke saare cart items ko list karegi
    items = OrderItemSerializer(many=True, read_only=True)
    customer_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 
            'customer', 
            'customer_name', 
            'shipping_address', 
            'total_amount',       # ✅ Naya model field name
            'status', 
            'razorpay_order_id',  # ✅ Dashboard/Frontend tracking ke liye
            'razorpay_payment_id',
            'created_at',
            'items'               # ✅ Saare products nested format mein milenge
        ]
        read_only_fields = ['customer', 'total_amount', 'status', 'razorpay_order_id']

    def get_customer_name(self, obj):
        if obj.customer.first_name:
            return f"{obj.customer.first_name} {obj.customer.last_name}".strip()
        return obj.customer.email