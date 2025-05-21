/** @jsxImportSource preact */
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import ShareModal from './ShareModal';

interface Props {
  sessionId: string;
  resultUrl?: string;  // ahora opcional
  pageUrl: string;
}

export default function ResultPage({ sessionId, resultUrl = '', pageUrl }: Props) {
  const [nombre, setNombre] = useState<string>('');
  const [displayUrl, setDisplayUrl] = useState<string>('');
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const n = sessionStorage.getItem('nombre') || '';
    const photo = sessionStorage.getItem('photo') || '';
    const result = sessionStorage.getItem('resultUrl') || '';
    
    setNombre(n);
    
    // Determinar la URL a mostrar
    if (result && result.length > 10) {
      // Comprueba si es una URL de Google Drive
      if (result.includes('drive.google.com/file')) {
        // Extraer el ID del archivo de la URL de Google Drive
        const fileIdMatch = result.match(/\/d\/([^\/?]+)/);
        
        if (fileIdMatch && fileIdMatch[1]) {
          const fileId = fileIdMatch[1];
          // Usar directamente la URL de vista previa para iframe
          const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
          setDisplayUrl(previewUrl);
        } else {
          setDisplayUrl(result);
        }
      } else {
        setDisplayUrl(result);
      }
    } else if (photo) {
      // Si no hay URL de resultado, usar la foto original
      setDisplayUrl(photo);
    }
  }, []);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = displayUrl;
    a.download = `mi_biker_${sessionId}.webp`;
    a.click();
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };
  
  if (!displayUrl) {
    return <p class="text-center text-lg mt-10">No hay imagen para mostrar.</p>;
  }
  
  return (
    <div class="flex flex-col items-center px-6 space-y-6">
      <h1 class="text-center text-2xl font-semibold">
        ¡Ser biker va contigo, {nombre}!
      </h1>

      <div class="relative w-full max-w-sm shadow-lg image-container">
        {/* Para URLs de Google Drive, usar siempre iframe */}
        {displayUrl.includes('drive.google.com/file') ? (
          <div>
            <iframe 
              src={displayUrl}
              width="100%"
              height="400"
              frameBorder="0"
              allowFullScreen
              className="rounded-lg"
            />
            <p className="text-center text-sm mt-2 text-gray-200">Si la imagen no se ve, haz click para abrir en Drive</p>
          </div>
        ) : (
          // Para otras imágenes regulares
          <img
            src={displayUrl}
            alt="Tu resultado biker"
            className="w-full h-auto object-cover rounded-lg"
          />
        )}
        <button
          onClick={handleDownload}
          class="absolute top-2 right-2 bg-black bg-opacity-50 p-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        </button>
      </div>

      <p class="text-center text-base">¡Que empiece la rodada a tu aventura!</p>

      <div class="w-full max-w-sm flex flex-col space-y-4">
        <button
          onClick={handleShare}
          class="w-full py-3 bg-red-600 text-white font-medium"
        >
          Compartir
        </button>
        <button
          onClick={() => window.location.href = '/question/datos'}
          class="w-full py-3 border border-black text-black font-medium"
        >
          Hagámoslo otra vez
        </button>
      </div>
      
      <h1 class="text-2xl font-bold mb-4">¡Tu imagen está lista!</h1>
      <p class="text-center text-sm mt-6 font-semibold">
        #MiBiker<span class="text-red-600">TVS</span>
      </p>
      <img src="/assets/icons/TVS_ICONO.png" alt="TVS Logo" class="h-8 mt-2" />
      
      {/* Modal de compartir (renderizado condicionalmente) */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        imageUrl={displayUrl}
        pageUrl={window.location.href} // URL actual para compartir
        title="¡Tu imagen está lista!"
      />
    </div>
  );
}