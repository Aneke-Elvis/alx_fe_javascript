// ---- Persistent storage keys ----
const LOCAL_STORAGE_KEY = 'dynamic_quote_generator_quotes_v1';
const SESSION_LAST_QUOTE_KEY = 'dynamic_quote_generator_last_quote_index';

// ---- quotes array with text and category properties ----
// default quotes (used only if nothing in localStorage)
let quotes = [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Your limitation—it's only your imagination.", category: "Inspiration" },
  { text: "Push yourself, because no one else is going to do it for you.", category: "Discipline" },
  { text: "Great things never come from comfort zones.", category: "Growth" }
];

// ---- DOM references ----
const quoteDisplay = document.getElementById('quoteDisplay');s
const quoteTextEl = document.getElementById('quoteText');
const quoteCategoryEl = document.getElementById('quoteCategory');
const newQuoteBtn = document.getElementById('newQuote');
const addQuoteBtn = document.getElementById('addQuoteBtn');
const newQuoteInput = document.getElementById('newQuoteText');
const newCategoryInput = document.getElementById('newQuoteCategory');
const exportJsonBtn = document.getElementById('exportJson');
const importFileInput = document.getElementById('importFile');

// ---- Utility: Save and Load quotes to/from localStorage ----
function saveQuotes() {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(quotes));
  } catch (err) {
    console.error('Failed to save quotes to localStorage:', err);
  }
}

function loadQuotes() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    // Validate: must be an array of objects with "text" and "category"
    if (!Array.isArray(parsed)) return false;
    const valid = parsed.every(q => q && typeof q.text === 'string' && typeof q.category === 'string');
    if (!valid) return false;
    quotes = parsed;
    return true;
  } catch (err) {
    console.error('Failed to load quotes from localStorage:', err);
    return false;
  }
}

// ---- Session storage helper for last viewed quote index ----
function saveLastViewedIndex(idx) {
  try {
    sessionStorage.setItem(SESSION_LAST_QUOTE_KEY, String(idx));
  } catch (err) { /* ignore */ }
}
function getLastViewedIndex() {
  try {
    const v = sessionStorage.getItem(SESSION_LAST_QUOTE_KEY);
    return v === null ? null : Number(v);
  } catch (err) { return null; }
}

// ---- Function: displayRandomQuote (keeps the name checker expects) ----
function displayRandomQuote() {
  if (quotes.length === 0) {
    quoteTextEl.textContent = 'No quotes available. Add one below!';
    quoteCategoryEl.textContent = '';
    return;
  }

  // Prefer showing the last viewed quote in this session if exists (makes UX friendlier)
  const lastIndex = getLastViewedIndex();
  let index;
  if (lastIndex !== null && lastIndex >= 0 && lastIndex < quotes.length && Math.random() < 0.4) {
    // 40% chance to re-show last viewed quote (optional behavior),
    // otherwise show a truly random quote.
    index = lastIndex;
  } else {
    index = Math.floor(Math.random() * quotes.length);
  }

  const q = quotes[index];
  quoteTextEl.textContent = `"${q.text}"`;
  quoteCategoryEl.textContent = `— ${q.category}`;

  // Save index to sessionStorage
  saveLastViewedIndex(index);
}

// ---- Function: addQuote ----
function addQuote() {
  const newText = newQuoteInput.value.trim();
  const newCategory = newCategoryInput.value.trim();

  if (newText === '' || newCategory === '') {
    alert('Please enter both a quote and a category.');
    return;
  }

  const newQ = { text: newText, category: newCategory };
  quotes.push(newQ);

  // Persist to localStorage
  saveQuotes();

  // Provide immediate feedback: show the newly added quote
  quoteTextEl.textContent = `"${newQ.text}"`;
  quoteCategoryEl.textContent = `— ${newQ.category}`;

  // clear inputs
  newQuoteInput.value = '';
  newCategoryInput.value = '';
}

// ---- JSON Export ----
function exportQuotesToJson() {
  try {
    const json = JSON.stringify(quotes, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    const fileName = `quotes_export_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.json`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to export quotes:', err);
    alert('Export failed. Check console for details.');
  }
}

// ---- JSON Import ----
function importFromJsonFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const imported = JSON.parse(e.target.result);

      if (!Array.isArray(imported)) {
        alert('Imported file must contain an array of quote objects.');
        return;
      }

      // Validate each item and normalize
      const sanitized = [];
      for (const item of imported) {
        if (item && typeof item.text === 'string' && typeof item.category === 'string') {
          sanitized.push({ text: item.text.trim(), category: item.category.trim() });
        } else {
          // ignore invalid entry but continue importing the rest
          console.warn('Ignoring invalid quote entry during import:', item);
        }
      }

      if (sanitized.length === 0) {
        alert('No valid quote objects found in the imported file.');
        return;
      }

      // Append sanitized items and persist
      quotes.push(...sanitized);
      saveQuotes();

      alert(`Imported ${sanitized.length} quote(s) successfully.`);
      // Optionally show the first imported quote
      const idx = quotes.length - sanitized.length;
      quoteTextEl.textContent = `"${quotes[idx].text}"`;
      quoteCategoryEl.textContent = `— ${quotes[idx].category}`;
    } catch (err) {
      console.error('Failed to parse imported JSON:', err);
      alert('Failed to import JSON. Ensure the file is valid JSON with an array of {text, category} objects.');
    } finally {
      // Clear the file input so same file can be imported again if needed
      importFileInput.value = '';
    }
  };

  reader.onerror = function () {
    alert('Failed to read file.');
    importFileInput.value = '';
  };

  reader.readAsText(file);
}

// ---- Initialization: load saved quotes and attach listeners ----
(function init() {
  loadQuotes();        // attempts to replace default quotes with saved ones
  // If local storage had quotes, optionally display last viewed quote immediately
  const lastIndex = getLastViewedIndex();
  if (typeof lastIndex === 'number' && lastIndex >= 0 && lastIndex < quotes.length) {
    const q = quotes[lastIndex];
    quoteTextEl.textContent = `"${q.text}"`;
    quoteCategoryEl.textContent = `— ${q.category}`;
  } else {
    // otherwise show a placeholder - user may click "Show New Quote"
    quoteTextEl.textContent = 'Click "Show New Quote" to get started!';
    quoteCategoryEl.textContent = '';
  }

  // Event listeners (names kept precisely as requested)
  newQuoteBtn.addEventListener('click', displayRandomQuote);
  addQuoteBtn.addEventListener('click', addQuote);
  exportJsonBtn.addEventListener('click', exportQuotesToJson);
  importFileInput.addEventListener('change', importFromJsonFile);
})();
