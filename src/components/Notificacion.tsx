import { useState, useRef, useEffect } from 'preact/hooks';

export interface Option {
  id: string;
  title?: string;
  subtitle?: string;
  text?: string; // Mantener por compatibilidad
  img: string;
}

interface Props {
  fieldName: string;
  options: Option[];
  nextUrl: string;
  formId?: string;
}

const MESSAGES: Record<string, string[]> = {
  stryker: [
    '¡Genial, vas al grano!',
    '¡Puro estilo skater!',
    '¡Directo al punto, sin rodeos!',
    '¡Siempre en movimiento!'
  ],
  rtr200: [
    '¡Volar libre!',
    '¡Precisión total!',
  ],
  'experto': [
    '¡Gran elección!',
    '¡Esta moto refleja tu personalidad!',
    '¡La libertad te espera!'
  ],
  'premium': [
    '¡Decisión inteligente!',
    '¡El camino es tuyo!',
    '¡Esta moto te llevará lejos!'
  ],
  'citadino': [
    '¡Excelente gusto!',
    '¡Esta moto define tu estilo!',
    '¡Tu viaje comienza aquí!'
  ],
  'veloz': [
    '¡Velocidad y precisión!',
    '¡Control total en tus manos!',
    '¡Adrenalina pura!'
  ],
  'recreativo': [
    '¡Diversión asegurada!',
    '¡Momentos inolvidables te esperan!',
    '¡La aventura apenas comienza!'
  ],
  'precavido': [
    '¡La seguridad es lo primero!',
    '¡Decisión inteligente!',
    '¡Confianza en el camino!'
  ],
  'audaz': [
    '¡Nacido para la aventura!',
    '¡Sin miedo a lo desconocido!',
    '¡El riesgo es tu segundo nombre!'
  ],
  spiderverse: [
    '¡El mundo necesita héroes como tú!',
  ]
};

export default function Notificacion({ options, fieldName, nextUrl, formId = 'question-form' }: Props) {
  // Estilos CSS para las flechas y animaciones modernas
  const arrowStyles = `
    .nav-arrow {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 36px;
      height: 36px;
      background-color: rgba(0, 0, 0, 0.2);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      font-weight: bold;
      cursor: pointer;
      z-index: 30;
      transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
      backdrop-filter: blur(2px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .nav-arrow:hover {
      background-color: rgba(220, 38, 38, 0.8);
      transform: translateY(-50%) scale(1.1);
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
    }

    .nav-arrow.left {
      left: 8px;
    }

    .nav-arrow.right {
      right: 8px;
    }

    /* Animaciones modernas para el carrusel */
    .carousel-container {
      position: relative;
      overflow: hidden;
    }

    .carousel-item {
      transition: all 0.6s cubic-bezier(0.33, 1, 0.68, 1);
    }

    .carousel-item-left {
      transform: scale(0.4) translateY(12px) translateX(0);
      opacity: 0.5;
      filter: blur(1px);
      z-index: 10;
    }

    .carousel-item-center {
      transform: scale(1) translateY(-10px) translateX(0);
      opacity: 1;
      z-index: 20;
      filter: blur(0);
    }

    .carousel-item-right {
      transform: scale(0.4) translateY(12px) translateX(0);
      opacity: 0.5;
      filter: blur(1px);
      z-index: 10;
    }

    /* Transición de entrada para los elementos */
    .carousel-item.entering-left {
      animation: enterFromLeft 0.6s cubic-bezier(0.33, 1, 0.68, 1) forwards;
    }

    .carousel-item.entering-right {
      animation: enterFromRight 0.6s cubic-bezier(0.33, 1, 0.68, 1) forwards;
    }

    .carousel-item.entering-center {
      animation: enterCenter 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }

    @keyframes enterFromLeft {
      from { 
        transform: scale(0.3) translateY(12px) translateX(-40px);
        opacity: 0;
        filter: blur(2px);
      }
      to { 
        transform: scale(0.4) translateY(12px) translateX(0);
        opacity: 0.5;
        filter: blur(1px);
      }
    }

    @keyframes enterFromRight {
      from { 
        transform: scale(0.3) translateY(12px) translateX(40px);
        opacity: 0;
        filter: blur(2px);
      }
      to { 
        transform: scale(0.4) translateY(12px) translateX(0);
        opacity: 0.5;
        filter: blur(1px);
      }
    }

    @keyframes enterCenter {
      from { 
        transform: scale(0.8) translateY(0);
        opacity: 0.8;
      }
      to { 
        transform: scale(1) translateY(-10px);
        opacity: 1;
      }
    }
    
    /* Estilos para indicar que el área es interactiva */
    .cursor-grab {
      cursor: grab;
    }
    
    .active\:cursor-grabbing:active {
      cursor: grabbing;
    }
  `;

  // Establecer valor inicial desde sessionStorage si existe
  const initialValue = typeof window !== 'undefined' ? sessionStorage.getItem(fieldName) : null;
  const [selected, setSelected] = useState<string | null>(initialValue);
  const [toast, setToast] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Para el manejo del carrusel
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  
  // Estados para controlar las animaciones
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | 'none'>('none');
  const [animationClass, setAnimationClass] = useState<{left: string, center: string, right: string}>({left: '', center: '', right: ''});
  
  // Gestionar el cambio de selección
  const handleChange = (id: string) => {
    setSelected(id);
    const arr = MESSAGES[id] || ['¡Buena elección!'];
    setToast(arr[Math.floor(Math.random() * arr.length)]);
    setTimeout(() => setToast(null), 2000);
  };
  
  // Manejar envío del formulario
  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (selected) {
      sessionStorage.setItem(fieldName, selected);
      window.location.href = nextUrl;
    }
  };
  
  // Funciones para navegar por el carrusel (infinito) con animaciones modernas
  const goToNext = () => {
    // Aplicar clases de animación
    setAnimationClass({
      left: '',
      center: '',
      right: 'entering-center'
    });
    
    // Esperar a que termine la animación antes de cambiar el índice
    setTimeout(() => {
      if (currentIndex < options.length - 1) {
        setCurrentIndex(prevIndex => prevIndex + 1);
      } else {
        // Volver al inicio si estamos en el último elemento
        setCurrentIndex(0);
      }
      
      // Restablecer las clases de animación
      setTimeout(() => {
        setAnimationClass({left: '', center: '', right: ''});
      }, 50);
    }, 300);
  };
  
  const goToPrevious = () => {
    // Aplicar clases de animación
    setAnimationClass({
      left: 'entering-center',
      center: '',
      right: ''
    });
    
    // Esperar a que termine la animación antes de cambiar el índice
    setTimeout(() => {
      if (currentIndex > 0) {
        setCurrentIndex(prevIndex => prevIndex - 1);
      } else {
        // Ir al último elemento si estamos en el primero
        setCurrentIndex(options.length - 1);
      }
      
      // Restablecer las clases de animación
      setTimeout(() => {
        setAnimationClass({left: '', center: '', right: ''});
      }, 50);
    }, 300);
  };
  
  // Gestionar eventos táctiles para deslizamiento
  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  
  const handleTouchMove = (e: TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  
  // Variable para almacenar el tiempo de inicio del toque
  const touchStartTime = useRef<number | null>(null);
  
  // Versión mejorada que también maneja el tiempo para calcular la velocidad
  const handleTouchStartWithTime = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartTime.current = Date.now();
  };
  
  // Simplificamos la función de manejo de deslizamiento para que solo cambie entre opciones
  const handleSwipeAreaTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const difference = touchStartX.current - touchEndX.current;
    const threshold = 50; // Mínima distancia para considerar como deslizamiento
    
    if (difference < -threshold) {
      // Deslizamiento a la derecha, ir a la siguiente opción
      goToNext();
    } else if (difference > threshold) {
      // Deslizamiento a la izquierda, ir a la opción anterior
      goToPrevious();
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
    touchStartTime.current = null;
  };
  
  // Función original para el carrusel principal
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const difference = touchStartX.current - touchEndX.current;
    const threshold = 50; // Mínima distancia para considerar como deslizamiento
    
    if (difference < -threshold) {
      // Deslizamiento a la derecha -> ir a la siguiente opción (invertido)
      goToNext();
    } else if (difference > threshold) {
      // Deslizamiento a la izquierda -> ir a la opción anterior (invertido)
      goToPrevious();
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Encontrar el índice de la opción seleccionada cuando se carga con un valor inicial
  useEffect(() => {
    if (selected) {
      const selectedIndex = options.findIndex(opt => opt.id === selected);
      if (selectedIndex !== -1) {
        setCurrentIndex(selectedIndex);
      }
    }
  }, []);
  
  // Seleccionar automáticamente la opción central
  useEffect(() => {
    if (options[currentIndex]) {
      handleChange(options[currentIndex].id);
    }
  }, [currentIndex, options]);

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Aplicar estilos CSS para las flechas */}
      <style dangerouslySetInnerHTML={{ __html: arrowStyles }} />
      {/* Toast emergente - comentado temporalmente
      {toast && (
        <div className="fixed top-1/4 right-0 bg-black text-white px-4 py-2 z-50 text-center shadow-lg animate-fadeIn">
          <div className="text-base font-medium">{toast}</div>
        </div>
      )}
      */}

      <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-2 pb-6">
        {/* Carrusel de tres tarjetas horizontal */}
        <div className="relative ">
          {/* Navegación colocada abajo */}
          
          <div 
            ref={carouselRef}
            className="w-full relative h-[340px] md:h-[420px] cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-full max-w-6xl mx-auto flex items-center justify-between px-2 md:px-4">
                {/* Tarjeta izquierda */}
                <div className="w-1/3 flex justify-center">
                  {options.length > 1 && (
                    <div 
                      className={`carousel-item carousel-item-left ${animationClass.left}`}
                      onClick={goToPrevious}
                    >
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-56 border-2 border-black bg-white p-2 text-center shadow-md flex flex-col items-center justify-center">
                          <p className="font-bold text-base">{currentIndex === 0 ? options[options.length - 1].title || options[options.length - 1].text : options[currentIndex - 1].title || options[currentIndex - 1].text}</p>
                          <p className="text-sm text-gray-700">{currentIndex === 0 ? options[options.length - 1].subtitle || '' : options[currentIndex - 1].subtitle || ''}</p>
                        </div>
                        <div className="h-28 w-28 flex items-center justify-center">
                          <img
                            src={currentIndex === 0 ? options[options.length - 1].img : options[currentIndex - 1].img}
                            alt={currentIndex === 0 ? options[options.length - 1].text : options[currentIndex - 1].text}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tarjeta central (activa) */}
                <div className="w-1/3 flex justify-center z-20">
                  {options[currentIndex] && (
                    <div className={`carousel-item carousel-item-center ${animationClass.center}`}>
                      <div className="flex flex-col items-center gap-4">
                        <div 
                          className="w-72 border-2 p-4 text-center cursor-pointer shadow-md flex flex-col items-center justify-center bg-red-600 text-white border-red-600"
                        >
                          <input
                            type="radio"
                            name={fieldName}
                            id={options[currentIndex].id}
                            value={options[currentIndex].id}
                            checked={selected === options[currentIndex].id}
                            onChange={() => handleChange(options[currentIndex].id)}
                            className="sr-only"
                            required
                          />
                          <p className="font-bold text-xl">{options[currentIndex].title || options[currentIndex].text}</p>
                          <p className="text-base mt-1">{options[currentIndex].subtitle || ''}</p>
                        </div>
                        <div className="h-48 w-48 flex items-center justify-center">
                          <img
                            src={options[currentIndex].img}
                            alt={options[currentIndex].text}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>

                      </div>
                    </div>
                  )}
                </div>

                {/* Tarjeta derecha */}
                <div className="w-1/3 flex justify-center">
                  {options.length > 1 && (
                    <div 
                      className={`carousel-item carousel-item-right ${animationClass.right}`}
                      onClick={goToNext}
                    >
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-56 border-2 border-black bg-white p-2 text-center shadow-md flex flex-col items-center justify-center">
                          <p className="font-bold text-base">{currentIndex === options.length - 1 ? options[0].title || options[0].text : options[currentIndex + 1].title || options[currentIndex + 1].text}</p>
                          <p className="text-sm text-gray-700">{currentIndex === options.length - 1 ? options[0].subtitle || '' : options[currentIndex + 1].subtitle || ''}</p>
                        </div>
                        <div className="h-28 w-28 flex items-center justify-center">
                          <img
                            src={currentIndex === options.length - 1 ? options[0].img : options[currentIndex + 1].img}
                            alt={currentIndex === options.length - 1 ? options[0].text : options[currentIndex + 1].text}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Navegación con flechas discretas */}
          <div className="nav-arrow left" onClick={goToPrevious}>‹</div>
          <div className="nav-arrow right" onClick={goToNext}>›</div>

        </div>

        <button
          type="submit"
          className={`
            mt-3 w-full py-3 md:py-4 bg-red-600 text-white text-xl font-bold transition-opacity duration-300
            ${selected ? 'opacity-100' : 'opacity-50 cursor-not-allowed'}
          `}
          disabled={!selected}
        >
          Siguiente
        </button>
      </form>
    </div>
  );
}
