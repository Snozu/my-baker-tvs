/** @jsxImportSource preact */
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string; 
  pageUrl: string;
  title: string;
}

// --- Funciones de Compartir ---
async function shareViaNavigator(title: string, text: string, url: string) {
  if (navigator.share) {
    try {
      await navigator.share({
        title: title,
        text: text,
        url: url,
      });
      return { success: true, message: "¡Compartido exitosamente!" };
    } catch (err) {
      console.error("Error al compartir vía Navigator:", err);
      if (err instanceof Error && err.name === 'AbortError') {
        return { success: false, message: "" }; 
      }
      return { success: false, message: "No se pudo compartir." };
    }
  } else {
    return { success: false, message: "Tu navegador no soporta esta función." };
  }
}

function shareFacebookStory(url: string) {
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer');
  return { success: true, message: "Abriendo Facebook para compartir en tu historia..." };
}

function shareWhatsApp(text: string, url: string) {
  window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank', 'noopener,noreferrer');
  return { success: true, message: "Abriendo WhatsApp..." };
}

function shareInstagramStory(imageUrl: string) {
  window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
  return { 
    success: true, 
    message: "Abre Instagram y crea tu historia."
  };
}

// --- Componente ShareModal ---
export default function ShareModal({ 
  isOpen, 
  onClose, 
  imageUrl, 
  pageUrl, 
  title 
}: ShareModalProps) {
  const [feedback, setFeedback] = useState<{message: string, success: boolean} | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
    } else {
      setIsAnimating(false);
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen && !isAnimating) return null;

  const handleShareAction = async (platform: string) => {
    let result = { success: false, message: 'Opción no disponible' };
    const shareText = `¡Checa mi resultado de #MiBikerTVS! ${title}`;

    switch(platform) {
      case 'facebook-story':
        result = shareFacebookStory(pageUrl);
        break;
      case 'instagram-story':
        result = shareInstagramStory(imageUrl); 
        break;
      case 'whatsapp':
        result = shareWhatsApp(shareText, pageUrl);
        break;
      case 'more': 
        result = await shareViaNavigator(title, shareText, pageUrl);
        break;
      default:
        break;
    }
    
    if (result.message) {
        setFeedback(result);
    }
    
    if (result.success || result.message === "") {
      setTimeout(() => {
        if (platform !== 'more' || (platform === 'more' && result.success)) {
            onClose();
        }
        setFeedback(null);
      }, result.message === "" ? 50 : 2500); 
    } else {
      setTimeout(() => {
        setFeedback(null);
      }, 3000);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setFeedback({ message: "¡Enlace copiado!", success: true });
    } catch (err) {
      console.error("Error al copiar enlace:", err);
      setFeedback({ message: "No se pudo copiar.", success: false });
    }
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleOutsideClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const shareOptionsList = [
    { platform: 'facebook-story', label: 'Facebook', Icon: FacebookIcon }, // Etiqueta general, acción es Historia
    { platform: 'instagram-story', label: 'Instagram', Icon: InstagramIcon }, // Etiqueta general, acción es Historia
    { platform: 'whatsapp', label: 'Whatsapp', Icon: WhatsappIcon },
    { platform: 'more', label: 'Más', Icon: MoreIcon },
  ];

  const webShareApiAvailable = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const filteredShareOptions = webShareApiAvailable 
    ? shareOptionsList 
    : shareOptionsList.filter(opt => opt.platform !== 'more');


  return (
    <div 
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black bg-opacity-60 transition-opacity duration-300 ${isAnimating ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      onClick={handleOutsideClick}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className={`bg-white w-full transform transition-all duration-300 ease-out ${isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-full sm:translate-y-10 opacity-0'} sm:max-w-md sm:rounded-xl shadow-xl`}
        onClick={(e) => e.stopPropagation()} 
      >
        <div className="flex justify-between items-center p-4 pt-5 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-800">Compartir</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Cerrar modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        {feedback && feedback.message && (
          <div className={`mx-4 mb-1 p-3 rounded-lg text-sm text-center transition-all duration-300 ${
            feedback.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {feedback.message}
          </div>
        )}
        
        <div className="p-4 sm:px-6 pt-2 pb-4">
          <div className="flex justify-around items-start flex-wrap gap-y-4">
            {filteredShareOptions.map(({ platform, label, Icon }) => (
              <button 
                key={platform}
                onClick={() => handleShareAction(platform)}
                className="flex flex-col items-center justify-start space-y-2 w-[calc(25%-12px)] sm:w-[calc(25%-16px)] group text-center focus:outline-none" // Ajuste de ancho para 4 iconos
                aria-label={`Compartir en ${label}`}
              >
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-150 ${
                  platform === 'facebook-story' ? 'bg-blue-50 group-hover:bg-blue-100' :
                  platform === 'instagram-story' ? 'bg-pink-50 group-hover:bg-pink-100' :
                  platform === 'whatsapp' ? 'bg-green-50 group-hover:bg-green-100' :
                  'bg-gray-50 group-hover:bg-gray-100'
                }`}>
                  <Icon className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <span className="text-xs text-gray-600 group-hover:text-gray-800 transition-colors">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 sm:px-6 pb-6 pt-3">
          <p className="text-left text-xs text-gray-500 mb-2 ml-1">O comparte el enlace</p>
          <div className="flex items-center bg-gray-100 rounded-lg p-1 h-12">
            <input
              type="text"
              readOnly
              value={pageUrl}
              className="flex-grow bg-transparent text-sm text-gray-700 px-3 focus:outline-none truncate"
              onClick={(e) => (e.target as HTMLInputElement).select()}
              aria-label="Enlace para compartir"
            />
            <button
              onClick={handleCopyLink}
              className="p-2 h-10 w-10 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
              aria-label="Copiar enlace"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface IconProps {
  className?: string; 
}

const WhatsappIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path fill="#25D366" d="M17.6 6.32A8.78 8.78 0 0 0 12.48 4c-4.77 0-8.65 3.77-8.65 8.42 0 1.49.4 2.94 1.15 4.22L3.59 20l3.56-1.14a8.9 8.9 0 0 0 5.33 1.68h.01c4.77 0 8.65-3.77 8.65-8.42 0-2.25-.9-4.37-2.54-5.8zm-5.12 12.97h-.01a7.4 7.4 0 0 1-3.73-1l-.27-.16-2.77.89.91-2.59-.17-.28a7.4 7.4 0 0 1-1.2-3.93c0-3.96 3.3-7.18 7.37-7.18a7.3 7.3 0 0 1 5.19 2.14A7.28 7.28 0 0 1 19.9 12.2c0 3.96-3.3 7.1-7.42 7.1z"/>
    <path fill="#25D366" d="M15.56 13.46c-.18-.09-1.05-.51-1.22-.57-.16-.06-.28-.09-.4.09-.12.18-.46.57-.56.69-.1.12-.21.13-.38.05-.18-.09-.75-.28-1.43-.88a5.42 5.42 0 0 1-.99-1.2c-.1-.18-.01-.28.08-.37.08-.08.18-.21.27-.31.09-.1.12-.18.18-.3.06-.12.03-.22-.03-.3-.06-.09-.4-.94-.54-1.28-.14-.33-.29-.29-.4-.29-.1 0-.21-.02-.33-.02-.12 0-.31.04-.47.22-.16.18-.6.58-.6 1.42s.62 1.65.7 1.77c.09.1 1.24 1.82 3.05 2.49.43.18.76.29 1.02.37.43.14.82.12 1.13.07.34-.05 1.05-.42 1.2-.82.15-.41.15-.76.1-.83-.05-.08-.18-.13-.36-.22z"/>
  </svg>
);

const FacebookIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path fill="#1877F2" d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
  </svg>
);

const InstagramIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className}>
    <linearGradient id="insta-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#F9CE34"/>
      <stop offset="33%" stopColor="#EE2A7B"/>
      <stop offset="66%" stopColor="#6228D7"/>
      <stop offset="100%" stopColor="#4C64D3"/>
    </linearGradient>
    <path fill="url(#insta-gradient)" d="M12 7.38c-2.55 0-4.62 2.07-4.62 4.62S9.45 16.62 12 16.62s4.62-2.07 4.62-4.62S14.55 7.38 12 7.38zm0 7.62c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
    <circle fill="url(#insta-gradient)" cx="16.8" cy="7.2" r="1.08"/>
    <path fill="url(#insta-gradient)" d="M17.88 2H6.12C3.86 2 2 3.86 2 6.12v11.76C2 20.14 3.86 22 6.12 22h11.76c2.26 0 4.12-1.86 4.12-4.12V6.12C22 3.86 20.14 2 17.88 2zm0 16.88c0 1.2-.98 2.18-2.18 2.18H6.12c-1.2 0-2.18-.98-2.18-2.18V6.12c0-1.2.98-2.18 2.18-2.18h11.76c1.2 0 2.18.98 2.18 2.18v11.76z"/>
  </svg>
);

const MoreIcon = ({ className }: IconProps) => ( 
  <svg viewBox="0 0 24 24" className={className}>
    <path fill="#4A4A4A" d="M13 10V3a1 1 0 0 0-2 0v7H4a1 1 0 1 0 0 2h7v7a1 1 0 0 0 2 0v-7h7a1 1 0 0 0 0-2h-7z"/>
  </svg>
);