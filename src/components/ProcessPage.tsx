/** @jsxImportSource preact */
import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';

const LOADING_MESSAGES = [
  'Generando…',
  '¡Qué buen estilo!',
  '¿A dónde tan biker?',
  'Creando tu experiencia…',
  'Personalizando tu moto…',
];

export default function ProcessPage() {
  const [status, setStatus] = useState<'loading' | 'completed' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [msgIndex, setMsgIndex] = useState(0);
  const msgInterval = useRef<number>();
  const [retryCount, setRetryCount] = useState(0);
  const [showRetryButton, setShowRetryButton] = useState(false);
  const [pollingFailed, setPollingFailed] = useState(false);
  const [timeoutSeconds, setTimeoutSeconds] = useState(60); // Cambiado a 60 segundos (1 minuto)
  const timeoutRef = useRef<number>();
  const pollingRef = useRef<number[]>([]);
  const [nombre, setNombre] = useState<string>('');
  const [telefono, setTelefono] = useState<string>('');  
  const [timeoutExpired, setTimeoutExpired] = useState(false);  // Nuevo estado para controlar si se agotó el tiempo

  // Estado para controlar si ya se ha enviado la petición a Make
  const [peticionEnviada, setPeticionEnviada] = useState<boolean>(false);

  // Efecto para la rotación de mensajes y contador regresivo (no depende de retryCount)
  useEffect(() => {
    // Obtener el nombre y teléfono del sessionStorage
    const nombreGuardado = sessionStorage.getItem('nombre') || '';
    const telefonoGuardado = sessionStorage.getItem('telefono') || '';
    setNombre(nombreGuardado);
    setTelefono(telefonoGuardado);
    
    // 1) Rota mensajes cada 3s
    msgInterval.current = window.setInterval(() => {
      setMsgIndex(i => (i + 1) % LOADING_MESSAGES.length);
    }, 3000);
    
    // Iniciar contador regresivo
    timeoutRef.current = window.setInterval(() => {
      setTimeoutSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timeoutRef.current);
          setShowRetryButton(true);
          setTimeoutExpired(true); // Marcar que se agotó el tiempo
          
          // Si ha pasado 1 minuto sin resultado, redirigir a la página de resultados
          // con un mensaje de disculpa
          sessionStorage.setItem('timeoutExpired', 'true');
          window.location.href = '/result';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Limpiar todos los intervalos y timeouts al desmontar
    return () => {
      clearInterval(msgInterval.current);
      clearInterval(timeoutRef.current);
      pollingRef.current.forEach(id => clearTimeout(id));
    };
  }, []); // Este efecto solo se ejecuta una vez al montar el componente

  // 3) Función que envía al webhook de Make
  const sendToMake = async () => {
    try {
      // 2) Reusa el sessionId si ya existe, o genera uno nuevo
      const sessionId = sessionStorage.getItem('sessionId') ?? crypto.randomUUID();
      sessionStorage.setItem('sessionId', sessionId);
      
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
      
      // Marcar que la petición ya ha sido enviada
      setPeticionEnviada(true);
      
      // Esperar un poco antes de iniciar el polling para dar tiempo a que Make procese
      console.log('Iniciando polling cada 7 segundos...');
      setTimeout(() => {
        // Solo iniciar el polling una vez
        startPolling();
      }, 3000); // Esperar 3 segundos antes de iniciar el polling
      
      return res;
    } catch (e) {
      console.error('Error en sendToMake:', e);
      return null;
    }
  };

  // 4) Función para hacer UN SOLO intento de polling directamente a Make
  const checkStatus = async () => {
    try {
      const sessionId = sessionStorage.getItem('sessionId') || '';
      console.log('🔄 Consultando estado para sessionId:', sessionId);
      // URL hardcodeada para el polling (esta es la que debe llamarse múltiples veces)
      const pollUrl = 'https://hook.us2.make.com/uixynbx5eroomd434tu96wxbf2zjdduv';
      
      // Agregar un timeout a la petición fetch para evitar esperas muy largas
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout
      
      const res = await fetch(`${pollUrl}?sessionId=${sessionId}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
        
        let text = await res.text(); // Obtener respuesta como texto primero
        console.log('📥 Respuesta de Make:', { status: res.status, body: text });

        if (!res.ok) {
          throw new Error(`Error en respuesta: ${res.status} ${text}`);
        }
        
        // Resetear contador de reintentos si la petición fue exitosa
        setRetryCount(0);
        setPollingFailed(false);

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
        // Incrementar contador de reintentos y mostrar mensaje
        setRetryCount(prev => prev + 1);
        setPollingFailed(true);
        
        if (retryCount >= 5) {
          // Después de 5 intentos fallidos, mostrar botón de reintentar
          setShowRetryButton(true);
        }
      }
    };
    
    // Función para limpiar todos los intervalos y timeouts
    const clearAllTimers = () => {
      clearInterval(msgInterval.current);
      clearInterval(timeoutRef.current);
      pollingRef.current.forEach(id => clearTimeout(id));
      pollingRef.current = [];
    };
    
    // Función para reiniciar el polling manualmente
    const resetPolling = () => {
      clearAllTimers();
      setRetryCount(prev => prev + 1); // Incrementar el contador para activar el efecto de reinicio
      setPollingFailed(false);
      setShowRetryButton(false);
      setTimeoutSeconds(30);
      // No llamamos a startPolling() directamente aquí, se activará por el efecto
    };
    
    // Función para iniciar el polling cada 7 segundos
    const startPolling = () => {
      // Limpiar cualquier polling existente
      pollingRef.current.forEach(id => clearTimeout(id));
      pollingRef.current = [];
      
      // Configurar polling cada 7 segundos
      // Calculamos cuántos intentos podemos hacer en 1 minuto (60 segundos)
      // Aproximadamente 8-9 intentos (60/7 ≈ 8.57)
      for (let i = 0; i <= 12; i++) { // Aumentamos a 13 intentos (hasta ~90 segundos)
        const timeoutId = window.setTimeout(() => {
          console.log(`Intento de polling #${i+1} (${i * 7}s)`);
          // Llamar a la función de verificación de estado
          checkStatus();
        }, i * 7000); // Cada 7 segundos, el primero se ejecuta inmediatamente (i=0)
        
        pollingRef.current.push(timeoutId);
      }
    };

  // Efecto para enviar la petición a Make solo una vez
  useEffect(() => {
    // Solo enviar la petición si no se ha enviado antes
    if (!peticionEnviada) {
      console.log('Enviando datos a Make (primera vez)...');
      sendToMake();
    } else {
      console.log('La petición ya ha sido enviada anteriormente, no se envía de nuevo.');
    }
    
    // Exponer la función de reinicio al objeto window para poder llamarla desde el UI
    window.resetPolling = resetPolling;
  }, []); // Este efecto solo se ejecuta una vez al montar el componente
  
  // Efecto para reiniciar el polling cuando cambie el contador de reintentos
  useEffect(() => {
    if (retryCount > 0) {
      console.log(`Reiniciando polling (intento #${retryCount})...`);
      startPolling();
    }
  }, [retryCount]); // Dependencia para que se reinicie el polling cuando cambie el contador de reintentos

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
        <h2 class="text-xl font-bold">¡Hola, {nombre}!</h2>
        <p class="text-lg font-semibold">{LOADING_MESSAGES[msgIndex]}</p>
        <p class="text-sm text-gray-400 max-w-xs text-center">Espera mientras generamos tu imagen personalizada...</p>
        <p class="text-sm text-gray-400 max-w-xs text-center">La imagen puede tardar entre 30 a 60 segundos dependiendo la conexión</p>

        
     
        
        {/* Botón de reintentar */}
        {showRetryButton && (
          <div class="mt-2 flex flex-col items-center gap-2">
            <p class="text-sm text-red-400">Está tomando más tiempo de lo esperado</p>
            <button
              onClick={() => {
                // @ts-ignore - Función expuesta en el window
                window.resetPolling();
              }}
              class="px-6 py-2 bg-red-600 text-white font-medium rounded-lg text-sm"
            >
              Volver a intentar
            </button>
            <button
              onClick={() => window.location.href = '/question/datos'}
              class="px-6 py-2 border border-gray-600 text-gray-300 font-medium rounded-lg text-sm mt-2"
            >
              Reiniciar proceso
            </button>
          </div>
        )}
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
    </div>
  );
}
