import logging
import httpx
import asyncio

# Настройка логирования
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

async def send_to_crm(data, bot_identifier: int):
    crm_url = "http://127.0.0.1:8000/webhook/"  # Добавлен http://
    if not crm_url:
        logging.info(f"CRM URL is empty. Data to send: {data}")
        
        return

    # Логирование отправляемых данных
    logging.info(f"Sending data to CRM: {data}")

    async with httpx.AsyncClient(follow_redirects=True) as client:
        try:
            response = await client.post(crm_url, json={**data, 'bot_id': bot_identifier})
            response.raise_for_status()
            logging.info(f"Data sent to CRM: {data}")
            print(f"Data sent to CRM: {data}")
        except httpx.HTTPStatusError as e:
            logging.error(f"HTTP error sending to CRM: {e.response.text} (Status code: {e.response.status_code})")
            logging.error(f"Request URL: {e.request.url}")
            logging.error(f"Request Headers: {e.request.headers}")
            logging.error(f"Request Body: {e.request.content}")
            logging.error(f"Response Headers: {e.response.headers}")
            logging.error(f"Response Body: {e.response.content}")
        except httpx.RequestError as e:
            logging.error(f"Request error sending to CRM: {str(e)}")
            print(f"Request error sending to CRM: {str(e)}")
        except Exception as e:
            logging.error(f"Unexpected error sending to CRM: {str(e)}")

# Пример использования для тестирования
if __name__ == '__main__':
    data = {
        "user_id": "DDDD",
        "message": "Новое Новое Новое Новое ",
        "message_type": "info",
        "created_at": "2024-06-27T10:30:56"
    }
    asyncio.run(send_to_crm(data, 1))
