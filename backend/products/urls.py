# backend/products/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
# Apne sahi views ko import karein (jo humne pehle banaye the)
from .views import VendorProductViewSet ,CategoryViewSet, OrderViewSet , CreateRazorpayOrderView, VerifyRazorpayPaymentView

# Agar aapke baki ViewSets bhi isi file mein hain toh unhe bhi list mein rehne dena
router = DefaultRouter()

# 1. Baki routers jo pehle se chal rahe hain (example):
router.register(r'items', VendorProductViewSet, basename='product')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'orders', OrderViewSet, basename='order')

urlpatterns = [
    path('', include(router.urls)),
    path('create-razorpay-order/', CreateRazorpayOrderView.as_view(), name='create_order'),
    path('verify-payment/', VerifyRazorpayPaymentView.as_view(), name='verify_payment'),
]