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
  root.style.backgroundColor = theme === "dark" ? "#0d0f12" : "#fbfaf8";
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
  sponsorForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(sponsorForm);
    const encoded = new URLSearchParams(formData).toString();

    try {
      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encoded
      });

      if (!response.ok) throw new Error("Submission failed");
      sponsorNote.textContent = "Thanks. We received your inquiry and will follow up soon.";
      sponsorForm.reset();
    } catch (error) {
      sponsorNote.textContent = "Something went wrong. Please try again in a moment.";
    }
  });
}

// Sanity blog integration
const sanityConfig = {
  projectId: "kjneu2g3",
  dataset: "production",
  apiVersion: "2026-05-25"
};

const sanityPosts = document.getElementById("sanityPosts");
const blogCategoryFilter = document.getElementById("blogCategoryFilter");
let sanityBlogPostsCache = [];

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sanityImageUrl(ref, width = 900) {
  if (!ref) return "";
  const match = ref.match(/^image-([a-f0-9]+)-(\d+)x(\d+)-(\w+)$/);
  if (!match) return "";
  const [, id, sourceWidth, sourceHeight, format] = match;
  const height = Math.round((Number(sourceHeight) / Number(sourceWidth)) * width);
  return `https://cdn.sanity.io/images/${sanityConfig.projectId}/${sanityConfig.dataset}/${id}-${sourceWidth}x${sourceHeight}.${format}?w=${width}&h=${height}&fit=crop&auto=format`;
}

function plainTextFromBlocks(blocks = []) {
  return blocks
    .filter((block) => block && block._type === "block")
    .map((block) => (block.children || []).map((child) => child.text || "").join(""))
    .join(" ")
    .trim();
}

function formatPostDate(value) {
  if (!value) return "Recently published";
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(value));
}

function fallbackPostVisual(index = 0) {
  const variants = ["brain", "signal", "systems"];
  const variant = variants[index % variants.length];
  return `<div class="post-art post-art-${variant}" aria-hidden="true">
    <span class="orb-one"></span><span class="orb-two"></span><span class="line-one"></span><span class="line-two"></span><span class="chip"></span>
  </div>`;
}



function renderBlogCategoryFilter(posts = []) {
  if (!blogCategoryFilter) return;
  const categories = [...new Set(posts.map((post) => post.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  blogCategoryFilter.innerHTML = [
    `<button type="button" class="active" data-category="all">All</button>`,
    ...categories.map((category) => `<button type="button" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`)
  ].join("");

  blogCategoryFilter.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      blogCategoryFilter.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      renderSanityPostList(button.dataset.category || "all");
    });
  });
}

function renderSanityPostList(category = "all") {
  if (!sanityPosts) return;
  const posts = category === "all"
    ? sanityBlogPostsCache
    : sanityBlogPostsCache.filter((post) => post.category === category);

  if (!posts.length) {
    sanityPosts.innerHTML = `<article class="post-card"><p class="post-meta">No posts yet</p><h2>No articles in this category yet.</h2><p>Publish a post in this category in Sanity and it will appear here.</p></article>`;
    return;
  }

  const [featuredPost, ...remainingPosts] = posts;
  const renderCard = (post, index) => {
    const excerptLimit = 135;
    const excerpt = plainTextFromBlocks(post.body || []).slice(0, excerptLimit) || "Published from INVENEW Blog in Sanity.";
    const image = sanityImageUrl(post.imageRef, 760);
    const categoryName = (post.category || "INVENEW").toUpperCase();
    return `<article class="post-card">
      ${image ? `<img class="post-image" src="${image}" alt="">` : fallbackPostVisual(index + 1)}
      <div class="post-card-content">
        <p class="post-kicker">${escapeHtml(categoryName)}</p>
        <h2>${escapeHtml(post.title || "Untitled article")}</h2>
        <span class="post-rule"></span>
        <p class="post-excerpt">${escapeHtml(excerpt)}${excerpt.length >= excerptLimit ? "..." : ""}</p>
        <div class="post-byline"><span>By INVENEW</span><i></i><span>${escapeHtml(formatPostDate(post.publishedAt))}</span></div>
        <a class="post-link" href="blog.html?slug=${encodeURIComponent(post.slug || "")}" aria-label="Read ${escapeHtml(post.title || "article")}"></a>
      </div>
    </article>`;
  };

  const featuredExcerptLimit = 285;
  const featuredExcerpt = plainTextFromBlocks(featuredPost.body || []).slice(0, featuredExcerptLimit) || "Published from INVENEW Blog in Sanity.";
  const featuredImage = sanityImageUrl(featuredPost.imageRef, 1300);
  const featuredCategory = (featuredPost.category || "INVENEW").toUpperCase();
  const remainingGrid = remainingPosts.length
    ? `<div class="blog-grid-head"><h2>More articles</h2><p>Published from INVENEW Blog in Sanity.</p></div><div class="blog-grid">${remainingPosts.map((post, index) => renderCard(post, index)).join("")}</div>`
    : `<div class="blog-grid-head"><h2>More articles</h2><p>Publish more posts in Sanity and they will appear here.</p></div>`;

  sanityPosts.innerHTML = `<article class="featured-article-card">
    <div class="featured-article-copy">
      <p class="post-kicker">${escapeHtml(featuredCategory)}</p>
      <h2>${escapeHtml(featuredPost.title || "Untitled article")}</h2>
      <p>${escapeHtml(featuredExcerpt)}${featuredExcerpt.length >= featuredExcerptLimit ? "..." : ""}</p>
      <div class="post-byline"><span>By INVENEW</span><i></i><span>${escapeHtml(formatPostDate(featuredPost.publishedAt))}</span></div>
    </div>
    ${featuredImage ? `<img class="featured-article-image" src="${featuredImage}" alt="">` : fallbackPostVisual(0)}
    <a class="post-link" href="blog.html?slug=${encodeURIComponent(featuredPost.slug || "")}" aria-label="Read ${escapeHtml(featuredPost.title || "article")}"></a>
  </article>${remainingGrid}`;
}

function renderPortableText(blocks = []) {
  if (!blocks.length) return "<p>This article is published in Sanity, but no body content was provided yet.</p>";

  return blocks.map((block) => {
    if (block._type === "image") {
      const src = sanityImageUrl(block.asset?._ref, 1200);
      return src ? `<img class="article-image" src="${src}" alt="">` : "";
    }

    if (block._type !== "block") return "";

    const children = (block.children || []).map((child) => {
      let text = escapeHtml(child.text || "");
      const marks = child.marks || [];
      if (marks.includes("strong")) text = `<strong>${text}</strong>`;
      if (marks.includes("em")) text = `<em>${text}</em>`;
      return text;
    }).join("");

    if (block.listItem === "bullet") return `<li>${children}</li>`;
    if (block.style === "h2") return `<h2>${children}</h2>`;
    if (block.style === "h3") return `<h3>${children}</h3>`;
    if (block.style === "blockquote") return `<blockquote>${children}</blockquote>`;
    return `<p>${children}</p>`;
  }).join("");
}

let articleSpeech = null;

function initArticleVoice(text = "") {
  const button = document.getElementById("articleVoiceButton");
  if (!button) return;

  if (!("speechSynthesis" in window) || !text.trim()) {
    button.disabled = true;
    button.textContent = "Audio unavailable";
    return;
  }

  const resetButton = () => {
    button.dataset.state = "idle";
    button.textContent = "Listen to article";
  };

  button.addEventListener("click", () => {
    if (button.dataset.state === "playing") {
      window.speechSynthesis.cancel();
      resetButton();
      return;
    }

    window.speechSynthesis.cancel();
    articleSpeech = new SpeechSynthesisUtterance(text);
    articleSpeech.rate = 0.96;
    articleSpeech.pitch = 1;
    articleSpeech.onend = resetButton;
    articleSpeech.onerror = resetButton;
    button.dataset.state = "playing";
    button.textContent = "Stop audio";
    window.speechSynthesis.speak(articleSpeech);
  });
}

window.addEventListener("beforeunload", () => {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
});

async function sanityFetch(query) {
  const endpoint = `https://${sanityConfig.projectId}.api.sanity.io/v${sanityConfig.apiVersion}/data/query/${sanityConfig.dataset}?query=${encodeURIComponent(query)}`;
  const response = await fetch(endpoint);
  if (!response.ok) throw new Error("Sanity request failed");
  const data = await response.json();
  return data.result || [];
}

async function loadSanityBlog() {
  if (!sanityPosts) return;
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  try {
    if (slug) {
      const query = `*[_type == "post" && slug.current == "${slug}"][0]{
        title,
        publishedAt,
        body,
        "category": categories[0]->title,
        "imageRef": mainImage.asset._ref
      }`;
      const post = await sanityFetch(query);

      if (!post || !post.title) {
        sanityPosts.innerHTML = `<article class="post-card"><p class="post-meta">Not found</p><h2>Article not found.</h2><p>The post may have moved or is not published yet.</p><a class="btn btn-secondary" href="blog.html">Back to Blog</a></article>`;
        return;
      }

      document.title = `${post.title} | INVENEW`;
      const image = sanityImageUrl(post.imageRef, 1200);
      sanityPosts.classList.add("article-featured");
      sanityPosts.innerHTML = `<article class="article-page-card">
        <a class="back-link" href="blog.html">Back to Blog</a>
        ${image ? `<img class="article-hero-image" src="${image}" alt="">` : ""}
        <p class="post-meta">${escapeHtml(formatPostDate(post.publishedAt))} • ${escapeHtml(post.category || "INVENEW")}</p>
        <h1>${escapeHtml(post.title)}</h1>
        <div class="article-tools"><button class="article-voice-btn" id="articleVoiceButton" type="button" data-state="idle" aria-label="Listen to article">Listen to article</button></div>
        <div class="article-body">${renderPortableText(post.body || [])}</div>
      </article>`;
      initArticleVoice([post.title, plainTextFromBlocks(post.body || [])].filter(Boolean).join(". "));
      return;
    }

    const query = `*[_type == "post"] | order(coalesce(publishedAt, _createdAt) desc)[0...12]{
      title,
      "slug": slug.current,
      publishedAt,
      body,
      "category": categories[0]->title,
      "imageRef": mainImage.asset._ref
    }`;
    const posts = await sanityFetch(query);

    if (!posts.length) {
      sanityPosts.innerHTML = `<article class="post-card"><p class="post-meta">No posts yet</p><h2>Published posts will appear here.</h2><p>Create and publish posts in Sanity Studio to populate this section.</p></article>`;
      return;
    }

    sanityBlogPostsCache = posts;
    renderBlogCategoryFilter(posts);
    renderSanityPostList("all");
  } catch (error) {
    sanityPosts.innerHTML = `<article class="post-card"><p class="post-meta">Connection issue</p><h2>Could not load posts from Sanity.</h2><p>Check the Sanity dataset, CORS origin, and published post status.</p></article>`;
  }
}

const newsletterIssueList = document.getElementById("newsletterIssueList");
const newsletterIssueDetail = document.getElementById("newsletterIssueDetail");
let newsletterIssuesCache = [];

function newsletterEndpoint() {
  if (window.location.hostname === "localhost" && window.location.port === "8765") {
    return "http://localhost:8788/beehiiv-newsletters";
  }
  return "/.netlify/functions/beehiiv-newsletters";
}

function sanitizeIssueHtml(html = "") {
  const template = document.createElement("template");
  template.innerHTML = html;
  template.content.querySelectorAll("script, iframe, form, input, button, style").forEach((node) => node.remove());
  template.content.querySelectorAll("*").forEach((node) => {
    [...node.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value || "";
      if (name.startsWith("on") || value.toLowerCase().includes("javascript:")) node.removeAttribute(attribute.name);
    });
  });
  return template.innerHTML;
}

function renderNewsletterIssueDetail(issue) {
  if (!newsletterIssueDetail || !issue) return;
  const content = issue.content ? sanitizeIssueHtml(issue.content) : "<p>" + escapeHtml(issue.summary || "Open the full issue on Beehiiv to read this letter.") + "</p>";
  newsletterIssueDetail.innerHTML =
    '<p class="post-kicker">' + escapeHtml(issue.date || "Recent issue") + '</p>' +
    '<h3>' + escapeHtml(issue.title || "Untitled issue") + '</h3>' +
    '<p>' + escapeHtml(issue.summary || "A recent INVENEW Intelligence letter.") + '</p>' +
    '<div class="newsletter-issue-actions">' + (issue.url ? '<a class="btn btn-secondary" href="' + escapeHtml(issue.url) + '" target="_blank" rel="noopener">Read on Beehiiv</a>' : "") + '</div>' +
    '<div class="newsletter-issue-content">' + content + '</div>';
}

const newsletterIssuesPerPage = 10;
let newsletterIssuesPage = 0;

function newsletterIssueThumbnail(issue, index) {
  if (issue.thumbnailUrl) {
    return '<img class="newsletter-issue-thumb" src="' + escapeHtml(issue.thumbnailUrl) + '" alt="">';
  }
  const labels = ["AI", "OPS", "DATA", "LABS"];
  return '<div class="newsletter-issue-thumb newsletter-issue-thumb-fallback" aria-hidden="true"><span>' + labels[index % labels.length] + '</span></div>';
}

function renderNewsletterPagination(totalPages) {
  if (totalPages <= 1) return "";
  return '<div class="newsletter-pagination" aria-label="Newsletter issue pagination">' +
    '<button type="button" data-page-action="previous" ' + (newsletterIssuesPage === 0 ? "disabled" : "") + '>Previous</button>' +
    '<span>Page ' + (newsletterIssuesPage + 1) + ' of ' + totalPages + '</span>' +
    '<button type="button" data-page-action="next" ' + (newsletterIssuesPage >= totalPages - 1 ? "disabled" : "") + '>Next</button>' +
  '</div>';
}

function renderNewsletterIssues(issues = [], page = newsletterIssuesPage) {
  if (!newsletterIssueList || !newsletterIssueDetail) return;
  if (!issues.length) {
    newsletterIssueList.innerHTML = '<article class="newsletter-issue-card"><p class="post-kicker">No issues</p><h3>No newsletter issues found.</h3><p>Publish an issue in Beehiiv and it will appear here.</p></article>';
    newsletterIssueDetail.innerHTML = '<p class="post-kicker">No issues</p><h3>Nothing to preview yet.</h3><p>Recent newsletter letters will appear here after Beehiiv returns published issues.</p>';
    return;
  }

  const totalPages = Math.ceil(issues.length / newsletterIssuesPerPage);
  newsletterIssuesPage = Math.min(Math.max(page, 0), totalPages - 1);
  const start = newsletterIssuesPage * newsletterIssuesPerPage;
  const visibleIssues = issues.slice(start, start + newsletterIssuesPerPage);

  newsletterIssueList.innerHTML = visibleIssues.map((issue, index) => {
    const issueIndex = start + index;
    return '<button class="newsletter-issue-card ' + (index === 0 ? "is-active" : "") + '" type="button" data-issue-index="' + issueIndex + '">' +
      newsletterIssueThumbnail(issue, issueIndex) +
      '<span class="newsletter-issue-card-copy">' +
        '<span class="newsletter-issue-card-title">' + escapeHtml(issue.title || "Untitled issue") + '</span>' +
        '<span class="post-kicker">' + escapeHtml(issue.date || "Recent issue") + '</span>' +
      '</span>' +
    '</button>';
  }).join("") + renderNewsletterPagination(totalPages);

  newsletterIssueList.querySelectorAll(".newsletter-issue-card").forEach((button) => {
    button.addEventListener("click", () => {
      newsletterIssueList.querySelectorAll(".newsletter-issue-card").forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      renderNewsletterIssueDetail(newsletterIssuesCache[Number(button.dataset.issueIndex)]);
    });
  });

  newsletterIssueList.querySelectorAll("[data-page-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const direction = button.dataset.pageAction === "next" ? 1 : -1;
      renderNewsletterIssues(newsletterIssuesCache, newsletterIssuesPage + direction);
    });
  });

  renderNewsletterIssueDetail(visibleIssues[0]);
}


async function loadNewsletterIssues() {
  if (!newsletterIssueList || !newsletterIssueDetail) return;

  try {
    const response = await fetch(newsletterEndpoint());
    if (!response.ok) throw new Error("Beehiiv request failed");
    const data = await response.json();
    newsletterIssuesCache = Array.isArray(data.issues) ? data.issues : [];
    renderNewsletterIssues(newsletterIssuesCache);
  } catch (error) {
    newsletterIssueList.innerHTML = '<article class="newsletter-issue-card"><p class="post-kicker">Local setup needed</p><h3>Could not load Beehiiv issues.</h3><p>Run the local Beehiiv proxy or deploy the Netlify function to display recent letters.</p></article>';
    newsletterIssueDetail.innerHTML = '<p class="post-kicker">Connection issue</p><h3>Recent letters are not available in this local view.</h3><p>The page is ready, but the Beehiiv API must be served through a private backend endpoint so the API key is not exposed.</p>';
  }
}


loadSanityBlog();
loadNewsletterIssues();
