// ✅ McD Employee Assistant - Servidor limpio y funcional

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { networkInterfaces } from 'os';

// 🗂 Configurar rutas base
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 📦 Cargar configuración y archivos de conocimiento
dotenv.config();
const procedures = JSON.parse(readFileSync(join(__dirname, 'knowledge', 'procedures.json'), 'utf-8'));
const contacts = JSON.parse(readFileSync(join(__dirname, 'knowledge', 'contacts.json'), 'utf-8'));

// 🚀 Configurar servidor Express
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// 🌐 Obtener IP local para mostrar en consola
const getLocalIp = (() => {
  let cachedIp = null;
  return () => {
    if (cachedIp) return cachedIp;
    const interfaces = networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          cachedIp = iface.address;
          return cachedIp;
        }
      }
    }
    cachedIp = 'localhost';
    return cachedIp;
  };
})();

// 🩺 Endpoint de salud del servidor
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', ip: getLocalIp(), version: '1.0.0' });
});

// 🌍 Servir la interfaz
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'), (err) => {
    if (err) {
      console.error('Error al servir index.html:', err.message);
      res.status(404).send('Archivo no encontrado');
    }
  });
});

// 📞 Ruta para obtener contactos por idioma
app.get('/api/contacts/:lang', (req, res) => {
  const lang = req.params.lang;
  res.json(contacts[lang] || { error: 'Idioma no disponible' });
});

// 💬 Ruta para procesar preguntas de empleados
app.post('/api/ask', async (req, res) => {
  const { question, lang = 'en' } = req.body;

  try {
    if (typeof question !== 'string') {
      return res.status(400).json({ error: getErrorMessage(lang), details: 'Formato de pregunta inválido' });
    }

    const lowerQ = question.toLowerCase().trim();
    const localAnswer = procedures[lowerQ]?.[lang];
    if (localAnswer) return res.json({ type: 'manual', data: localAnswer });

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: getErrorMessage(lang), details: 'Falta la clave de OpenAI' });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemMessages = {
      en: 'You are a helpful assistant for company procedures. Answer concisely and clearly.',
      es: 'Eres un asistente útil para los procedimientos de la empresa. Responde de forma concisa y clara.',
      cs: 'Jste užitečný asistent pro firemní postupy. Odpovídejte stručně a jasně.',
      uk: 'Ви корисний помічник для процедур компанії. Відповідайте коротко і чітко.'
    };

    const maxTokens = Math.max(200, 4096 - question.length - 50);

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemMessages[lang] || systemMessages.en },
        { role: 'user', content: question }
      ],
      temperature: 0.7,
      max_tokens: maxTokens
    });

    const answer = completion.choices[0]?.message?.content || getErrorMessage(lang);
    res.json({ type: 'ai', data: answer });

  } catch (err) {
    console.error('❌ Error en /api/ask:', err);
    res.status(500).json({ error: getErrorMessage(lang), details: err.message });
  }
});

// 🛑 Función para mensajes de error por idioma
function getErrorMessage(lang) {
  const errors = {
    en: 'Service unavailable, try again later',
    es: 'Servicio no disponible, intenta nuevamente',
    cs: 'Služba není dostupná, zkuste to později',
    uk: 'Сервіс недоступний, спробуйте пізніше'
  };
  return errors[lang] || errors.en;
}

// 🟢 Iniciar servidor
app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Servidor activo:
- Local: http://localhost:${port}
- Red: http://${getLocalIp()}:${port}`);
});

// Test básico
app.get('/test', (req, res) => {
  res.send('✅ ¡El servidor funciona correctamente!');
});

app.post('/api/ask', async (req, res) => {
  const { question, lang = 'en' } = req.body;
  console.log('🔍 Pregunta:', question);

  try {
    if (typeof question !== 'string') {
      console.log('⚠️ Pregunta inválida');
      return res.status(400).json({ error: getErrorMessage(lang), details: 'Formato de pregunta inválido' });
    }

    const localAnswer = procedures[question.toLowerCase()?.trim()]?.[lang];
    if (localAnswer) {
      console.log('📘 Respuesta local encontrada');
      return res.json({ type: 'manual', data: localAnswer });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.log('❌ Falta clave de OpenAI');
      return res.status(500).json({ error: getErrorMessage(lang), details: 'Falta la clave de OpenAI' });
    }

    console.log('🧠 Solicitando respuesta a OpenAI...');

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant for McDonald’s employees. Answer clearly and concisely.' },
        { role: 'user', content: question }
      ],
      temperature: 0.5,
      max_tokens: 300
    });

    console.log('✅ Respuesta de OpenAI recibida');

    const answer = completion.choices[0]?.message?.content || getErrorMessage(lang);
    res.json({ type: 'ai', data: answer });

  } catch (err) {
    console.error('❌ Error capturado:', err);
    res.status(500).json({ error: getErrorMessage(lang), details: err.message });
  }
});
