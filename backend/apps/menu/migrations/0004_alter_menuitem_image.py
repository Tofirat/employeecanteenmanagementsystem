from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("menu", "0002_alter_menuitem_availability_date_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="menuitem",
            name="image",
            field=models.FileField(blank=True, null=True, upload_to="menu_images/"),
        ),
    ]
