import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

const app = express();
app.use(express.json({ limit: '1mb' }));

interface AnalyzeRequestBody {
  fecha?: string;
  tipo?: string;
  distancia_km?: number;
  duracion_min?: number;
  notas?: string;
  ritmo?: string;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/analyze', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error:
        'No se encontró la clave GEMINI_API_KEY en el servidor. Configúrala en Settings > Secrets para activar el análisis con IA.',
    });
    return;
  }

  const body = (req.body || {}) as AnalyzeRequestBody;
  const tipo = String(body.tipo || 'Correr').trim();
  const fecha = String(body.fecha || '').trim();
  const distancia = Number(body.distancia_km);
  const duracion = Number(body.duracion_min);
  const ritmo = String(body.ritmo || '--:-- min/km').trim();
  const notas = String(body.notas || '').trim();

  if (!Number.isFinite(distancia) || distancia <= 0 || !Number.isFinite(duracion) || duracion <= 0) {
    res.status(400).json({
      error: 'Ingresa una distancia y duración válidas mayores a 0 para analizar el entrenamiento.',
    });
    return;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = [
      `Analiza esta sesión de entrenamiento y dame un comentario breve y práctico:`,
      `- Tipo: ${tipo}`,
      `- Fecha: ${fecha || 'Hoy'}`,
      `- Distancia: ${distancia.toFixed(2)} km`,
      `- Duración: ${duracion} min`,
      `- Ritmo calculado: ${ritmo}`,
      `- Notas del atleta: ${notas ? notas : 'Sin notas adicionales'}`,
    ].join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction:
          'Eres un entrenador experto de running y trail estilo Adidas Running. Responde siempre en español natural, directo y motivador, en un máximo de 3 frases cortas (máximo 65 palabras). Evalúa la relación entre el tipo de sesión, el ritmo obtenido y las notas, y da un consejo práctico concreto para la recuperación o el próximo entrenamiento. No uses markdown, asteriscos ni listas con viñetas.',
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
      },
    });

    const feedback = response.text?.trim();
    if (!feedback) {
      res.status(502).json({
        error: 'El modelo no devolvió texto de análisis. Intenta nuevamente.',
      });
      return;
    }

    res.json({ feedback });
  } catch (error) {
    console.error('Error en /api/analyze:', error);
    const message =
      error instanceof Error ? error.message : 'Error inesperado al consultar Gemini.';
    res.status(500).json({
      error: `No se pudo completar el análisis con IA: ${message}`,
    });
  }
});

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      const indexPath = path.join(distDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Build not found');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RunTracker Sheets server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
