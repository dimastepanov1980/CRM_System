import json
from django.shortcuts import render, redirect
from django.views.generic import ListView, DetailView, View
from django.views.generic import TemplateView
from django.views.decorators.csrf import csrf_exempt
from .models import Client, Message
from .forms import ClientForm, AdminForm, BotForm
from django.http import JsonResponse
import logging



class ClientListView(ListView):
    model = Client
    template_name = 'core/client_list.html'
    context_object_name = 'clients'

class HomePageView(TemplateView):
    template_name = 'core/home.html'

class ClientDetailView(DetailView):
    model = Client
    template_name = 'core/client_detail.html'

class ClientCreateView(View):
    form_class = ClientForm
    template_name = 'core/client_form.html'

    def get(self, request):
        form = self.form_class()
        return render(request, self.template_name, {'form': form})

    def post(self, request):
        form = self.form_class(request.POST)
        if form.is_valid():
            form.save()
            return redirect('client-list')
        return render(request, self.template_name, {'form': form})
    
class AdminCreateView(View):
    form_class = AdminForm
    template_name = 'core/admin_form.html'

    def get(self, request):
        form = self.form_class()
        return render(request, self.template_name, {'form': form})

    def post(self, request):
        form = self.form_class(request.POST)
        if form.is_valid():
            form.save()
            return redirect('admin-list')
        return render(request, self.template_name, {'form': form})    


class BotCreateView(View):
    form_class = BotForm
    template_name = 'core/bot_form.html'

    def get(self, request):
        form = self.form_class()
        return render(request, self.template_name, {'form': form})

    def post(self, request):
        form = self.form_class(request.POST)
        if form.is_valid():
            form.save()
            return redirect('bot-list')
        return render(request, self.template_name, {'form': form})

class MessageListView(ListView):
    model = Message
    template_name = 'core/message_list.html'
    context_object_name = 'messages'
    
    def get_queryset(self):
        bot_id = self.kwargs.get('bot_id')
        return Message.objects.filter(bot_id=bot_id)  
    
    
@csrf_exempt
def receive_message(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        # Обработка данных от Telegram
        print(data)

        bot_token = data['message']['from']['id']
        message_text = data['message']['text']
        message_date = data['message']['date']

        # Получаем объект бота по токену
        bot = Bot.objects.get(token=bot_token)
        
        # Сохраняем сообщение в базу данных
        Message.objects.create(
            bot=bot,
            text=message_text,
            timestamp=message_date,
            tags='',
            category=''
        )

        return JsonResponse({'status': 'ok'})
    else:
        return JsonResponse({'status': 'bad request'}, status=400)
    