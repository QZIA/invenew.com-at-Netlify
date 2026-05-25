const root = document.documentElement;
const themeToggle = document.getElementById("themeToggle");
const menuToggle = document.getElementById("menuToggle");
const mobilePanel = document.getElementById("mobilePanel");
const searchToggle = document.getElementById("searchToggle");
const searchPanel = document.getElementById("searchPanel");
const siteSearch = document.getElementById("siteSearch");
const searchResults = document.getElementById("searchResults");
const clearSearch = document.getElementById("clearSearch");
const header = document.querySelector(".site-header");
const signupForm = document.getElementById("signupForm");
const formNote = document.getElementById("formNote");
const sponsorForm = document.getElementById("sponsorForm");
const sponsorNote = document.getElementById("sponsorNote");

const searchable = [
  { title: "AI Infrastructure Radar", tag: "Labs", href: "labs.html" },
  { title: "This Week in AI-Native Infrastructure", tag: "Newsletter", href: "newsletter.html" },
  { title: "Newsletter Sponsorship", tag: "Sponsors", href: "sponsors.html" },
  { title: "Operator Briefs", tag: "Intelligence", href: "intelligence.html" },
  { title: "Agentic Ops Patterns", tag: "Labs", href: "labs.html" },
  { title: "Why AI-native apps need a new operating model", tag: "Blog", href: "blog.html" }
];

function setTheme(theme) {
  root.dataset.theme = theme;
  localStorage.setItem("invenew-theme", theme);
}

const storedTheme = localStorage.getItem("invenew-theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
setTheme(storedTheme || (prefersDark ? "dark" : "light"));

themeToggle.addEventListener("click", () => {
  setTheme(root.dataset.theme === "dark" ? "light" : "dark");
});

menuToggle.addEventListener("click", () => {
  const isOpen = mobilePanel.getAttribute("aria-hidden") === "false";
  mobilePanel.setAttribute("aria-hidden", String(isOpen));
});

mobilePanel.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => mobilePanel.setAttribute("aria-hidden", "true"));
});

searchToggle.addEventListener("click", () => {
  const isOpen = searchPanel.getAttribute("aria-hidden") === "false";
  searchPanel.setAttribute("aria-hidden", String(isOpen));
  if (!isOpen) siteSearch.focus();
});

function renderResults(query = "") {
  const normalized = query.trim().toLowerCase();
  const results = normalized
    ? searchable.filter((item) => `${item.title} ${item.tag}`.toLowerCase().includes(normalized))
    : searchable.slice(0, 4);

  searchResults.innerHTML = results.length
    ? results.map((item) => `<a href="${item.href}"><strong>${item.title}</strong><span>${item.tag}</span></a>`).join("")
    : `<p>No matches yet. Try "labs", "sponsor", or "AI".</p>`;
}

siteSearch.addEventListener("input", (event) => renderResults(event.target.value));
clearSearch.addEventListener("click", () => {
  siteSearch.value = "";
  renderResults();
  siteSearch.focus();
});
renderResults();

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    searchPanel.setAttribute("aria-hidden", "true");
    mobilePanel.setAttribute("aria-hidden", "true");
  }
});

window.addEventListener("scroll", () => {
  header.dataset.elevated = String(window.scrollY > 8);
});

if (signupForm) {
  signupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(signupForm);
    const email = String(data.get("email") || "");
    formNote.textContent = email.includes("@")
      ? "You're on the list. INVENEW briefing reserved."
      : "Please enter a valid email.";
    if (email.includes("@")) signupForm.reset();
  });
}

if (sponsorForm) {
  sponsorForm.addEventListener("submit", (event) => {
    event.preventDefault();
    sponsorNote.textContent = "Inquiry captured for demo. Connect this form to your CRM or form backend in production.";
    sponsorForm.reset();
  });
}
