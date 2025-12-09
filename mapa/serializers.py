from rest_framework import serializers
from .models import PuntoReciclaje

class PuntoSerializer(serializers.ModelSerializer):
    # Este campo es de solo lectura porque lo calcula el modelo automáticamente
    estimacion_dias = serializers.ReadOnlyField()

    class Meta:
        model = PuntoReciclaje
        fields = '__all__'