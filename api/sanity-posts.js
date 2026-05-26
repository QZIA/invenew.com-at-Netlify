const jsonHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
  "access-control-allow-headers": "content-type"
};

const sanityConfig = {
  projectId: process.env.SANITY_PROJECT_ID || "kjneu2g3",
  dataset: process.env.SANITY_DATASET || "production",
  apiVersion: process.env.SANITY_API_VERSION || "2026-05-25"
};

const postFields = `{
  title,
  "slug": slug.current,
  publishedAt,
  body,
  "category": categories[0]->title,
  "imageRef": mainImage.asset._ref
}`;

function getQuery(slug) {
  if (slug) {
    return `*[_type == "post" && slug.current == $slug][0]${postFields}`;
  }

  return `*[_type == "post"] | order(coalesce(publishedAt, _createdAt) desc)[0...12]${postFields}`;
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

  const slug = typeof request.query?.slug === "string" ? request.query.slug.trim() : "";
  const endpoint = new URL(`https://${sanityConfig.projectId}.api.sanity.io/v${sanityConfig.apiVersion}/data/query/${sanityConfig.dataset}`);
  endpoint.searchParams.set("query", getQuery(slug));
  if (slug) endpoint.searchParams.set("$slug", JSON.stringify(slug));

  const sanityResponse = await fetch(endpoint, { headers: { Accept: "application/json" } });

  if (!sanityResponse.ok) {
    response.status(sanityResponse.status).json({ error: "Sanity request failed." });
    return;
  }

  const payload = await sanityResponse.json();
  response.status(200).json({ result: payload.result || (slug ? null : []) });
};
