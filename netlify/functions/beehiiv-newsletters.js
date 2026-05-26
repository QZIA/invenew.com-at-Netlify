const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
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
    url: post.web_url || "",
    thumbnailUrl: post.thumbnail_url || "",
    content
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: jsonHeaders, body: "" };
  }

  const publicationId = process.env.BEEHIIV_PUBLICATION_ID;
  const apiKey = process.env.BEEHIIV_API_KEY;

  if (!publicationId || !apiKey) {
    return {
      statusCode: 500,
      headers: jsonHeaders,
      body: JSON.stringify({ error: "Beehiiv environment variables are missing." })
    };
  }

  const url = new URL(`https://api.beehiiv.com/v2/publications/${normalizePublicationId(publicationId)}/posts`);
  url.searchParams.set("limit", "30");
  url.searchParams.append("expand[]", "free_web_content");

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    return {
      statusCode: response.status,
      headers: jsonHeaders,
      body: JSON.stringify({ error: "Beehiiv request failed." })
    };
  }

  const payload = await response.json();
  const issues = Array.isArray(payload.data) ? payload.data.map(formatIssue) : [];

  return {
    statusCode: 200,
    headers: jsonHeaders,
    body: JSON.stringify({ issues })
  };
};
