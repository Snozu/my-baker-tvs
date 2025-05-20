/** @jsxImportSource preact */
import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';

const LOADING_MESSAGES = [
  'Generando…',
  '¡Qué buen estilo!',
  '¿A dónde tan biker?',
];

export default function ProcessPage() {
  const [status, setStatus] = useState<'loading' | 'completed'>('loading');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [msgIndex, setMsgIndex] = useState(0);
  const msgInterval = useRef<number>();

  useEffect(() => {
    // 1) Rota mensajes cada 3s
    msgInterval.current = window.setInterval(() => {
      setMsgIndex(i => (i + 1) % LOADING_MESSAGES.length);
    }, 3000);

    // 2) Reusa el sessionId si ya existe, o genera uno nuevo
    const sessionId =
      sessionStorage.getItem('sessionId') ??
      crypto.randomUUID();
    sessionStorage.setItem('sessionId', sessionId);

    // 3) Función que envía al webhook de Make
    const sendToMake = async () => {
      try {
        const form = new FormData();
        form.append('sessionId', sessionId);
        ['nombre','estado','telefono','q1','q2'].forEach(k => {
          form.append(k, sessionStorage.getItem(k) || '');
        });
        // Foto comprimida en sessionStorage
        const dataUrl = sessionStorage.getItem('photo')!;
        const blob = await (await fetch(dataUrl)).blob();
        form.append('photo', blob, 'selfie.png');

        console.log('🔜 Enviando a Make con sessionId', sessionId);
        const res = await fetch(
          'https://hook.us2.make.com/ie7cprxmog22liwjj293tomqtnx7ftkw',
          { method: 'POST', body: form }
        );
        console.log('Webhook response status:', res.status, await res.text());
      } catch (e) {
        console.error('Error en sendToMake:', e);
      }
    };

    // 4) Función para hacer UN SOLO intento de polling
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/status/${sessionId}`);
        if (!res.ok) throw new Error('Error en respuesta');
        const json = await res.json();

        if (json.status === 'completed' && json.imageUrl) {
          // Guardar URL y preparar redirección
          sessionStorage.setItem('resultUrl', json.imageUrl);
          setResultUrl(json.imageUrl);
          setStatus('completed');
          
          // Transición suave
          const container = document.querySelector('body');
          if (container) {
            container.style.transition = 'opacity 0.5s ease-out';
            container.style.opacity = '0';
          }
          
          // Redirigir después de la transición
          setTimeout(() => {
            console.log('Redirigiendo a resultados...');
            window.location.href = '/result';
          }, 600);
        }
      } catch (e) {
        console.error('Error en polling:', e);
      }
    };

    // 5) Enviar a Make inmediatamente
    console.log('Enviando datos a Make...');
    sendToMake();

    // 6) Programar EXACTAMENTE 3 intentos de polling
    console.log('Programando 3 intentos de polling...');
    setTimeout(() => {
      console.log('Primer intento (28s)');
      checkStatus();
    }, 28000);

    setTimeout(() => {
      console.log('Segundo intento (36s)');
      checkStatus();
    }, 36000);

    setTimeout(() => {
      console.log('Tercer y último intento (44s)');
      checkStatus();
    }, 44000);
    
    // Limpiar intervalo de mensajes al desmontar
    return () => {
      clearInterval(msgInterval.current);
    };



    return () => {
      clearInterval(msgInterval.current);
    };
  }, []);

  // UI
  if (status === 'loading') {
    return (
      <div class="flex flex-col items-center justify-center h-full gap-6 bg-black text-white">
        <img
          src="/assets/Biker_loading.png"
          alt="Cargando"
          class="w-32 h-32 animate-pulse"
          style={{ imageRendering: 'auto' }} // Mejora la calidad de renderizado
        />
        <p class="text-lg font-semibold">{LOADING_MESSAGES[msgIndex]}</p>
        <p class="text-sm text-gray-400 max-w-xs text-center">Espera mientras generamos tu imagen personalizada...</p>      </div>
    );
  }

  // completed
  return (
    <div>
      <img
        src={resultUrl!}
        alt="Resultado final"
      />
      <p>¡Tu imagen está lista!</p>
    </div>
  );
}
