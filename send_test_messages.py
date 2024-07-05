import logging
import httpx
import asyncio

# Создание пользователя
# user = User.objects.create_user(email='admin@example.com', password='password123')

# Создание администратора
# admin_instance = Admin.objects.create(user=user, name='Admin object (1)')

# Создание тестового бота
# bot = Bot.objects.create(name='Test Bot', token='test_token', admin='Admin object (1)')

# Пример отправки сообщений
async def send_test_messages():
    crm_url = "http://127.0.0.1:8000/webhook/"
    data = {
        "user_id": "UI12234",
        "message": "Новое тестовое сообщение 2",
        "message_type": "info",
        "bot_id": 1  # Замените на идентификатор существующего бота
    }

    async with httpx.AsyncClient(follow_redirects=True) as client:
        try:
            response = await client.post(crm_url, json=data)
            response.raise_for_status()
            print(f"Data sent to CRM: {data}")
        except httpx.HTTPStatusError as e:
            print(f"HTTP error sending to CRM: {e.response.text}")
        except httpx.RequestError as e:
            print(f"Request error sending to CRM: {str(e)}")

# Запуск отправки тестовых сообщений
asyncio.run(send_test_messages())