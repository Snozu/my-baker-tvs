/** @jsxImportSource preact */
import { h } from 'preact';
import { useRef, useEffect, useState } from 'preact/hooks';

type CameraPageProps = { className?: string };

export default function CameraPage({ className = '' }: CameraPageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Inicia y detiene la cámara
  useEffect(() => {
    let localStream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (videoRef.current && localStream) {
          videoRef.current.srcObject = localStream;
          await videoRef.current.play();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error accediendo a la cámara');
      }
    };
    startCamera();
    return () => {
      if (localStream) localStream.getTracks().forEach(track => track.stop());
    };
  }, []);

  // Captura a resolución nativa (full quality), sin comprimir
  const capture = () => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
    setCapturedImage(dataUrl);
  };

  const resetCapture = () => {
    setCapturedImage(null);
    videoRef.current?.play().catch(() => {});
  };

  // Comprime solo al enviar: escala y convierte a WebP
  const sendImage = async () => {
    if (!capturedImage) return;
    // Carga imagen completa
    const img = new Image();
    img.src = capturedImage;
    await new Promise(resolve => { img.onload = resolve; });

    // Calcula dimensiones proporcionales con max 240px
    const vw = img.width;
    const vh = img.height;
    const maxDim = 240;
    let width: number, height: number;
    if (vw > vh) {
      width = maxDim;
      height = Math.floor((vh / vw) * maxDim);
    } else {
      height = maxDim;
      width = Math.floor((vw / vh) * maxDim);
    }

    // Dibuja en canvas reducido y comprime a WebP
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, width, height);
    const compressedData = canvas.toDataURL('image/webp', 0.5);

    // Guarda en sessionStorage y redirige
    sessionStorage.setItem('photo', compressedData);
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

      {/* Vista previa full quality */}
      {capturedImage && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <img
            src={capturedImage}
            alt="Capturada"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}

      {/* Overlay y controles */}
      {!capturedImage ? (
        <> {/* Sin foto: máscara y captura */}
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
          <div className="absolute bottom-8 left-0 right-0 px-6 flex items-center justify-center z-20">
            <button
              onClick={capture}
              className="relative w-20 h-20 flex items-center justify-center active:scale-95 transition-all duration-150"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className="absolute inset-0 rounded-full border-4 border-white" />
              <div className="absolute inset-3 rounded-full border-2 border-white" />
              <div className="absolute inset-5 rounded-full bg-white" />
            </button>
            <button
              onClick={() => window.location.reload()}
              className="p-3"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <img src="/assets/icons/reverse.png" alt="Cambiar cámara" className="w-8 h-8" />
            </button>
          </div>
        </>
      ) : (
        <div className="absolute bottom-8 left-0 right-0 px-6 flex items-center justify-center z-20 space-x-4">
          <button
            onClick={resetCapture}
            className="px-6 py-3 bg-black text-white"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >Tomar otra</button>
          <button
            onClick={sendImage}
            className="px-6 py-3 bg-red-600 text-white"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >Usar foto</button>
        </div>
      )}
    </div>
  );
}
