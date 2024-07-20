from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
import uuid

class Events(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255,null=True,blank=True)
    start = models.DateTimeField(null=True,blank=True)
    end = models.DateTimeField(null=True,blank=True)
 
    class Meta:  
        db_table = "tblevents"
        
class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)  # Установка зашифрованного пароля
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    ROLES = [
        ('MasterAdmin', 'Master Admin'),
        ('Admin', 'Admin'),
        ('Specialist', 'Specialist'),
        ('Client', 'Client'),
    ]
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=100)
    role = models.CharField(max_length=20, choices=ROLES, default='Client')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    def __str__(self):
        return self.email
    
class Company(models.Model):
    name = models.CharField(max_length=255)
    unique_url = models.URLField(unique=True)
    owner = models.ForeignKey(User, related_name='owned_companies', on_delete=models.CASCADE)

    def __str__(self):
        return self.name

class UserCompanyRole(models.Model):
    ROLES = [
        ('MasterAdmin', 'Master Admin'),
        ('Admin', 'Admin'),
        ('Specialist', 'Specialist'),
        ('Client', 'Client'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLES)

    class Meta:
        unique_together = ('user', 'company', 'role')

    def __str__(self):
        return f"{self.user.email} - {self.company.name} ({self.role})"
    
class Bot(models.Model):
    name = models.CharField(max_length=100)
    token = models.CharField(max_length=200)
    admin = models.ForeignKey(UserCompanyRole, on_delete=models.CASCADE)

    def __str__(self):
        return self.name

class Specialist(models.Model):
    name = models.CharField(max_length=100)
    specialization = models.CharField(max_length=100)
    description = models.TextField()
    experience = models.IntegerField()
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='specialists')
    email = models.EmailField()
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    def __str__(self):
        return self.name
    
class Message(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    message_type = models.CharField(max_length=50)
    bot = models.ForeignKey(Bot, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message from {self.user.email} to {self.bot.name}: {self.text[:20]}"