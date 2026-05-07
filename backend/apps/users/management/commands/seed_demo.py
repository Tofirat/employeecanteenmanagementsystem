from django.core.management.base import BaseCommand

from apps.departments.models import Department
from apps.employees.models import Employee
from apps.menu.models import MenuItem
from apps.users.models import User


class Command(BaseCommand):
    help = "Create demo admin, staff, and sample canteen data"

    def handle(self, *args, **options):
        hr, _ = Department.objects.get_or_create(department_name="Human Resources", defaults={"description": "HR team"})
        eng, _ = Department.objects.get_or_create(department_name="Engineering", defaults={"description": "Engineering team"})
        ops, _ = Department.objects.get_or_create(department_name="Operations", defaults={"description": "Operations team"})

        admin_user, _ = User.objects.get_or_create(username="admin", defaults={
            "email": "admin@canteen.local",
            "first_name": "System",
            "last_name": "Admin",
            "role": "admin",
            "is_staff": True,
            "is_superuser": True,
        })
        admin_user.email = "admin@canteen.local"
        admin_user.role = "admin"
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.set_password("admin123")
        admin_user.save()

        staff_user, _ = User.objects.get_or_create(username="staff", defaults={
            "email": "staff@canteen.local",
            "first_name": "Canteen",
            "last_name": "Staff",
            "role": "staff",
            "is_staff": True,
        })
        staff_user.email = "staff@canteen.local"
        staff_user.role = "staff"
        staff_user.is_staff = True
        staff_user.set_password("staff123")
        staff_user.save()

        employee_user, _ = User.objects.get_or_create(username="employee", defaults={
            "email": "employee@canteen.local",
            "first_name": "Ayesha",
            "last_name": "Rahman",
            "role": "employee",
        })
        employee_user.email = "employee@canteen.local"
        employee_user.role = "employee"
        employee_user.set_password("employee123")
        employee_user.save()

        Employee.objects.get_or_create(
            user=employee_user,
            defaults={
                "employee_id": "EMP-0001",
                "name": "Ayesha Rahman",
                "email": "employee@canteen.local",
                "phone": "+8801700000001",
                "department": hr,
                "profile_image": "https://placehold.co/200x200/png",
            },
        )

        MenuItem.objects.get_or_create(food_name="Chicken Biryani", meal_type="lunch", defaults={
            "description": "Fragrant rice with chicken and salad",
            "price": "5.50",
            "is_available": True,
            "image": "https://placehold.co/300x200/png",
        })
        MenuItem.objects.get_or_create(food_name="Vegetable Khichuri", meal_type="lunch", defaults={
            "description": "Comfort meal with lentils and vegetables",
            "price": "4.20",
            "is_available": True,
            "image": "https://placehold.co/300x200/png",
        })
        MenuItem.objects.get_or_create(food_name="Cold Coffee", meal_type="snack", defaults={
            "description": "Chilled coffee with milk foam",
            "price": "2.50",
            "is_available": True,
            "image": "https://placehold.co/300x200/png",
        })

        self.stdout.write(self.style.SUCCESS("Demo data seeded successfully."))
        self.stdout.write("Admin: admin / admin123")
        self.stdout.write("Staff: staff / staff123")
        self.stdout.write("Employee: employee / employee123")
