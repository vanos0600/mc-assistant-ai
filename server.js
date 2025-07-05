require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Para node-fetch v3 (ESM), import dinámico:
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/ask', async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'No question provided.' });
  }

  console.log('API Key:', process.env.OPENAI_API_KEY ? '✅ Loaded' : '❌ Not Loaded');

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: question }],
        max_tokens: 200
      })
    });

    if (!response.ok) {
      const errorDetails = await response.json();
      console.error('OpenAI API responded with error:', errorDetails);
      return res.status(response.status).json({ error: errorDetails });
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || 'No response from AI.';
    res.json({ data: answer });

  } catch (error) {
    console.error('Unexpected error calling AI API:', error);
    res.status(500).json({ error: 'Error connecting to AI API.', details: error.message });
  }
});

// Contactos de emergencia
app.get('/api/contacts/:lang', (req, res) => {
  const lang = req.params.lang || 'en';
  const data = {
    manager: 'Luis Hernández',
    emergency: {
      en: 'Call 112 or contact shift manager.',
      es: 'Llama al 112 o contacta al gerente de turno.',
      cs: 'Zavolejte 112 nebo kontaktujte vedoucího směny.',
      uk: 'Зателефонуйте 112 або зв’яжіться з менеджером зміни.'
    }
  };

  res.json({
    manager: data.manager,
    emergency: data.emergency[lang] || data.emergency['en']
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
