require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs'); // Necesario para leer archivos locales
const { GoogleGenerativeAI } = require('@google/generative-ai'); // SDK de Gemini

const app = express();
const PORT = process.env.PORT || 3000;

// --- 1. Inicialización de Gemini ---
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("❌ ERROR: GEMINI_API_KEY no encontrada en .env");
    process.exit(1);
}
const ai = new GoogleGenerativeAI(apiKey);
const model = "gemini-2.5-flash"; // Modelo rápido y eficiente

// --- 2. System Instruction para el Asistente ---
const systemInstruction = {
    parts: [{
        text: `
    Eres "McAsistente", un asistente de IA profesional y confiable para los empleados de McDonald's en República Checa.
    Tu audiencia son empleados de administración, planificación de turnos y personal de operaciones (cocina/caja).
    
    **TONO y LENGUAJE:** Sé formal, preciso y alentador. Responde en el idioma que se te pregunte (principalmente español, inglés, checo o ucraniano).
    
    **REGLAS DE CONTEXTO:** Siempre usa el contexto de la base de conocimiento interna proporcionado a continuación. Si la respuesta está en el contexto, úsala. Si no lo está, indica que la información no está disponible en los manuales internos.
    **TURNOS Y EMAIL:** Para gestión de turnos o redacción de emails, enfócate en la estructura, tono y buenas prácticas profesionales.
    `
    }]
};

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Función para cargar y formatear el conocimiento interno (RAG inicial).
 * Lee los JSON y los convierte en texto estructurado para inyectar en el prompt.
 */
function getKnowledgeContext() {
    let context = "";
    const knowledgePath = path.join(__dirname, 'knowledge');

    // 1. Leer procedimientos
    try {
        const procedures = fs.readFileSync(path.join(knowledgePath, 'procedures.json'), 'utf8');
        context += "### PROCEDIMIENTOS INTERNOS DE OPERACIÓN ###\n";
        context += JSON.stringify(JSON.parse(procedures), null, 2) + "\n\n";
    } catch (e) {
        console.warn("Advertencia: No se pudo cargar procedures.json.");
    }

    // 2. Leer contactos
    try {
        const contacts = fs.readFileSync(path.join(knowledgePath, 'contacts.json'), 'utf8');
        context += "### CONTACTOS INTERNOS (SÓLO PARA REFERENCIA DE LA IA) ###\n";
        context += JSON.stringify(JSON.parse(contacts), null, 2) + "\n\n";
    } catch (e) {
        console.warn("Advertencia: No se pudo cargar contacts.json.");
    }

    // --- ¡NUEVO! Cargar Manual de Cocina ---
    try {
        const kitchen = fs.readFileSync(path.join(knowledgePath, 'kitchen_manual.json'), 'utf8');
        context += "### MANUAL DE COCINA ###\n";
        context += JSON.stringify(JSON.parse(kitchen), null, 2) + "\n\n";
    } catch (e) {
        console.warn("Advertencia: No se pudo cargar kitchen_manual.json.");
    }

    // --- ¡NUEVO! Cargar Manual de McCafé ---
    try {
        const mccafe = fs.readFileSync(path.join(knowledgePath, 'mccafe_manual.json'), 'utf8');
        context += "### MANUAL DE MCCAFÉ ###\n";
        context += JSON.stringify(JSON.parse(mccafe), null, 2) + "\n\n";
    } catch (e) {
        console.warn("Advertencia: No se pudo cargar mccafe_manual.json.");
    }

    // --- ¡NUEVO! Cargar Manual de Servicio ---
    try {
        const service = fs.readFileSync(path.join(knowledgePath, 'service_manual.json'), 'utf8');
        context += "### MANUAL DE SERVICIO AL CLIENTE ###\n";
        context += JSON.stringify(JSON.parse(service), null, 2) + "\n\n";
    } catch (e) {
        console.warn("Advertencia: No se pudo cargar service_manual.json.");
    }
    // --- Fin de las nuevas cargas ---

    return context;
}

const KNOWLEDGE_CONTEXT = getKnowledgeContext(); // Carga el contexto una vez al inicio.


/**
 * Endpoint principal para el chat: utiliza Gemini y el contexto interno.
 */
app.post('/api/ask', async (req, res) => {
    const { question } = req.body;

    if (!question) {
        return res.status(400).json({ error: 'No question provided.' });
    }

    // El prompt final incluye el contexto de los procedimientos y la pregunta del usuario
    const fullPrompt = `
        ${KNOWLEDGE_CONTEXT}
        ---
        Basándote en el contexto anterior y en tu rol, responde la siguiente consulta del empleado: "${question}"
    `;

    // console.log(`Contexto enviado: ${KNOWLEDGE_CONTEXT}`); // Descomenta esto si quieres depurar el contexto
    console.log(`Consulta del empleado: ${question}`);

    try {
        // 1. Obtener el modelo generativo (con la corrección anterior)
        const chat = ai.getGenerativeModel({ model });

        // 2. Llamar a generateContent con la configuración correcta
        const result = await chat.generateContent({
            contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
            systemInstruction: systemInstruction, // Usar la instrucción del sistema definida arriba
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 1000 // Aumentado un poco por si los manuales son largos
            }
        });

        // 3. Extraer la respuesta de texto correctamente
        const response = await result.response;
        const answer = response.text();

        res.json({ data: answer });

    } catch (error) {
        console.error('Error al llamar a la API de Gemini:', error);
        res.status(500).json({ error: 'Error al conectar con la API de Gemini.', details: error.message });
    }
});

/**
 * Endpoint de contactos de emergencia (Mantenido y mejorado con contexto estático)
 */
app.get('/api/contacts/:lang', (req, res) => {
    const lang = req.params.lang || 'en';
    const data = {
        manager: 'Luis Hernández', // Ejemplo de gerente de turno
        emergency: {
            en: 'Call 112 or contact shift manager.',
            es: 'Llama al 112 o contacta al gerente de turno.',
            cs: 'Zavolejte 112 nebo kontaktujte vedoucího směny. Všechny informace naleznete v databázi CONTACTOS INTERNOS.',
            uk: 'Зателефонуйте 112 або зв’яжіться з менеджером зміни.' // <-- Añadido Ucraniano aquí también
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
    console.log("👉 Asegúrate de que tu .env contenga GEMINI_API_KEY (sin comillas).");
});