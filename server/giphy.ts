const GIPHY_BASE = "https://api.giphy.com/v1/gifs";

export interface GifResult {
  id: string;
  title: string;
  url: string;
  previewUrl: string;
  width: number;
  height: number;
}

interface GiphyImage {
  url: string;
  width: string;
  height: string;
}

interface GiphyGif {
  id: string;
  title: string;
  images: {
    fixed_height: GiphyImage;
    preview_gif: GiphyImage;
    original: GiphyImage;
  };
}

interface GiphyResponse {
  data: GiphyGif[];
}

function getApiKey() {
  return process.env.GIPHY_API_KEY?.trim() ?? "";
}

function mapGif(gif: GiphyGif): GifResult {
  const img = gif.images.fixed_height ?? gif.images.original;
  const preview = gif.images.preview_gif ?? gif.images.fixed_height ?? gif.images.original;
  return {
    id: gif.id,
    title: gif.title || "GIF",
    url: img.url,
    previewUrl: preview.url,
    width: Number(img.width) || 200,
    height: Number(img.height) || 200,
  };
}

async function fetchGiphy(path: string, params: Record<string, string>) {
  const key = getApiKey();
  if (!key) {
    throw new Error("GIPHY_API_KEY tanımlı değil. developers.giphy.com üzerinden ücretsiz anahtar alabilirsin.");
  }

  const url = new URL(`${GIPHY_BASE}/${path}`);
  url.searchParams.set("api_key", key);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Giphy isteği başarısız (${res.status})`);
  }

  const json = (await res.json()) as GiphyResponse;
  return json.data.map(mapGif);
}

export function isGiphyConfigured() {
  return Boolean(getApiKey());
}

export async function searchGifs(query: string, limit = 24) {
  const q = query.trim();
  if (!q) return trendingGifs(limit);
  return fetchGiphy("search", {
    q,
    limit: String(Math.min(limit, 50)),
    rating: "pg-13",
    lang: "tr",
  });
}

export async function trendingGifs(limit = 24) {
  return fetchGiphy("trending", {
    limit: String(Math.min(limit, 50)),
    rating: "pg-13",
  });
}
