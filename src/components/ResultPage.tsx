/** @jsxImportSource preact */
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';

interface Props {
  sessionId: string;
  resultUrl?: string;  // ahora opcional
  pageUrl: string;
}

export default function ResultPage({ sessionId, resultUrl = '', pageUrl }: Props) {
  const [nombre, setNombre] = useState<string>('');
  const [photo, setPhoto]   = useState<string>('');

  useEffect(() => {
    // Leemos nombre y foto desde sessionStorage
    setNombre(sessionStorage.getItem('nombre') || '');
    setPhoto(sessionStorage.getItem('photo')    || '');
  }, []);

  // Si ya tienes un resultUrl (hosteada), lo usas; si no, tiras de photo de sessionStorage
  const displayUrl = resultUrl && resultUrl.length > 10 
    ? resultUrl 
    : photo;

  const title     = `¡Ser biker va contigo ${nombre}!`;
  // const subtitle  = 'Tu tipo es muy';
  // const modelName = 'RONIN';
  // const desc      = 'Libre como el viento y rebelde con causa.';

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = displayUrl;
    a.download = `mi_biker_${sessionId}.jpg`;
    a.click();
  };

  const handleShareFacebook = () => {
    const shareUrl = encodeURIComponent(pageUrl);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
      'fbshare',
      'width=600,height=400'
    );
  };

  if (!displayUrl) {
    return <p class="text-center text-lg mt-10">No hay imagen para mostrar.</p>;
  }

  return (
    <div class="flex flex-col items-center px-6 space-y-6">
      <h1 class="text-center text-2xl font-semibold">{title}</h1>

      <div class="relative w-full max-w-sm shadow-lg">
        <img
          src={displayUrl}
          alt="Tu resultado biker"
          class="w-full h-auto object-cover"
        />
        <button
          onClick={handleDownload}
          class="absolute top-2 right-2 bg-black bg-opacity-50 p-2 rounded-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"/>
          </svg>
        </button>
      </div>

      {/* <div class="w-full max-w-sm bg-black text-center py-4 space-y-1">
        <p class="text-white text-sm">{subtitle}</p>
        <p class="text-white text-xl font-bold">{modelName}</p>
        <p class="text-white text-sm">{desc}</p>
      </div> */}

      <p class="text-center text-base">¡Que empiece la rodada a tu aventura!</p>

      <div class="w-full max-w-sm flex flex-col space-y-4">
        <button
          onClick={handleShareFacebook}
          class="w-full py-3 bg-red-600 text-white font-medium rounded-none"
        >
          Compartir en Facebook
        </button>
        <button
          onClick={() => window.location.href = '/question/datos'}
          class="w-full py-3 border border-black text-black font-medium rounded-none"
        >
          Hagámoslo otra vez
        </button>
      </div>

      <p class="text-center text-sm mt-6 font-semibold">
        #MiBiker<span class="text-red-600">TVS</span>
      </p>
      <img src="/assets/icons/TVS_ICONO.png" alt="TVS Logo" class="h-8 mt-2" />
    </div>
  );
}
