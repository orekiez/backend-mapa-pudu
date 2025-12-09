from rest_framework import viewsets
from django.core.mail import send_mail
from django.utils import timezone
from .models import PuntoReciclaje
from .serializers import PuntoSerializer

class PuntoViewSet(viewsets.ModelViewSet):
    queryset = PuntoReciclaje.objects.all()
    serializer_class = PuntoSerializer

    # AL CREAR
    def perform_create(self, serializer):
        instancia = serializer.save()
        self.verificar_alerta(instancia)

    # AL MODIFICAR
    def perform_update(self, serializer):
        # Capturamos el dato que viene llegando
        try:
            nuevo_llenado = int(self.request.data.get('estado_llenado', 0))
        except:
            nuevo_llenado = serializer.instance.estado_llenado

        # LÓGICA INTELIGENTE:
        # Si el usuario puso 0% (Vaciado), reiniciamos el reloj a "AHORA"
        if nuevo_llenado == 0:
            instancia = serializer.save(fecha_ultimo_vaciado=timezone.now())
        else:
            instancia = serializer.save()
            
        # Siempre verificamos si hay que mandar correo
        self.verificar_alerta(instancia)

    # SISTEMA DE NOTIFICACIONES (GMAIL)
    def verificar_alerta(self, punto):
        if punto.estado_llenado >= 90:
            print(f"⚠️ ALERTA: Punto {punto.nombre} crítico ({punto.estado_llenado}%)")
            
            asunto = f'🚨 URGENTE: Retiro necesario en {punto.nombre}'
            mensaje = f"""
            El punto de reciclaje "{punto.nombre}" requiere atención inmediata.
            
            📊 Nivel actual: {punto.estado_llenado}%
            ⏳ Predicción: Se llenará completamente en {punto.estimacion_dias}
            🗑️ Tipo: {punto.tipo_residuo}
            
            Sistema de Gestión Automático.
            """
            
            try:
                # Reemplaza con tus correos si es necesario, o usa los de settings
                send_mail(
                    asunto,
                    mensaje,
                    'tucorreo@gmail.com', # Remitente
                    ['tucorreo@gmail.com'], # Destinatario
                    fail_silently=True,
                )
            except Exception as e:
                print(f"Error correo: {e}")