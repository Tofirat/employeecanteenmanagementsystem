from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("employees", "0004_employee_profile_image_alter_employee_email_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="employee",
            name="profile_image",
            field=models.FileField(blank=True, null=True, upload_to="profile_images/"),
        ),
    ]
