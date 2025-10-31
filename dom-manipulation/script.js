// Initialize quotes array
let quotes = [];

// Load quotes from localStorage on initialization
function loadQuotes() {
  const storedQuotes = localStorage.getItem("quotes");
  if (storedQuotes) {
    quotes = JSON.parse(storedQuotes);
  }
}

// Save quotes to localStorage
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// Display a random quote
function displayRandomQuote() {
  if (quotes.length === 0) {
    document.getElementById("quoteDisplay").textContent = "No quotes available.";
    return;
  }
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const randomQuote = quotes[randomIndex];
  document.getElementById("quoteDisplay").textContent = `"${randomQuote.text}" - ${randomQuote.author}`;

  // Save the last viewed quote to sessionStorage
  sessionStorage.setItem("lastViewedQuote", JSON.stringify(randomQuote));
}

// Add a new quote
function addQuote() {
  const text = document.getElementById("quoteInput").value.trim();
  const author = document.getElementById("authorInput").value.trim();
  
  if (text && author) {
    quotes.push({ text, author });
    saveQuotes();
    document.getElementById("quoteInput").value = "";
    document.getElementById("authorInput").value = "";
    alert("Quote added successfully!");
  } else {
    alert("Please enter both a quote and an author.");
  }
}

// Export quotes to a JSON file
function exportToJsonFile() {
  const jsonData = JSON.stringify(quotes, null, 2);
  const blob = new Blob([jsonData], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Import quotes from a JSON file
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    const importedQuotes = JSON.parse(e.target.result);
    quotes.push(...importedQuotes);
    saveQuotes();
    alert("Quotes imported successfully!");
  };
  fileReader.readAsText(event.target.files[0]);
}

// Initialize app
window.onload = function() {
  loadQuotes();

  // If there’s a last viewed quote, show it
  const lastViewed = sessionStorage.getItem("lastViewedQuote");
  if (lastViewed) {
    const quote = JSON.parse(lastViewed);
    document.getElementById("quoteDisplay").textContent = `"${quote.text}" - ${quote.author}`;
  }
};
