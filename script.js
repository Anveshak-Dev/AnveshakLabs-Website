const QUOTES_API = {
  random: "https://api.quotable.io/random",
  search: "https://api.quotable.io/search/quotes",
  tags: "https://api.quotable.io/tags",
};

const QUOTES_CONFIG = {
  // Categories that match our theme
  tags: [
    "technology",
    "future",
    "innovation",
    "intelligence",
    "science",
    "wisdom",
    "creativity",
    "change",
    "progress",
    "knowledge",
    "insight",
    "discovery",
  ],
  // Keywords that match our content
  keywords: [
    "intelligence",
    "quiet",
    "subtle",
    "innovation",
    "future",
    "technology",
    "transformation",
    "reimagine",
    "pioneer",
  ],
  maxLength: 150,
  minLength: 60,
};

// Only used if all APIs fail
const EMERGENCY_FALLBACK_QUOTES = [
  {
    text: "The most profound technologies are those that disappear.",
    author: "Mark Weiser",
  },
  {
    text: "Innovation is intelligence having fun.",
    author: "Albert Einstein",
  },
];

/**
 * State Management
 */
const state = {
  usedQuotes: new Set(),
  isMoving: false,
  lastX: 0,
  lastY: 0,
};

/**
 * Quote Management
 */
async function fetchQuote() {
  try {
    // Get all available tags first to ensure we're using valid ones
    const tagsResponse = await fetch(QUOTES_API.tags);
    if (!tagsResponse.ok) {
      throw new Error("Failed to fetch tags");
    }

    const allTags = await tagsResponse.json();
    const validTags = allTags
      .filter((tag) => QUOTES_CONFIG.tags.includes(tag.name.toLowerCase()))
      .map((tag) => tag.name);

    // First attempt: Get by validated tag
    if (validTags.length > 0) {
      const randomTag = validTags[Math.floor(Math.random() * validTags.length)];
      let response = await fetch(
        `${QUOTES_API.random}?tags=${randomTag}&maxLength=${QUOTES_CONFIG.maxLength}&minLength=${QUOTES_CONFIG.minLength}`
      );

      if (response.ok) {
        const data = await response.json();
        // Verify the quote is relevant
        const isRelevant = QUOTES_CONFIG.keywords.some((keyword) =>
          data.content.toLowerCase().includes(keyword.toLowerCase())
        );
        if (isRelevant) return data;
      }
    }

    // Second attempt: Search by keyword
    const randomKeyword =
      QUOTES_CONFIG.keywords[
        Math.floor(Math.random() * QUOTES_CONFIG.keywords.length)
      ];
    const response = await fetch(
      `${QUOTES_API.search}?query=${randomKeyword}&limit=20`
    );

    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        // Filter quotes by length and relevance
        const validQuotes = data.results.filter(
          (quote) =>
            quote.content.length >= QUOTES_CONFIG.minLength &&
            quote.content.length <= QUOTES_CONFIG.maxLength &&
            QUOTES_CONFIG.keywords.some((keyword) =>
              quote.content.toLowerCase().includes(keyword.toLowerCase())
            )
        );

        if (validQuotes.length > 0) {
          return validQuotes[Math.floor(Math.random() * validQuotes.length)];
        }
      }
    }

    // If both attempts fail, try random quote with basic filtering
    const randomResponse = await fetch(`${QUOTES_API.random}`);
    if (randomResponse.ok) {
      const data = await randomResponse.json();
      return data;
    }

    throw new Error("Failed to fetch relevant quote");
  } catch (error) {
    console.error("Error fetching quote:", error);
    return null;
  }
}

async function getUniqueQuote() {
  // Try to get a new quote from API
  for (let i = 0; i < 3; i++) {
    const data = await fetchQuote();
    if (!data) continue;

    const quoteKey = `${data.content}-${data.author}`;
    if (!state.usedQuotes.has(quoteKey)) {
      state.usedQuotes.add(quoteKey);
      if (state.usedQuotes.size > 100) state.usedQuotes.clear();
      return { text: data.content, author: data.author };
    }
  }
  // Fallback to unused emergency quotes
  const unusedQuotes = EMERGENCY_FALLBACK_QUOTES.filter(
    (q) => !state.usedQuotes.has(`${q.text}-${q.author}`)
  );

  if (unusedQuotes.length > 0) {
    const quote = unusedQuotes[Math.floor(Math.random() * unusedQuotes.length)];
    state.usedQuotes.add(`${quote.text}-${quote.author}`);
    return quote;
  }

  // Reset if all quotes used
  state.usedQuotes.clear();
  const quote =
    EMERGENCY_FALLBACK_QUOTES[
      Math.floor(Math.random() * EMERGENCY_FALLBACK_QUOTES.length)
    ];
  state.usedQuotes.add(`${quote.text}-${quote.author}`);
  return quote;
}

async function updateQuote() {
  const elements = {
    container: document.getElementById("quote-container"),
    quote: document.getElementById("quote"),
    author: document.getElementById("author"),
  };

  try {
    elements.container.style.opacity = "0";
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const quote = await getUniqueQuote();
    elements.quote.textContent = `"${quote.text}"`;
    elements.author.textContent = `— ${quote.author}`;
    elements.container.style.opacity = "1";
  } catch (error) {
    console.error("Error updating quote:", error);
    elements.container.style.opacity = "1";
  }
}

/**
 * Visual Effects
 */
function handleCustomCursor() {
  const cursor = document.querySelector(".custom-cursor");

  document.addEventListener("mousemove", (e) => {
    cursor.style.left = `${e.clientX}px`;
    cursor.style.top = `${e.clientY}px`;
  });

  document.addEventListener("mouseenter", () => (cursor.style.opacity = "1"));
  document.addEventListener("mouseleave", () => (cursor.style.opacity = "0"));
}

function handleRippleEffect() {
  const ripple = document.getElementById("ripple");
  let rippleTimeout;

  function moveRipple(x, y) {
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.opacity = "0.15";
    state.lastX = x;
    state.lastY = y;
  }

  document.addEventListener("mousemove", (e) => {
    if (!state.isMoving) {
      state.isMoving = true;
      ripple.style.opacity = "0.15";
    }

    clearTimeout(rippleTimeout);
    rippleTimeout = setTimeout(() => {
      moveRipple(e.clientX, e.clientY);
      setTimeout(() => {
        if (state.lastX === e.clientX && state.lastY === e.clientY) {
          ripple.style.opacity = "0";
          state.isMoving = false;
        }
      }, 100);
    }, 16);
  });

  document.addEventListener("mouseleave", () => {
    ripple.style.opacity = "0";
    state.isMoving = false;
  });
}

/**
 * Voice Greeting System
 */
function handleVoiceGreeting() {
  const elements = {
    modal: document.getElementById("voice-modal"),
    allowBtn: document.getElementById("allow-voice"),
    denyBtn: document.getElementById("deny-voice"),
  };

  // Reset voice preference on each page load
  localStorage.removeItem("voice-preference");

  // Show the modal after a short delay
  setTimeout(() => {
    elements.modal.style.opacity = "1";
    elements.modal.style.pointerEvents = "auto";
    elements.modal.querySelector("div").style.transform = "scale(1)";
  }, 1500);

  async function handleVoiceResponse(allowed) {
    elements.modal.style.opacity = "0";
    elements.modal.style.pointerEvents = "none";
    elements.modal.querySelector("div").style.transform = "scale(0.95)";

    if (allowed) {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const speech = new SpeechSynthesisUtterance(
        "Welcome to Anveshak Labs. We Reimagine Intelligence"
      );

      speech.rate = 0.9;
      speech.pitch = 1;
      speech.volume = 0.8;

      // Handle the case where voices might not be immediately available
      const getVoices = () => {
        return new Promise((resolve) => {
          let voices = speechSynthesis.getVoices();
          if (voices.length) {
            resolve(voices);
          } else {
            speechSynthesis.onvoiceschanged = () => {
              voices = speechSynthesis.getVoices();
              resolve(voices);
            };
          }
        });
      };

      const voices = await getVoices();
      const preferredVoice = voices.find(
        (voice) =>
          voice.name.includes("Samantha") ||
          voice.name.includes("Google") ||
          voice.name.includes("Female")
      );

      if (preferredVoice) speech.voice = preferredVoice;

      // Ensure any previous speech is cancelled
      speechSynthesis.cancel();
      window.speechSynthesis.speak(speech);
    }
  }

  elements.allowBtn.addEventListener("click", () => handleVoiceResponse(true));
  elements.denyBtn.addEventListener("click", () => handleVoiceResponse(false));
}

/**
 * Initialization
 */
document.addEventListener("DOMContentLoaded", () => {
  handleRippleEffect();
  handleCustomCursor();
  handleVoiceGreeting();
  updateQuote();
  setInterval(updateQuote, 60000);
});
