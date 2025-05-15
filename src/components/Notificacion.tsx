import { h } from 'preact';
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
  skater:    ['¡Genial, vas al grano!', '¡Puro estilo skater!'],
  parapente: ['¡Volar libre!', '¡Precisión total!'],
  ritmo:     ['¡Tu ritmo es único!', '¡Siempre a tu paso!'],
  terreno:   ['¡Dominas cualquier terreno!', '¡Poder en tus manos!'],
  ciudad:    ['¡Flow urbano asegurado!', '¡Eres la ciudad personificada!'],
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
