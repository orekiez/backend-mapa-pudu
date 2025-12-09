from django.contrib import admin
from .models import PuntoReciclaje # <--- Asegúrate que este nombre sea igual al de tu models.py

# Opción A: Registro simple (Más rápido)
# admin.site.register(PuntoReciclaje)

# Opción B: Registro Profesional (Recomendado para verse "Enterprise")
@admin.register(PuntoReciclaje)
class PuntoReciclajeAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'tipo_residuo', 'estado_llenado', 'latitud', 'longitud')
    list_filter = ('tipo_residuo',) # Crea un filtro lateral por tipo
    search_fields = ('nombre',) # Crea una barra de búsqueda