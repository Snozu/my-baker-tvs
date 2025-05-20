/** @jsxImportSource preact */
import { h } from 'preact';
import { useRef, useEffect, useState } from 'preact/hooks';

type CameraPageProps = { className?: string };

export default function CameraPage({ className = '' }: CameraPageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // inicia / reinicia cámara al cambiar facingMode
  useEffect(() => {
    let stream: MediaStream | null = null;
    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error accediendo a la cámara');
      }
    };
    start();
    return () => stream?.getTracks().forEach(t => t.stop());
  }, [facingMode]);

  // captura full quality
  const capture = () => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext('2d')!.drawImage(v, 0, 0, canvas.width, canvas.height);
    setCapturedImage(canvas.toDataURL('image/jpeg', 1.0));
  };

  // reinicia captura
  const resetCapture = () => {
    setCapturedImage(null);
    videoRef.current?.play().catch(() => {});
  };

  // alterna cámara front/back
  const flipCamera = () => {
    resetCapture();
    setFacingMode(fm => (fm === 'user' ? 'environment' : 'user'));
  };

  // convierte a PNG y redirige a /loading
  const sendImage = async () => {
    if (!capturedImage) return;
    const img = new Image();
    img.src = capturedImage;
    await new Promise<void>(res => { img.onload = () => res(); });

    // canvas al mismo tamaño para PNG sin pérdida
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext('2d')!.drawImage(img, 0, 0, img.width, img.height);

    // extrae PNG
    const pngData = canvas.toDataURL('image/png');

    // genera sessionId y lee datos previos
    const sessionId = crypto.randomUUID();
    sessionStorage.setItem('sessionId', sessionId);
    sessionStorage.setItem('photo', pngData);

    // redirige al loading (ProcessPage hará POST + polling)
    window.location.href = '/loading';
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
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        playsInline
      />

      {capturedImage && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
          <img
            src={capturedImage}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}

      {!capturedImage && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img
            src="/assets/mascara_camara_frontal.png"
            alt="Guía de silueta"
            className="w-3/4 max-w-xs opacity-60"
          />
        </div>
      )}

      <div className="absolute bottom-8 left-0 right-0 px-6 flex items-center justify-center z-20 space-x-4">
        {!capturedImage ? (
          <>
            <button
              onClick={capture}
              className="relative w-20 h-20 flex items-center justify-center active:scale-95 transition-all"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className="absolute inset-0 rounded-full border-4 border-white" />
              <div className="absolute inset-3 rounded-full border-2 border-white" />
              <div className="absolute inset-5 rounded-full bg-white" />
            </button>
            <button
              onClick={flipCamera}
              className="p-3"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <img src="/assets/icons/reverse.png" alt="Cambiar cámara" className="w-8 h-8" />
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
