/** @jsxImportSource preact */
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';

interface Data {
  nombre: string;
  estado: string;
  telefono: string;
  q1: string;
  q2: string;
  photo: string;
}

export default function ConfirmData() {
  const [data, setData] = useState<Data | null>(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<'idle'|'success'|'error'>('idle');

  // 1) Leer todo de sessionStorage
  useEffect(() => {
    const nombre   = sessionStorage.getItem('nombre')   || '';
    const estado   = sessionStorage.getItem('estado')   || '';
    const telefono = sessionStorage.getItem('telefono') || '';
    const q1       = sessionStorage.getItem('q1')       || '';
    const q2       = sessionStorage.getItem('q2')       || '';
    const photo    = sessionStorage.getItem('photo')    || '';
    setData({ nombre, estado, telefono, q1, q2, photo });
  }, []);

  const sendAll = async () => {
    if (!data) return;
    setSending(true);

    try {
      // 2) Convertir DataURL a Blob
      const res = await fetch(data.photo);
      const blob = await res.blob();

      // 3) FormData con campos de texto + foto
      const form = new FormData();
      form.append('nombre',   data.nombre);
      form.append('estado',   data.estado);
      form.append('telefono', data.telefono);
      form.append('q1',       data.q1);
      form.append('q2',       data.q2);
      form.append('photo',    blob, 'selfie.jpg');

      // 4) POST al webhook de Make
      const webhookUrl = 'https://hook.us2.make.com/ie7cprxmog22liwjj293tomqtnx7ftkw';
      const webhookRes = await fetch(webhookUrl, {
        method: 'POST',
        body: form,
      });

      if (!webhookRes.ok) {
        throw new Error(`HTTP ${webhookRes.status}`);
      }

      // 5) Éxito
      setResult('success');
    } catch (err) {
      console.error('Error enviando al webhook:', err);
      setResult('error');
    } finally {
      setSending(false);
    }
  };

  if (!data) {
    return <p class="text-white text-center mt-10">Cargando datos…</p>;
  }

  return (
    <div class="flex flex-col items-center justify-center w-full gap-4 text-white p-6">
      {/* Tu selfie */}
      <div class="relative w-64 h-64 rounded-lg overflow-hidden border-4 border-gray-400">
        <img
          src={data.photo}
          alt="Tu foto"
          class="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Resumen de texto */}
      <div class="text-center space-y-2">
        <p><strong>Nombre:</strong> {data.nombre}</p>
        <p><strong>Estado:</strong> {data.estado}</p>
        <p><strong>Teléfono:</strong> {data.telefono}</p>
        <p><strong>Aventurero:</strong> {data.q1}</p>
        <p><strong>Mundo ideal:</strong> {data.q2}</p>
      </div>

      {/* Botón de envío */}
      <button
        onClick={sendAll}
        disabled={sending || result === 'success'}
        class={`mt-6 w-full py-3 rounded-lg font-medium transition
          ${sending ? 'bg-gray-500' : 'bg-appred hover:bg-red-700'} 
          ${result === 'success' ? 'bg-green-600' : ''}
        `}
      >
        {sending
          ? 'Enviando…'
          : result === 'success'
            ? '¡Enviado!'
            : result === 'error'
              ? 'Reintenta'
              : '¡Regístrate con TVS!'}
      </button>
    </div>
  );
}
