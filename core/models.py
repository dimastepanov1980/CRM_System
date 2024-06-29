# models.py
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager

class MasterAdminManager(BaseUserManager):
    def create_user(self, email, password=None):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None):
        user = self.create_user(email, password)
        user.is_admin = True
        user.save(using=self._db)
        return user

class MasterAdmin(AbstractBaseUser):
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    is_admin = models.BooleanField(default=False)
    objects = MasterAdminManager()
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email

    def has_perm(self, perm, obj=None):
        return True

    def has_module_perms(self, app_label):
        return True

    @property
    def is_staff(self):
        return self.is_admin

class Client(models.Model):
    master_admin = models.ForeignKey(MasterAdmin, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class Admin(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class Bot(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    token = models.CharField(max_length=200, unique=True)

    def __str__(self):
        return self.name

class Message(models.Model):
    user_id = models.CharField(max_length=255)
    text = models.TextField()
    message_type = models.CharField(max_length=50)
    bot_identifier = models.CharField(max_length=255, default='default_bot_id')  # Changed field name
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.text