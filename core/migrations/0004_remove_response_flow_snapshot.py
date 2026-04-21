from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0003_remove_form_flow_published_flow"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="response",
            name="flow_snapshot",
        ),
    ]
