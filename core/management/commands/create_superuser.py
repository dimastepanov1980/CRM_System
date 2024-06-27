from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Creates a superuser.'

    def handle(self, *args, **kwargs):
        if not User.objects.filter(username="dima").exists():
            User.objects.create_superuser(
                username="dimastepanov1980",
                email="dimastepanov1980@gmail.com",
                password="Qwaqaq_123"
            )
            self.stdout.write(self.style.SUCCESS('Superuser created successfully.'))
        else:
            self.stdout.write(self.style.SUCCESS('Superuser already exists.'))