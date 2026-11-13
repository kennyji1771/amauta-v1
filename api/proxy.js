// Vercel Serverless Function - Proxy para Google Apps Script
// Resuelve el problema de CORS al hacer la llamada server-to-server

export default async function handler(req, res) {
  // Configurar CORS para el navegador
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, mensaje: 'Método no permitido' });
  }

  const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;

  if (!APPS_SCRIPT_URL) {
    return res.status(500).json({
      ok: false,
      mensaje: 'Configuración incompleta: falta APPS_SCRIPT_URL en las variables de entorno de Vercel.'
    });
  }

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      data = {
        ok: false,
        mensaje: 'Respuesta inválida del servidor de Apps Script',
        raw: text.substring(0, 300)
      };
    }

    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({
      ok: false,
      mensaje: 'Error de conexión con Apps Script: ' + error.message
    });
  }
}