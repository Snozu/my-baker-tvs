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
  const [resultUrl, setResultUrl] = useState<string|null>(null);
  const [error, setError] = useState<string|null>(null);
  const [msgIndex, setMsgIndex] = useState(0);
  const msgInterval = useRef<number>();

  useEffect(() => {
    // Rota mensajes cada 3s
    msgInterval.current = window.setInterval(() => {
      setMsgIndex(i => (i + 1) % LOADING_MESSAGES.length);
    }, 3000);

    let sessionId: string;

    const sendToMake = async () => {
      try {
        const form = new FormData();
        // campos que guardaste en sessionStorage
        ['nombre','estado','telefono','q1','q2'].forEach(k =>
          form.append(k, sessionStorage.getItem(k) || '')
        );
        // foto
        const dataUrl = sessionStorage.getItem('photo')!;
        const blob = await (await fetch(dataUrl)).blob();
        form.append('photo', blob, 'selfie.webp');

        // 1) Envío al webhook
        const webhook = 'https://hook.us2.make.com/ie7cprxmog22liwjj293tomqtnx7ftkw';
        const res = await fetch(webhook, { method: 'POST', body: form });
        if (!res.ok) throw new Error(res.statusText);
        const payload = await res.json() as { sessionId: string };
        sessionId = payload.sessionId;

        // 2) Arranca polling
        pollResult();
      } catch (e: any) {
        clearInterval(msgInterval.current);
        setError('No se pudo enviar tus datos. Intenta de nuevo.');
        setStatus('error');
      }
    };

    const pollResult = async () => {
      try {
        const res = await fetch(`/api/getResult?sessionId=${sessionId}`);
        const json = await res.json() as { status: string; imageUrl?: string };
        if (json.status === 'completed' && json.imageUrl) {
          clearInterval(msgInterval.current);
          setResultUrl(json.imageUrl);
          setStatus('completed');
        } else if (json.status === 'processing') {
          // sigue esperando
          setTimeout(pollResult, 2000);
        } else {
          throw new Error('Estado inesperado');
        }
      } catch {
        clearInterval(msgInterval.current);
        setError('Error obteniendo el resultado. Intenta más tarde.');
        setStatus('error');
      }
    };

    sendToMake();
    return () => { clearInterval(msgInterval.current); };
  }, []);

  if (status === 'loading') {
    return (
      <div class="flex flex-col items-center justify-center h-full gap-6">
        <img src="/assets/Biker_loading.png" alt="Biker generando" class="w-32 h-32 animate-pulse" />
        <p class="text-white text-lg font-semibold">{LOADING_MESSAGES[msgIndex]}</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div class="flex flex-col items-center justify-center h-full p-4">
        <p class="text-red-500 text-center">{error}</p>
      </div>
    );
  }

  // completed
  return (
    <div class="flex flex-col items-center justify-center h-full gap-6">
      <img
        src={resultUrl!}
        alt="Resultado final"
        class="w-64 h-64 object-cover rounded-lg border-4 border-white"
      />
      <p class="text-white text-lg">¡Tu imagen está lista!</p>
    </div>
  );
}
