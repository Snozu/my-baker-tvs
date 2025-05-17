/** @jsxImportSource preact */
import { h } from 'preact';
import { useRef, useEffect, useState } from 'preact/hooks';

type MediaStream = MediaProvider;
type MediaStreamTrack = MediaTrack;

interface MediaProvider { getTracks(): MediaTrack[]; }
interface MediaTrack { stop(): void; }

interface CameraPageProps { className?: string; }

export default function CameraPage({ className = '' }: CameraPageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Arranca la cámara una vez
  useEffect(() => {
    const startCamera = async () => {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });
        setStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
          await videoRef.current.play();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error accediendo a la cámara');
      }
    };
    startCamera();
    return () => {
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const capture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    const v = videoRef.current;
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext('2d')!.drawImage(v, 0, 0);
    setCapturedImage(canvas.toDataURL('image/jpeg'));
  };

  const resetCapture = () => {
    setCapturedImage(null);
    videoRef.current?.play().catch(() => {});
  };

  const sendImage = () => {
    if (capturedImage) {
      // 1) Guardamos la imagen en sessionStorage
      sessionStorage.setItem('photo', capturedImage);
      console.log('Guardada en sessionStorage:', capturedImage);

      // 2) Redirigimos a la pantalla de datos / confirmación
      window.location.href = '/loading';
    }
  };

  if (error) {
    return (
      <div className={`relative w-full h-screen bg-black ${className}`}>
        <p className="text-white text-center mt-4">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-screen bg-black ${className}`}>
      {/* El video siempre debajo */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        playsInline
      />

      {/* Si hay foto, la superponemos */}
      {capturedImage && (
        <img
          src={capturedImage}
          alt="Capturada"
          className="absolute inset-0 w-full h-full object-cover z-10"
        />
      )}

      {/* Overlay silueta e instrucción solo si NO hay foto */}
      {!capturedImage && (
        <>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <img
              src="/assets/mascara_camara_frontal.png"
              alt="Guía de silueta"
              className="w-3/4 max-w-xs opacity-60"
            />
          </div>
          <div className="absolute top-8 w-full text-center px-4">
            <p className="text-white text-xl font-semibold">
              Acomoda tu rostro a la altura de la silueta
            </p>
          </div>
        </>
      )}

      {/* Controles */}
      <div className="absolute bottom-8 left-0 right-0 px-6 flex items-center justify-center z-20 space-x-6">
        {!capturedImage ? (
          <>
            {/* Galería */}
            <button className="p-3" style={{ WebkitTapHighlightColor: 'transparent' }}>
              <img
                src="/assets/icons/image.png"
                alt="Galería"
                className="w-8 h-8"
              />
            </button>

            {/* Disparador */}
            <button
              onClick={capture}
              className="relative w-20 h-20 flex items-center justify-center active:scale-95 transition-all duration-150"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className="absolute inset-0 rounded-full border-4 border-white" />
              <div className="absolute inset-3 rounded-full border-2 border-white" />
              <div className="absolute inset-5 rounded-full bg-white" />
            </button>

            {/* Cambiar cámara */}
            <button
              onClick={() => window.location.reload()}
              className="p-3"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <img
                src="/assets/icons/reverse.png"
                alt="Cambiar cámara"
                className="w-8 h-8"
              />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={resetCapture}
              className="px-6 py-3 bg-black text-white"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              Tomar otra
            </button>
            <button
              onClick={sendImage}
              className="px-6 py-3 bg-red-600 text-white"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              Usar foto
            </button>
          </>
        )}
      </div>
    </div>
  );
}
