import threading # <--- IMPORTANTE: Importar esto
from rest_framework import viewsets
from django.core.mail import send_mail
from django.utils import timezone
from .models import PuntoReciclaje
from .serializers import PuntoSerializer

class PuntoViewSet(viewsets.ModelViewSet):
    queryset = PuntoReciclaje.objects.all()
    serializer_class = PuntoSerializer

    def perform_create(self, serializer):
        instancia = serializer.save()
        self.verificar_alerta(instancia) # Ya no comentamos esto

    def perform_update(self, serializer):
        try:
            nuevo_llenado = int(self.request.data.get('estado_llenado', 0))
        except:
            nuevo_llenado = serializer.instance.estado_llenado

        if nuevo_llenado == 0:
            instancia = serializer.save(fecha_ultimo_vaciado=timezone.now())
        else:
            instancia = serializer.save()
            
        self.verificar_alerta(instancia) # Ya no comentamos esto

    # --- FUNCIÓN AUXILIAR PARA EL HILO ---
    def tarea_enviar_correo(self, asunto, mensaje, remitente, destinatario):
        """Esta función se ejecuta en segundo plano (background)"""
        try:
            print("📨 Intentando enviar correo en segundo plano...")
            send_mail(
                asunto,
                mensaje,
                remitente,
                destinatario,
                fail_silently=False,
            )
            print("✅ Correo enviado con éxito.")
        except Exception as e:
            print(f"❌ Error enviando correo (pero no afectó al usuario): {e}")

    # --- LÓGICA DE ALERTA ---
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
            
            # AQUÍ ESTÁ LA MAGIA: Usamos threading
            email_thread = threading.Thread(
                target=self.tarea_enviar_correo,
                args=(asunto, mensaje, 'mreinaldo818@gmail.com', ['mreinaldo818@gmail.com'])
            )
            email_thread.start() # Inicia el proceso y sigue de largo