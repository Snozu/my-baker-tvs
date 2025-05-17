import { useState } from 'preact/hooks';

export interface Option {
  id: string;
  text: string;
  img: string;
}

interface Props {
  fieldName: string;
  options: Option[];
  nextUrl: string;
}

const MESSAGES: Record<string, string[]> = {

  skater: [
    '¡Genial, vas al grano!',
    '¡Puro estilo skater!',
    '¡Directo al punto, sin rodeos!',
    '¡Siempre en movimiento!'
  ],
  parapente: [
    '¡Volar libre!',
    '¡Precisión total!',
    '¡Control absoluto!',
    '¡Velocidad y precisión!'
  ],
  ritmo: [
    '¡Tu ritmo es único!',
    '¡Siempre a tu paso!',
    '¡Siguiendo tu propio compás!',
    '¡El ritmo lo pones tú!'
  ],
  terreno: [
    '¡Dominas cualquier terreno!',
    '¡Poder en tus manos!',
    '¡Nada se te resiste!',
    '¡Control total en todo momento!'
  ],
  ciudad: [
    '¡Flow urbano asegurado!',
    '¡Eres la ciudad personificada!',
    '¡Moderno y con estilo!',
    '¡La ciudad es tu lienzo!'
  ],
  
  romance: [
    '¡El amor está en el aire!',
    '¡Las mejores historias tienen romance!',
    '¡Un corazón romántico como el tuyo!',
    '¡El romance hace que todo sea más emocionante!'
  ],
  amistad: [
    '¡Los sueños son el combustible de las aventuras!',
    '¡Con amigos, todo es posible!',
    '¡Ningún sueño es demasiado grande!',
    '¡La amistad es la mejor aventura!'
  ],
  supervivencia: [
    '¡Tu instinto de supervivencia es impresionante!',
    '¡Los desafíos son oportunidades!',
    '¡Nada puede detenerte!',
    '¡Superar obstáculos es tu especialidad!'
  ],
  exploracion: [
    '¡El mundo es grande para explorar!',
    '¡Cada rincón es una aventura!',
    '¡El espíritu de exploración te guía!',
    '¡Descubrir lo desconocido es tu pasión!'
  ],
  heroe: [
    '¡El mundo necesita héroes como tú!',
    '¡Cada acto de valentía cuenta!',
    '¡Llevas un héroe dentro!',
    '¡El héroe que el mundo necesita!'
  ]
};

export default function Notificacion({ fieldName, options, nextUrl }: Props) {
  // Inicialmente ninguna opción seleccionada
  const [selected, setSelected] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const handleChange = (id: string) => {
    setSelected(id);
    const arr = MESSAGES[id] || ['¡Buena elección!'];
    setToast(arr[Math.floor(Math.random() * arr.length)]);
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <div className="w-full flex flex-col gap-8 px-5">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 bg-black bg-opacity-80 text-white px-4 py-2 rounded z-50">
          {toast}
        </div>
      )}

      <form action={nextUrl} method="get" className="flex flex-col gap-8">
        {options.map((opt) => (
          <div key={opt.id} className="flex flex-col items-center space-y-2">
            <input
              type="radio"
              name={fieldName}
              id={opt.id}
              value={opt.text}
              checked={selected === opt.id}
              onChange={() => handleChange(opt.id)}
              className="peer sr-only"
              required
            />
            <label
              htmlFor={opt.id}
              className="
                w-full border-2 py-6 px-4
                text-black border-black
                peer-checked:bg-red-600 peer-checked:text-white peer-checked:border-red-600
                text-[17px] font-bold text-center
                transition
              "
            >
              {opt.text}
            </label>
            <img
              src={opt.img}
              alt={opt.text}
              className="max-w-full h-auto py-10"
            />
          </div>
        ))}

        <button
          type="submit"
          className="mt-6 w-full py-3 bg-red-600 text-white text-lg font-bold transition"
          disabled={!selected}
        >
          Siguiente
        </button>
      </form>
    </div>
  );
}
