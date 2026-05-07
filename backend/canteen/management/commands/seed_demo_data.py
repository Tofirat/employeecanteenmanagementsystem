from django.core.management.base import BaseCommand
from django.utils import timezone

from canteen.models import Announcement, Category, Employee, Feedback, MealSchedule, MenuItem, Order, OrderItem, Payment, User


class Command(BaseCommand):
    help = "Seed demo users and canteen data"

    def handle(self, *args, **options):
        admin_user, _ = User.objects.get_or_create(
            username="admin",
            defaults={"email": "admin@canteen.local", "role": "admin", "is_staff": True, "is_superuser": True},
        )
        admin_user.role = "admin"
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.set_password("admin123")
        admin_user.save()

        manager_user, _ = User.objects.get_or_create(
            username="manager",
            defaults={"email": "manager@canteen.local", "role": "manager", "is_staff": True},
        )
        manager_user.role = "manager"
        manager_user.is_staff = True
        manager_user.set_password("manager123")
        manager_user.save()

        employee_user, _ = User.objects.get_or_create(
            username="employee",
            defaults={"email": "employee@canteen.local", "role": "employee"},
        )
        employee_user.role = "employee"
        employee_user.set_password("employee123")
        employee_user.save()

        main_course, _ = Category.objects.get_or_create(name="Main Course", defaults={"description": "Daily meal selection"})
        beverages, _ = Category.objects.get_or_create(name="Beverages", defaults={"description": "Drinks and refreshments"})

        employee, _ = Employee.objects.get_or_create(
            employee_code="EMP-1001",
            defaults={
                "user": employee_user,
                "full_name": "Ayesha Rahman",
                "department": "Human Resources",
                "email": "employee@canteen.local",
                "phone": "+8801700000001",
                "wallet_balance": "2500.00",
            },
        )
        if employee.user_id != employee_user.id:
            employee.user = employee_user
            employee.save(update_fields=["user", "updated_at"])

        biryani, _ = MenuItem.objects.get_or_create(
            category=main_course,
            name="Chicken Biryani",
            defaults={"description": "Rice with chicken and salad", "price": "5.50", "calories": 640},
        )
        coffee, _ = MenuItem.objects.get_or_create(
            category=beverages,
            name="Cold Coffee",
            defaults={"description": "Chilled coffee with milk foam", "price": "2.10", "calories": 150, "is_vegetarian": True},
        )

        schedule, _ = MealSchedule.objects.get_or_create(
            title="Weekday Lunch Service",
            service_date=timezone.localdate(),
            defaults={"shift": "lunch", "start_time": "12:30", "end_time": "14:30", "is_active": True},
        )

        order, _ = Order.objects.get_or_create(
            employee=employee,
            ordered_by=employee_user,
            schedule=schedule,
            defaults={"status": "ready", "notes": "Demo seeded order"},
        )
        if not order.items.exists():
            OrderItem.objects.create(order=order, menu_item=biryani, quantity=1, unit_price=biryani.price, line_total=biryani.price)
            OrderItem.objects.create(order=order, menu_item=coffee, quantity=1, unit_price=coffee.price, line_total=coffee.price)
            order.recalculate_total()

        Payment.objects.update_or_create(
            order=order,
            defaults={"method": "wallet", "status": "paid", "amount": order.total_amount, "paid_at": timezone.now(), "transaction_reference": "DEMO-PAY-1001"},
        )

        Feedback.objects.get_or_create(employee=employee, rating=5, defaults={"comment": "Great lunch quality and smooth ordering experience."})
        Announcement.objects.get_or_create(
            title="Lunch Counter Timing Updated",
            defaults={"message": "Lunch service starts 15 minutes earlier this week.", "is_active": True, "published_at": timezone.now()},
        )

        self.stdout.write(self.style.SUCCESS("Demo data created."))
        self.stdout.write("Admin login: admin / admin123")
        self.stdout.write("Manager login: manager / manager123")
        self.stdout.write("Employee login: employee / employee123")

