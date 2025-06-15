// ✅ script.js - Lógica del frontend limpia y funcional

// Traducciones UI por idioma
const UI_TRANSLATIONS = {
  placeholder: {
    en: "Ask your question...",
    es: "Haz tu pregunta...",
    cs: "Zeptejte se...",
    uk: "Задайте своє запитання..."
  },
  button: {
    en: "Ask",
    es: "Preguntar",
    cs: "Zeptat",
    uk: "Запитати"
  },
  button_labels: {
    cleaning: {
      en: "Cleaning Procedure",
      es: "Procedimiento de Limpieza",
      cs: "Čisticí postup",
      uk: "Процедура очищення"
    },
    contacts: {
      en: "Emergency Contacts",
      es: "Contactos de Emergencia",
      cs: "Nouzové kontakty",
      uk: "Аварійні контакти"
    }
  }
};

const langSelector = document.getElementById("language");

// Cambiar idioma de interfaz dinámicamente
langSelector.addEventListener("change", () => {
  const lang = langSelector.value;
  document.getElementById("question").placeholder = UI_TRANSLATIONS.placeholder[lang];
  document.querySelector(".input-group button").textContent = UI_TRANSLATIONS.button[lang];
  document.getElementById("cleaning-procedure-btn").textContent = UI_TRANSLATIONS.button_labels.cleaning[lang];
  document.getElementById("emergency-contacts-btn").textContent = UI_TRANSLATIONS.button_labels.contacts[lang];
});

// Mostrar contactos de emergencia
async function showContacts(lang) {
  try {
    const response = await fetch(`/api/contacts/${lang}`);
    const data = await response.json();
    if (data.error) throw new Error(data.error);

    alert(`📞 Contactos de emergencia:\n\nManager: ${data.manager}\n${data.emergency}`);
  } catch (error) {
    alert("❌ Error al cargar contactos: " + error.message);
  }
}

// Lógica principal del chat
async function ask(question = null) {
  const input = question || document.getElementById("question").value.trim();
  const lang = langSelector.value;
  const chatBox = document.getElementById("chat");

  if (!input) return;

  chatBox.innerHTML += `<div class="message user">${input}</div>`;
  document.getElementById("question").value = "";

  try {
    const response = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: input, lang })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }

    // Mostrar respuesta
    if (Array.isArray(data.data)) {
      chatBox.innerHTML += `<div class="message assistant">${data.data.map(line => `<div>${line}</div>`).join('')}</div>`;
    } else {
      chatBox.innerHTML += `<div class="message assistant">${data.data}</div>`;
    }
  } catch (error) {
    chatBox.innerHTML += `<div class="message error">❌ ${error.message}</div>`;
  }

  chatBox.scrollTop = chatBox.scrollHeight;
}

// Eventos al cargar
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("emergency-contacts-btn").addEventListener("click", () => {
    const lang = langSelector.value;
    showContacts(lang);
  });

  document.getElementById("cleaning-procedure-btn").addEventListener("click", () => {
    ask("how_to_clean_ice_cream_machine");
  });

  // Idioma inicial
  const initialLang = langSelector.value;
  document.getElementById("question").placeholder = UI_TRANSLATIONS.placeholder[initialLang];
  document.querySelector(".input-group button").textContent = UI_TRANSLATIONS.button[initialLang];
  document.getElementById("cleaning-procedure-btn").textContent = UI_TRANSLATIONS.button_labels.cleaning[initialLang];
  document.getElementById("emergency-contacts-btn").textContent = UI_TRANSLATIONS.button_labels.contacts[initialLang];
});
