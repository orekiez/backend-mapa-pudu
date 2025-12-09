from django.db import models
from django.utils import timezone
import math

class PuntoReciclaje(models.Model):
    nombre = models.CharField(max_length=100)
    latitud = models.FloatField()
    longitud = models.FloatField()
    estado_llenado = models.IntegerField(default=0) 
    tipo_residuo = models.CharField(max_length=50, default="Vidrio")
    
    # NUEVO CAMPO: Memoria de cuándo se vació por última vez
    fecha_ultimo_vaciado = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.nombre

    # --- LÓGICA DE PREDICCIÓN (IA MATEMÁTICA) ---
    @property
    def estimacion_dias(self):
        # 1. Casos obvios donde no calculamos
        if self.estado_llenado == 0:
            return "Recién vaciado"
        if self.estado_llenado >= 90:
            return "¡Ya está lleno!"

        # 2. Calcular tiempo real transcurrido
        ahora = timezone.now()
        tiempo_pasado = ahora - self.fecha_ultimo_vaciado
        dias_pasados = tiempo_pasado.total_seconds() / 86400 # Segundos a Días
        
        # Evitar errores si se acaba de crear hace 1 segundo
        if dias_pasados < 0.001: 
            return "Calculando..."

        # 3. Calcular Velocidad (% que se llena por día)
        velocidad_diaria = self.estado_llenado / dias_pasados

        # 4. Proyectar al futuro (¿Cuándo llega al 90%?)
        porcentaje_restante = 90 - self.estado_llenado
        
        if velocidad_diaria > 0:
            dias_restantes = porcentaje_restante / velocidad_diaria
            
            # Formato amigable de respuesta
            if dias_restantes < 1:
                horas = int(dias_restantes * 24)
                return f"{horas} horas aprox."
            else:
                return f"{math.ceil(dias_restantes)} días aprox."
        else:
            return "Indeterminado"