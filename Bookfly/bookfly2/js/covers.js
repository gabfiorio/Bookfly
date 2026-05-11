/* ============================================================
   BOOKFLY — covers.js
   Capas reais via Google Books API (sem chave necessária)
   ============================================================ */

const CoverCache = {
  _store: {},
  get: (key) => CoverCache._store[key] || null,
  set: (key, url) => { CoverCache._store[key] = url; },
};

/**
 * Busca a URL da capa na Google Books API.
 * Retorna null se não encontrar.
 */
async function fetchCoverUrl(titulo, autor) {
  const key = `${titulo}__${autor}`.toLowerCase();
  if (CoverCache.get(key)) return CoverCache.get(key);

  try {
    const q   = encodeURIComponent(`intitle:${titulo} inauthor:${autor}`);
    const url = `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1&fields=items(volumeInfo/imageLinks)`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data  = await res.json();
    const links = data?.items?.[0]?.volumeInfo?.imageLinks;
    // Prefere thumbnail maior; força HTTPS e remove borda/zoom do Google
    const raw   = links?.thumbnail || links?.smallThumbnail || null;
    const cover = raw ? raw.replace('http://', 'https://').replace('&edge=curl', '') + '&fife=w300' : null;
    if (cover) CoverCache.set(key, cover);
    return cover;
  } catch {
    return null;
  }
}

/**
 * Renderiza o HTML de uma capa.
 * Se tiver URL → <img>, senão → emoji fallback.
 */
function coverHtml(coverUrl, emoji, { width = 60, height = 86, radius = 5, fontSize = 28 } = {}) {
  if (coverUrl) {
    return `<img src="${coverUrl}" alt="capa"
              style="width:${width}px;height:${height}px;object-fit:cover;
                     border-radius:${radius}px;box-shadow:3px 3px 10px rgba(0,0,0,0.18);display:block"/>`;
  }
  return `<span style="font-size:${fontSize}px;line-height:1">${emoji}</span>`;
}

/**
 * Aplica a capa a um elemento já no DOM.
 * @param {string|HTMLElement} elOrSelector  — elemento ou seletor CSS
 * @param {string} titulo
 * @param {string} autor
 * @param {string} emoji                     — fallback
 * @param {object} opts                      — passado para coverHtml
 */
async function applyCover(elOrSelector, titulo, autor, emoji, opts = {}) {
  const el = typeof elOrSelector === 'string'
    ? document.querySelector(elOrSelector)
    : elOrSelector;
  if (!el) return;

  // Mostra emoji enquanto carrega
  el.innerHTML = coverHtml(null, emoji, opts);

  const url = await fetchCoverUrl(titulo, autor);
  if (url) {
    el.innerHTML = coverHtml(url, emoji, opts);
  }
}

/**
 * Aplica capas a múltiplos elementos de uma vez (para listas/grids).
 * @param {Array<{el, titulo, autor, emoji, opts}>} items
 */
async function applyCovers(items) {
  await Promise.allSettled(
    items.map(({ el, titulo, autor, emoji, opts }) =>
      applyCover(el, titulo, autor, emoji, opts)
    )
  );
}
