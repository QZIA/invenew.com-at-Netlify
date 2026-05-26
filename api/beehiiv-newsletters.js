const jsonHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
  "access-control-allow-headers": "content-type"
};

function normalizePublicationId(value = "") {
  return value.startsWith("pub_") ? value : `pub_${value}`;
}

function stripHtml(value = "") {
  return String(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatIssue(post) {
  const content = post.content?.free?.web || post.content?.free?.email || "";
  let contentText = stripHtml(content);
  if (post.title && contentText.startsWith(post.title)) contentText = contentText.slice(post.title.length).trim();
  const summary = post.preview_text || post.subtitle || post.meta_default_description || contentText.slice(0, 180);
  const rawDate = post.publish_date || post.displayed_date || post.created;
  const normalizedDate = typeof rawDate === "number" ? rawDate * 1000 : rawDate;
  const date = rawDate
    ? new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(new Date(normalizedDate))
    : "Recent issue";

  return {
    id: post.id,
    title: post.title || post.subject_line || "Untitled issue",
    summary,
    date,
    sortDate: normalizedDate ? new Date(normalizedDate).getTime() : 0,
    url: post.web_url || "",
    thumbnailUrl: post.thumbnail_url || "",
    content
  };
}

module.exports = async function handler(request, response) {
  Object.entries(jsonHeaders).forEach(([key, value]) => response.setHeader(key, value));

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  if (request.method !== "GET") {
    response.status(405).json({ error: "Method not allowed." });
    return;
  }

  const publicationId = process.env.BEEHIIV_PUBLICATION_ID;
  const apiKey = process.env.BEEHIIV_API_KEY;

  if (!publicationId || !apiKey) {
    response.status(500).json({ error: "Beehiiv environment variables are missing." });
    return;
  }

  const url = new URL(`https://api.beehiiv.com/v2/publications/${normalizePublicationId(publicationId)}/posts`);
  url.searchParams.set("limit", "30");
  url.searchParams.append("expand[]", "free_web_content");

  const beehiivResponse = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json"
    }
  });

  if (!beehiivResponse.ok) {
    response.status(beehiivResponse.status).json({ error: "Beehiiv request failed." });
    return;
  }

  const payload = await beehiivResponse.json();
  const issues = Array.isArray(payload.data)
    ? payload.data.map(formatIssue).sort((a, b) => b.sortDate - a.sortDate)
    : [];

  response.status(200).json({ issues });
};
