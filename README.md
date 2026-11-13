# Amauta v1.0 · El Origen

**El Agente Biográfico Investigador** — Plataforma para la construcción de autobiografías académicas.

## Arquitectura

- **Frontend:** HTML/CSS/JS desplegado en Vercel
- **Backend:** Google Apps Script (Gemini + Google Sheets + Gmail)
- **Puente:** Vercel Serverless Function (`/api/proxy`) que resuelve CORS

## Despliegue

1. **Apps Script:** Implementar como Web App (Anyone / Me). Copiar URL.
2. **Vercel:** Configurar `APPS_SCRIPT_URL` en variables de entorno.
3. **Deploy:** Push a main → Vercel despliega automáticamente.

## Variables de Entorno

- `APPS_SCRIPT_URL`: URL de la implementación de Google Apps Script