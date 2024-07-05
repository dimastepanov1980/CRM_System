from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_admin = models.BooleanField(default=False)
    is_master_admin = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    def __str__(self):
        return self.email

class Admin(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)

class Bot(models.Model):
    name = models.CharField(max_length=100)
    token = models.CharField(max_length=200)
    admin = models.ForeignKey(Admin, on_delete=models.CASCADE)

class Message(models.Model):
    user_id = models.CharField(max_length=255)
    text = models.TextField()
    message_type = models.CharField(max_length=50)
    bot = models.ForeignKey(Bot, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)