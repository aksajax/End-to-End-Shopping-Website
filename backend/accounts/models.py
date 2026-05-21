from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Users must have an email address')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ADMIN')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('VENDOR', 'Vendor'),
        ('CUSTOMER', 'Customer'),
    )

    email = models.EmailField(max_length=255, unique=True)
    first_name = models.CharField(max_length=255, blank=True, null=True)
    last_name = models.CharField(max_length=255, blank=True, null=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='CUSTOMER')
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False) # Admin panel access ke liye
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = [] # Email aur password default milte hain

    # 🛠️ Django Admin Compatibility Fix
    @property
    def username(self):
        return self.email

    def __str__(self):
        return f"{self.email} - ({self.role})"


# 🛒 Customer ke liye Proxy Model
class CustomerProxy(User):
    class Meta:
        proxy = True
        verbose_name = "Customer / User"
        verbose_name_plural = "Customers / Users"


# 🏭 Vendor ke liye Proxy Model
class VendorProxy(User):
    class Meta:
        proxy = True
        verbose_name = "Vendor / Seller"
        verbose_name_plural = "Vendors / Sellers"