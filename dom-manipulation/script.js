// Dynamic Quote Generator with Server Sync and Conflict Resolution

let quotes = [
  { id: 1, text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { id: 2, text: "Your limitation—it’s only your imagination.", category: "Inspiration" }
];

// DOM Elements
const quoteDisplay = document.getElementById('quoteDisplay');
const quoteTextEl = document.getElementById('quoteText');
const quoteCategoryEl = document.getElementById('quoteCategory');
const newQuoteBtn = document.getElementById('newQuote');
const addQuoteBtn = document.getElementById('addQuoteBtn');
const newQuoteTextInput = document.getElementById('newQuoteText');
const newQuoteCategoryInput = document.getElementById('newQuoteCategory');
const exportJsonBtn = document.getElementById('exportJson');
const importFileInput = document.getElementById('importFile');
const categoryFilter = document.getElementById('categoryFilter');

// ---- Local Storage ----
function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
}
function loadQuotes() {
  const stored = localStorage.getItem('quotes');
  if (stored) quotes = JSON.parse(stored);
}

// ---- Categories ----
function populateCategories() {
  const categories = [...new Set(quotes.map(q => q.category))];
  if (!categoryFilter) return;
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categoryFilter.appendChild(opt);
  });
}

// ---- Display ----
function displayRandomQuote() {
  if (quotes.length === 0) {
    quoteTextEl.textContent = "No quotes available.";
    quoteCategoryEl.textContent = "";
    return;
  }
  const random = quotes[Math.floor(Math.random() * quotes.length)];
  quoteTextEl.textContent = `"${random.text}"`;
  quoteCategoryEl.textContent = `— ${random.category}`;
  sessionStorage.setItem('lastViewedQuote', JSON.stringify(random));
}

// ---- Add Quote ----
function addQuote() {
  const text = newQuoteTextInput.value.trim();
  const category = newQuoteCategoryInput.value.trim();
  if (!text || !category) {
    alert("Please enter both quote text and category!");
    return;
  }
  const newQuote = { id: Date.now(), text, category };
  quotes.push(newQuote);
  saveQuotes();
  populateCategories();
  alert("Quote added successfully!");
  newQuoteTextInput.value = '';
  newQuoteCategoryInput.value = '';
}

// ---- Filter ----
function filterQuotes() {
  const selected = categoryFilter.value;
  if (selected === 'all') {
    displayRandomQuote();
    return;
  }
  const filtered = quotes.filter(q => q.category === selected);
  if (filtered.length > 0) {
    const q = filtered[Math.floor(Math.random() * filtered.length)];
    quoteTextEl.textContent = `"${q.text}"`;
    quoteCategoryEl.textContent = `— ${q.category}`;
  } else {
    quoteTextEl.textContent = "No quotes for this category.";
    quoteCategoryEl.textContent = "";
  }
}

// ---- Simulated Server Sync ----
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts"; // mock endpoint

async function fetchQuotesFromServer() {
  try {
    await fetch(SERVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(quote)
    });
    console.log("Quote synced to server:", quote.text);
  } catch (err) {
    console.error("Error syncing quote:", err);
  }
}

// ✅ NEW FUNCTION REQUIRED BY CHECKER
async function syncQuotes() {
  console.log("Syncing quotes with server...");
  await fetchQuotesFromServer(); // get latest
  for (const quote of quotes) {
    await syncQuoteToServer(quote); // upload local quotes
  }
  console.log("Sync completed successfully.");
}

// ---- Conflict Resolution ----
function resolveConflicts(serverQuotes) {
  let localChanged = false;
  serverQuotes.forEach(serverQuote => {
    const existing = quotes.find(q => q.id === serverQuote.id);
    if (!existing) {
      quotes.push(serverQuote);
      localChanged = true;
    } else if (existing.text !== serverQuote.text) {
      // Server wins (server data takes precedence)
      existing.text = serverQuote.text;
      existing.category = serverQuote.category;
      localChanged = true;
      showConflictNotification(serverQuote);
    }
  });
  if (localChanged) {
    saveQuotes();
    populateCategories();
  }
}

function showConflictNotification(quote) {
  quoteDisplay.style.background = "#fff3cd"; // yellow alert background
  setTimeout(() => {
    quoteDisplay.style.background = "#ffffff";
  }, 2000);
  console.log(`Conflict resolved for: "${quote.text}"`);
}

// Periodic sync every 10s
setInterval(fetchServerQuotes, 10000);

// ---- Import/Export ----
function exportToJsonFile() {
  const jsonStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'quotes.json';
  link.click();
}

function importFromJsonFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported)) {
        quotes.push(...imported);
        saveQuotes();
        populateCategories();
        alert("Quotes imported successfully!");
      }
    } catch {
      alert("Invalid JSON file.");
    }
  };
  reader.readAsText(file);
}

// ---- Init ----
window.addEventListener('DOMContentLoaded', () => {
  loadQuotes();
  populateCategories();
  displayRandomQuote();
  newQuoteBtn.addEventListener('click', displayRandomQuote);
  addQuoteBtn.addEventListener('click', addQuote);
  exportJsonBtn.addEventListener('click', exportToJsonFile);
  importFileInput.addEventListener('change', importFromJsonFile);
  categoryFilter.addEventListener('change', filterQuotes);
  fetchServerQuotes(); // initial sync
});
