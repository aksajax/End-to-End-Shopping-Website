# accounts/admin.py
from django.contrib import admin
from .models import User,CustomerProxy, VendorProxy

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['email', 'role', 'is_staff', 'is_active', 'created_at']
    list_filter = ['role', 'is_staff', 'is_active']
    search_fields = ['email', 'first_name', 'last_name']

# 🔹 Customer Admin Config
@admin.register(CustomerProxy)
class CustomerAdmin(admin.ModelAdmin):
    # 🛠️ 'date_joined' ki jagah 'created_at' likha
    list_display = ['id', 'username', 'email', 'is_active', 'created_at']
    search_fields = ['email', 'first_name', 'last_name']

    def get_queryset(self, request):
        return super().get_queryset(request).filter(role='CUSTOMER')


# 🔹 Vendor Admin Config
@admin.register(VendorProxy)
class VendorAdmin(admin.ModelAdmin):
    # 🛠️ 'date_joined' ki jagah 'created_at' likha
    list_display = ['id', 'username', 'email', 'is_active', 'created_at']
    search_fields = ['email', 'first_name', 'last_name']

    def get_queryset(self, request):
        return super().get_queryset(request).filter(role='VENDOR')