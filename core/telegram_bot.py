import logging
from telegram import Update
from telegram.ext import Updater, CommandHandler, MessageHandler, Filters, CallbackContext
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views import View
from .models import Bot, Message
import json

# Enable logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Define a few command handlers. These usually take the two arguments update and
# context.
def start(update: Update, context: CallbackContext) -> None:
    """Send a message when the command /start is issued."""
    user = update.effective_user
    update.message.reply_text(f'Hi {user.first_name}!')

def echo(update: Update, context: CallbackContext) -> None:
    """Echo the user message."""
    update.message.reply_text(update.message.text)

    # Save message to database
    bot_token = context.bot.token
    bot = Bot.objects.get(token=bot_token)
    Message.objects.create(
        bot=bot,
        text=update.message.text,
        timestamp=update.message.date,
        tags='',
        category=''
    )

class TelegramBotView(View):
    @csrf_exempt
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request, *args, **kwargs):
        updater = Updater("7248428194:AAHnxqC_hz9QBQIq0vmWxFleLiLnFFa3dww", use_context=True)

        dispatcher = updater.dispatcher

        # on different commands - answer in Telegram
        dispatcher.add_handler(CommandHandler("start", start))

        # on noncommand i.e message - echo the message on Telegram
        dispatcher.add_handler(MessageHandler(Filters.text & ~Filters.command, echo))

        # Process the updates received
        updater.bot.process_new_updates([Update.de_json(json.loads(request.body), updater.bot)])

        return JsonResponse({'status': 'success'})