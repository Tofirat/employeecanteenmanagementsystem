import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User
from apps.employees.models import Employee

def fix_accounts():
    # 1. Reset Admin
    admin_user = User.objects.filter(role='admin', username='admin').first()
    if admin_user:
        admin_user.set_password('admin123')
        admin_user.is_active = True
        admin_user.save()
        print("Admin password reset to admin123")
    else:
        User.objects.create_superuser('admin', 'admin@example.com', 'admin123', role='admin')
        print("Admin user created with password admin123")

    # 2. Fix Employees
    employees = User.objects.filter(role='employee')
    for user in employees:
        if not Employee.objects.filter(user=user).exists():
            Employee.objects.create(
                user=user,
                name=f"{user.first_name} {user.last_name}".strip() or user.username,
                email=user.email,
                phone=getattr(user, 'phone', ''),
                shift='morning'
            )
            print(f"Created missing profile for employee: {user.username}")
        else:
            print(f"Profile exists for employee: {user.username}")

if __name__ == "__main__":
    fix_accounts()
