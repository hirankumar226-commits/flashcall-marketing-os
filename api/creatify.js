// Vercel Serverless Function — Creatify API Proxy
// Sits between the browser and api.creatify.ai to bypass CORS
// Deploy this file as /api/creatify.js in your Vercel project
//
// Routes:
//   POST /api/creatify?path=/api/lipsyncs/          → create lipsync job
//   GET  /api/creatify?path=/api/lipsyncs/{id}/     → get job status
//   GET  /api/creatify?path=/api/personas/          → list avatars

export default async function handler(req, res) {
  // Allow browser requests from any origin (CORS headers)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-API-ID, X-API-KEY");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // The Creatify API path is passed as a query param, e.g. ?path=/api/lipsyncs/
  const { path } = req.query;
  if (!path) {
    return res.status(400).json({ error: "Missing ?path= query parameter" });
  }

  // Forward the API credentials from request headers
  const apiId  = req.headers["x-api-id"];
  const apiKey = req.headers["x-api-key"];
  if (!apiId || !apiKey) {
    return res.status(401).json({ error: "Missing X-API-ID or X-API-KEY headers" });
  }

  const creatifyUrl = `https://api.creatify.ai${path}`;

  try {
    const fetchOptions = {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        "X-API-ID":  apiId,
        "X-API-KEY": apiKey,
      },
    };

    // Forward body for POST requests
    if (req.method === "POST" && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const upstream = await fetch(creatifyUrl, fetchOptions);
    const data     = await upstream.json();

    return res.status(upstream.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Proxy error: " + err.message });
  }
}
