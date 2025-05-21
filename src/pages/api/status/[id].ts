import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const { id } = params;
  
  if (!id) {
    console.error('Error: No se proporcionó ID');
    return new Response(JSON.stringify({
      error: 'Se requiere ID'
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  console.log('Consultando estado para ID:', id);
  
  try {
    // Usamos la URL de polling desde .env
    const pollUrl = import.meta.env.PUBLIC_MAKE_POLL_URL;
    if (!pollUrl) {
      throw new Error('PUBLIC_MAKE_POLL_URL no está configurada');
    }

    console.log('Haciendo fetch a:', `${pollUrl}?sessionId=${id}`);
    const res = await fetch(`${pollUrl}?sessionId=${id}`);
    
    if (!res.ok) {
      throw new Error(`Make respondió con status ${res.status}`);
    }
    
    let text = await res.text();
    console.log('Respuesta de Make:', text);

    // Arreglar JSON malformado
    text = text
      // 1. Remover espacios extra y saltos de línea
      .replace(/\s+/g, ' ')
      .trim()
      // 2. Poner comillas en las claves
      .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
      // 3. Poner comillas en valores sin comillas
      .replace(/:\s*([^\s,{}"]+)/g, ':"$1"')
      // 4. Arreglar URLs de Google Drive
      .replace(/"(https?:\/\/[^"]+)"/g, (match) => {
        return JSON.stringify(match.slice(1, -1));
      });
    
    console.log('JSON arreglado:', text);
    const data = JSON.parse(text);
    console.log('Data parseada:', data);

    return new Response(JSON.stringify({
      status: data.status || 'processing',
      imageUrl: data.imageUrl || null
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error detallado en /api/status:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Error al consultar el estado'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
