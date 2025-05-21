/** @jsxImportSource preact */
import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';

const LOADING_MESSAGES = [
  'Generando…',
  '¡Qué buen estilo!',
  '¿A dónde tan biker?',
];

export default function ProcessPage() {
  const [status, setStatus] = useState<'loading' | 'completed' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
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
        
        // Datos básicos
        ['nombre','estado','telefono'].forEach(k => {
          form.append(k, sessionStorage.getItem(k) || '');
        });

        // Enviar los IDs directamente
        ['q1', 'q2'].forEach(k => {
          form.append(k, sessionStorage.getItem(k) || '');
        });

        // Foto comprimida en sessionStorage
        const dataUrl = sessionStorage.getItem('photo')!;
        const blob = await (await fetch(dataUrl)).blob();
        form.append('photo', blob, 'selfie.png');

        console.log('🚀 Enviando a Make con sessionId', sessionId);
        // URL hardcodeada para el webhook de POST
        const webhookUrl = 'https://hook.us2.make.com/ie7cprxmog22liwjj293tomqtnx7ftkw';
        const res = await fetch(
          webhookUrl,
          { method: 'POST', body: form }
        );
        console.log('Webhook response status:', res.status, await res.text());
      } catch (e) {
        console.error('Error en sendToMake:', e);
      }
    };

    // 4) Función para hacer UN SOLO intento de polling directamente a Make
    const checkStatus = async () => {
      try {
        console.log('🔄 Consultando estado para sessionId:', sessionId);
        // Usamos la URL de polling desde .env o la URL hardcodeada como fallback
        const pollUrl = 'https://hook.us2.make.com/uixynbx5eroomd434tu96wxbf2zjdduv';
        const res = await fetch(`${pollUrl}?sessionId=${sessionId}`);
        let text = await res.text(); // Obtener respuesta como texto primero
        console.log('📥 Respuesta de Make:', { status: res.status, body: text });

        if (!res.ok) {
          throw new Error(`Error en respuesta: ${res.status} ${text}`);
        }

        // Arreglar JSON malformado (igual que lo hacía el endpoint API)
        text = text
          // 1. Remover espacios extra y saltos de línea
          .replace(/\s+/g, ' ')
          .trim()
          // 2. Poner comillas en las claves
          .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
          // 3. Poner comillas en valores sin comillas
          .replace(/:\s*([^\s,{}"]+)/g, ':"$1"')
          // 4. Arreglar URLs de Google Drive
          .replace(/"(https?:\/\/[^"]+)"/g, (match) => {
            return JSON.stringify(match.slice(1, -1));
          });
        
        console.log('JSON arreglado:', text);
        const json = JSON.parse(text);
        console.log('✨ Estado actual:', json);

        if (json.status === 'completed' && json.imageUrl) {
          console.log('🎉 Imagen lista!');
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
            console.log('🚀 Redirigiendo a resultados...');
            window.location.href = '/result';
          }, 600);
        } else {
          console.log('⏳ Aún procesando...');
        }
      } catch (e) {
        console.error('❌ Error en polling:', e);
        // No cambiar el estado a error, seguir intentando
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
        <p class="text-sm text-gray-400 max-w-xs text-center">Espera mientras generamos tu imagen personalizada...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div class="flex flex-col items-center justify-center h-full gap-6 bg-black text-white">
        <p class="text-red-500 text-center text-lg font-semibold">{errorMessage}</p>
        <button
          onClick={() => window.location.href = '/question/datos'}
          class="px-6 py-3 bg-red-600 text-white font-medium rounded-lg"
        >
          Intentar de nuevo
        </button>
      </div>
    );
  }

  return (
    <div class="flex flex-col items-center justify-center h-full gap-6 bg-black text-white">
      <img
        src={resultUrl!}
        alt="Resultado final"
      />
      <p>¡Tu imagen está lista!</p>
    </div>
  );
}
