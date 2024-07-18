from django.test import TestCase

from django.test import TestCase, Client
from django.urls import reverse
from .models import User, Company, UserCompanyRole, Bot, Message

class UserRegistrationTest(TestCase):
    def test_user_registration_in_multiple_companies(self):
        user = User.objects.create_user(email='testuser@example.com', password='password', name='Test User')
        company1 = Company.objects.create(name='Fitness Trainer', unique_url='https://fitness.example.com', owner=user)
        company2 = Company.objects.create(name='Hairdresser', unique_url='https://hairdresser.example.com', owner=user)
        UserCompanyRole.objects.create(user=user, company=company1, role='Client')
        UserCompanyRole.objects.create(user=user, company=company2, role='Client')
        self.assertEqual(UserCompanyRole.objects.filter(user=user).count(), 2)

class BotCreationTest(TestCase):
    def test_bot_creation(self):
        user = User.objects.create_user(email='admin@example.com', password='password', name='Admin User')
        company = Company.objects.create(name='Test Company', unique_url='https://testcompany.example.com', owner=user)
        user_role = UserCompanyRole.objects.create(user=user, company=company, role='Admin')
        bot = Bot.objects.create(name='Test Bot', token='dummy_token', admin=user_role)
        self.assertEqual(bot.name, 'Test Bot')
        self.assertEqual(bot.admin, user_role)

class WebhookTest(TestCase):
    def test_webhook(self):
        user = User.objects.create_user(email='admin@example.com', password='password', name='Admin User')
        company = Company.objects.create(name='Test Company', unique_url='https://testcompany.example.com', owner=user)
        admin_role = UserCompanyRole.objects.create(user=user, company=company, role='Admin')
        bot = Bot.objects.create(name='Test Bot', token='dummy_token', admin=admin_role)
        
        client = Client()
        response = client.post(reverse('webhook'), {
            'user_id': 'testuser@example.com',
            'message': 'Hello, World!',
            'message_type': 'text',
            'bot_id': bot.id
        }, content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Message.objects.count(), 1)
        self.assertEqual(Message.objects.first().text, 'Hello, World!')

class MessageListViewTest(TestCase):
    def test_message_list_view(self):
        user = User.objects.create_user(email='admin@example.com', password='password', name='Admin User')
        company = Company.objects.create(name='Test Company', unique_url='https://testcompany.example.com', owner=user)
        admin_role = UserCompanyRole.objects.create(user=user, company=company, role='Admin')
        bot = Bot.objects.create(name='Test Bot', token='dummy_token', admin=admin_role)
        user2 = User.objects.create_user(email='testuser@example.com', password='password', name='Test User')
        
        Message.objects.create(user=user2, text='Hello, World!', message_type='text', bot=bot)
        
        client = Client()
        client.login(email='admin@example.com', password='password')
        
        response = client.get(reverse('message_list', args=[bot.id, user2.id]))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Hello, World!')

class CompanyAdminTest(TestCase):
    def test_create_company(self):
        # Создаем суперпользователя
        user = User.objects.create_superuser(email='masteradmin@example.com', password='password', name='Master Admin')

        # Логинимся в админку
        client = Client()
        client.login(email='masteradmin@example.com', password='password')

        # Получаем URL для создания новой компании в админке
        url = reverse('admin:core_company_add')

        # Делаем POST-запрос для создания новой компании
        response = client.post(url, {
            'name': 'New Company',
            'unique_url': 'https://newcompany.example.com',
            'owner': user.id,
        })

        # Проверяем, что после создания компании происходит редирект
        self.assertEqual(response.status_code, 302)

        # Проверяем, что компания была создана
        self.assertEqual(Company.objects.count(), 1)
        self.assertEqual(Company.objects.first().name, 'New Company')