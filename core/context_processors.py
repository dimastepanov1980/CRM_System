from .models import Specialist, Company

def specialists_context(request):
    if request.user.is_authenticated:
        user = request.user
        companies = Company.objects.filter(owner=user)
        specialists = Specialist.objects.filter(company__in=companies)
        return {'specialists': specialists}
    return {}