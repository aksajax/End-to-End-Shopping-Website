# backend/products/admin.py
from django.contrib import admin
# ✅ FIX: OrderItem ko bhi import kiya yahan
from .models import Category, Product, Order, OrderItem

# --- 1. CATEGORY ADMIN PANEL ---
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'slug', 'created_at')
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    list_per_page = 20


# --- 2. PRODUCT ADMIN PANEL (CENTRALIZED DATA VIEW) ---
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'vendor_email', 'category', 'price', 'discount_price', 'stock_qty', 'is_available', 'created_at')
    list_filter = ('is_available', 'category', 'vendor', 'created_at')
    search_fields = ('name', 'description', 'vendor__email', 'vendor__username')
    list_editable = ('price', 'discount_price', 'stock_qty', 'is_available')
    list_per_page = 20

    def vendor_email(self, obj):
        return obj.vendor.email
    vendor_email.short_description = 'Vendor / Owner'


# --- 3. MULTI-ITEM ORDER INLINE (Naya Feature) ---
# Isse Order ke andar ke saare cart items badhiya table mein dikhenge
class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    fields = ('product', 'vendor_email', 'quantity', 'price')
    readonly_fields = ('product', 'vendor_email', 'quantity', 'price')

    def vendor_email(self, obj):
        return obj.vendor.email
    vendor_email.short_description = 'Item Vendor'


# --- 4. ORDER ADMIN PANEL (Updated) ---
@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    # ✅ FIX: Ab list_display mein wahi fields hain jo naye Order model mein exist karte hain
    list_display = ('id', 'customer_info', 'total_amount', 'status', 'razorpay_order_id', 'created_at')
    
    # ✅ FIX: 'vendor' filter hata kar 'status' aur 'created_at' rakha hai
    list_filter = ('status', 'created_at')
    
    search_fields = ('customer__email', 'shipping_address', 'razorpay_order_id')
    list_editable = ('status',) # Admin direct panel se order status track/change kar sakta hai
    list_per_page = 20

    # 🔥 Yeh line poore cart ke items ko Order details page par inline show karegi
    inlines = [OrderItemInline]

    def customer_info(self, obj):
        return obj.customer.email
    customer_info.short_description = 'Ordered By'