import json
from django.shortcuts import render, redirect
from django.views.generic import ListView, DetailView, View
from django.views.generic import TemplateView
from django.views.decorators.csrf import csrf_exempt
from .models import Client, Message
from .forms import ClientForm, AdminForm, BotForm
from django.http import JsonResponse, HttpResponse
import logging




class ClientListView(ListView):
    model = Client
    template_name = 'core/client_list.html'
    context_object_name = 'clients'

def test_view(request):
    return HttpResponse("It works!")

class HomePageView(TemplateView):
    template_name = 'core/home.html'
    
    def home(request):
        return render(request, 'home.html')

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
    
@csrf_exempt
def webhook(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_id = data.get('user_id', 'unknown_user')  # Установите значение по умолчанию для user_id
            message_text = data.get('message', '')
            message_type = data.get('message_type', 'default_type')  # Установите значение по умолчанию для message_type

            logging.info(f"Received message: {message_text}, message_type: {message_type}, user_id: {user_id}")

            # Создайте новый объект Message с полученными данными
            Message.objects.create(
                user_id=user_id,
                text=message_text,
                message_type=message_type
            )

            return JsonResponse({'status': 'ok'})
        except Exception as e:
            logging.error(f"Error processing webhook: {str(e)}")
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    else:
        return JsonResponse({'status': 'bad request'}, status=400)