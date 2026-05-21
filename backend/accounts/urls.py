from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, CustomTokenObtainPairView, AdminDashboardTestView, VendorDashboardTestView

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='auth_login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Test protected routes
    path('admin-dashboard/test/', AdminDashboardTestView.as_view(), name='admin_test'),
    path('vendor-dashboard/test/', VendorDashboardTestView.as_view(), name='vendor_test'),
]