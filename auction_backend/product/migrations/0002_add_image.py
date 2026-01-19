from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('product', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='image',
            field=models.ImageField(upload_to='products/', blank=True, null=True),
        ),
    ]