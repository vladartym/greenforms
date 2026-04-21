from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="form",
            name="flow",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="form",
            name="published_flow",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="response",
            name="flow_snapshot",
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
