from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0002_flow"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="form",
            name="flow",
        ),
        migrations.RemoveField(
            model_name="form",
            name="published_flow",
        ),
    ]
