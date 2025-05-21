import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
  const sessionId = url.searchParams.get('sessionId');
  
  if (!sessionId) {
    console.error('Error: No se proporcionó sessionId');
    return new Response(JSON.stringify({
      error: 'sessionId es requerido'
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  console.log('Consultando resultado para sessionId:', sessionId);
  
  try {
    // Usamos la URL de polling desde .env
    const pollUrl = import.meta.env.PUBLIC_MAKE_POLL_URL;
    if (!pollUrl) {
      throw new Error('PUBLIC_MAKE_POLL_URL no está configurada');
    }

    console.log('Haciendo fetch a:', `${pollUrl}?sessionId=${sessionId}`);
    const res = await fetch(`${pollUrl}?sessionId=${sessionId}`);
    
    if (!res.ok) {
      throw new Error(`Make respondió con status ${res.status}`);
    }
    
    let text = await res.text();
    console.log('Respuesta de Make:', text);

    try {
      // Intentar parsear directamente primero
      const data = JSON.parse(text);
      return new Response(JSON.stringify({
        status: data.status || 'processing',
        imageUrl: data.imageUrl || null
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch {
      // Si falla, intentar arreglar el JSON malformado
      text = text
        // 1. Poner comillas en las claves
        .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
        // 2. Poner comillas en valores simples y URLs
        .replace(/:\s*([^\s,{}"]+)([,}])/g, ':"$1"$2');
      
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
    }
  } catch (error) {
    console.error('Error detallado en /api/getResult:', error);
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
