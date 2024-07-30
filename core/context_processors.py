from .models import Specialist, Company, Service

def specialists_context(request):
    if request.user.is_authenticated:
        user = request.user
        companies = Company.objects.filter(owner=user)
        specialists = Specialist.objects.filter(company__in=companies)
        services = Service.objects.filter(company__in=companies)
        return {'specialists': specialists, 'services': services}
    return {}