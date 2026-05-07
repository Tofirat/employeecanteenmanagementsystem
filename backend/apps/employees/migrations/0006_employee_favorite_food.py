from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("employees", "0005_alter_employee_profile_image"),
    ]

    operations = [
        migrations.AddField(
            model_name="employee",
            name="favorite_food",
            field=models.CharField(blank=True, default="", max_length=150),
        ),
    ]
