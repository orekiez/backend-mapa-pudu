from django.db import models
from django.utils import timezone
import math

class PuntoReciclaje(models.Model):
    nombre = models.CharField(max_length=100)
    latitud = models.FloatField()
    longitud = models.FloatField()
    estado_llenado = models.IntegerField(default=0) 
    tipo_residuo = models.CharField(max_length=50, default="Vidrio")
    
    # Campo para el cálculo predictivo
    fecha_ultimo_vaciado = models.DateTimeField(default=timezone.now)

    # --- NUEVO CAMPO: FECHA DE CREACIÓN ---
    # auto_now_add=True hace que se guarde la hora exacta solo al crear
    fecha_creacion = models.DateTimeField(auto_now_add=True) 

    def __str__(self):
        return self.nombre

    # --- LÓGICA DE PREDICCIÓN ---
    @property
    def estimacion_dias(self):
        if self.estado_llenado == 0:
            return "Recién vaciado"
        if self.estado_llenado >= 90:
            return "¡Ya está lleno!"

        ahora = timezone.now()
        tiempo_pasado = ahora - self.fecha_ultimo_vaciado
        dias_pasados = tiempo_pasado.total_seconds() / 86400 
        
        if dias_pasados < 0.001: 
            return "Calculando..."

        velocidad_diaria = self.estado_llenado / dias_pasados
        porcentaje_restante = 90 - self.estado_llenado
        
        if velocidad_diaria > 0:
            dias_restantes = porcentaje_restante / velocidad_diaria
            if dias_restantes < 1:
                horas = int(dias_restantes * 24)
                return f"{horas} horas aprox."
            else:
                return f"{math.ceil(dias_restantes)} días aprox."
        else:
            return "Indeterminado"