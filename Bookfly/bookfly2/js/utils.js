/* ============================================================
   BOOKFLY — utils.js
   Utilitários compartilhados entre todas as páginas
   ============================================================ */

const API_BASE =
  window.BOOKFLY_API_BASE ||
  'https://bookfly-wp02.onrender.com';

const API_ENDPOINTS =
  window.BOOKFLY_API_ENDPOINTS || {
    onboarding: '/api/exemplo',
    login: '/auth/login',
    cadastro: '/usuarios',
    livros: '/livros',

  };

/* ============================================================
   AUTH
   ============================================================ */

const Auth = {
  getToken: () => localStorage.getItem('bf_token'),

  setToken: (t) => localStorage.setItem('bf_token', t),

  getUser: () => {
    const token = Auth.getToken();
    if (!token) {
      return null;
    }

    try {
      const [, payload] = token.split('.');
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + ((4 - base64.length % 4) % 4), '=');
      const json = JSON.parse(decodeURIComponent(escape(atob(padded))));
      const username = json.unique_name || json.name || json.username || '';

      return {
        id: Number(json.sub || json.nameid || json['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']) || null,
        email: json.email || '',
        username,
        nome: username || json.email || 'Leitor',
      };
    } catch {
      return null;
    }
  },

  setUser: () => {},

  clear: () => {
    localStorage.removeItem('bf_token');
    localStorage.removeItem('bf_user');
  },

  isLogged: () => !!localStorage.getItem('bf_token'),

  isOnboarded: () => {
    const user = Auth.getUser();

    const key = user?.email
      ? `bf_onboarded:${String(user.email).toLowerCase()}`
      : 'bf_onboarded';

    return (
      localStorage.getItem(key) === '1' ||
      localStorage.getItem('bf_onboarded') === '1'
    );
  },

  setOnboarded: (value = true) => {
    const user = Auth.getUser();

    const key = user?.email
      ? `bf_onboarded:${String(user.email).toLowerCase()}`
      : 'bf_onboarded';

    if (value) {
      localStorage.setItem(key, '1');
    } else {
      localStorage.removeItem(key);
    }
  },

  getLandingPage: () =>
    Auth.isOnboarded()
      ? 'home.html'
      : 'formulario.html',
};

function requireAuth() {
  if (!Auth.isLogged()) {
    window.location.href = 'login.html';
  }
}

/* ============================================================
   API FETCH
   ============================================================ */

async function apiFetch(path, options = {}) {

  const token = Auth.getToken();

  const url = `${API_BASE}${path}`;

  try {

    const response = await fetch(url, {
      ...options,

      headers: {
        'Content-Type': 'application/json',

        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),

        ...(options.headers || {}),
      },
    });

    console.log('API Request:', {
      url,
      options,
      status: response.status,
    });

    if (response.status === 401) {
      Auth.clear();
      window.location.href = 'login.html';
      return null;
    }

    return response;

  } catch (err) {

    console.error('Erro na API:', err);

    throw new Error(
      'Não foi possível conectar ao servidor.'
    );
  }
}

function firstDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return null;
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function extractArrayPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  const knownKeys = [
    'data',
    'items',
    'results',
    'livros',
    'books',
    'content',
  ];

  for (const key of knownKeys) {
    if (Array.isArray(payload[key])) {
      return payload[key];
    }
  }

  return [];
}

function normalizeBookFromApi(raw, index = 0) {

  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const id =
    toNumber(firstDefined(raw.id, raw._id, raw.livroId))
    || index + 1;

  return {

    id,

    googleBooksId:
      firstDefined(raw.googleBooksId, ''),

    titulo:
      String(firstDefined(
        raw.titulo,
        'Livro sem título'
      )),

    autor:
      String(firstDefined(
        raw.autor,
        'Autor desconhecido'
      )),

    sinopse:
      String(firstDefined(
        raw.sinopse,
        raw.descricao,
        raw.description,
        ''
      )),

    paginas:
      toNumber(firstDefined(
        raw.totalPaginas,
        raw.paginas,
        raw.pages
      )) || 0,

    ano:
      raw.dataLancamento
        ? new Date(raw.dataLancamento).getFullYear()
        : '',

    dataLancamento:
      raw.dataLancamento || null,

    urlImagem:
      firstDefined(raw.urlImagem, raw.url_imagem, raw.imagem, raw.coverUrl, ''),

    genero:
      firstDefined(raw.categoria?.nome, raw.genero, raw.genre, 'Geral'),

    categoria:
      raw.categoria || null,

    situacao:
      raw.situacao ?? true,

    editora:
      String(firstDefined(raw.editora, raw.publisher, '')),

    isbn:
      String(firstDefined(raw.isbn, raw.codigoIsbn, '')),

    mediaGlobal:
      toNumber(firstDefined(raw.mediaGlobal, raw.media, raw.averageRating)) || 0,

    totalAvaliacoes:
      toNumber(firstDefined(raw.totalAvaliacoes, raw.ratingCount, raw.reviewCount)) || 0,

    emoji:
      firstDefined(raw.emoji, '📚'),

    nota:
      toNumber(firstDefined(raw.nota, raw.rating, raw.mediaGlobal, raw.media, raw.averageRating)) || 0,
  };
}

async function fetchBookById(bookId) {
  const id = toNumber(bookId);
  if (!id) return null;

  try {
    const catalog = await fetchBooksCatalog();
    const fromCatalog = catalog.find((book) => book.id === id);
    if (fromCatalog) return fromCatalog;
  } catch (err) {
    console.warn('Não foi possível carregar o catálogo completo.', err);
  }

  try {
    const endpoint = API_ENDPOINTS.livros || '/livros';
    const response = await apiFetch(`${endpoint}/${id}`);
    if (!response || !response.ok) return null;

    const payload = await response.json();
    const raw = payload?.data || payload?.item || payload;
    return normalizeBookFromApi(raw, 0);
  } catch (err) {
    console.warn('Não foi possível carregar o livro individual.', err);
    return null;
  }
}

async function fetchBooksCatalog() {
  const endpoint = API_ENDPOINTS.livros || '/livros';
  const response = await apiFetch(endpoint);

  if (!response || !response.ok) {
    throw new Error('Falha ao carregar livros da API.');
  }

  const payload = await response.json();
  const list = extractArrayPayload(payload);

  return list
    .map((item, idx) => normalizeBookFromApi(item, idx))
    .filter(Boolean);
}

/* ============================================================
   HELPERS
   ============================================================ */

function debounce(fn, delay = 300) {

  let timer;

  return (...args) => {
    clearTimeout(timer);

    timer = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(
    'pt-BR',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  );
}

function truncate(str, n) {
  return str.length > n
    ? str.slice(0, n) + '…'
    : str;
}

function renderExpandableText(text, id, limit = 320) {
  const clean = stripHtml(text || '');
  const safeId = String(id).replace(/[^a-zA-Z0-9_-]/g, '-');

  if (clean.length <= limit) {
    return `<span>${escapeHtml(clean)}</span>`;
  }

  return `
    <span id="${safeId}-short">${escapeHtml(clean.slice(0, limit).trim())}…</span>
    <span id="${safeId}-full" style="display:none">${escapeHtml(clean)}</span>
    <button
      type="button"
      class="bf-text-more"
      id="${safeId}-btn"
      onclick="toggleExpandableText('${safeId}', event)"
    >Ver mais</button>`;
}

function toggleExpandableText(id, event) {
  event?.preventDefault?.();
  event?.stopPropagation?.();

  const shortEl = document.getElementById(`${id}-short`);
  const fullEl = document.getElementById(`${id}-full`);
  const btn = document.getElementById(`${id}-btn`);
  if (!shortEl || !fullEl || !btn) return;

  const expanded = fullEl.style.display !== 'none';
  shortEl.style.display = expanded ? '' : 'none';
  fullEl.style.display = expanded ? 'none' : '';
  btn.textContent = expanded ? 'Ver mais' : 'Ver menos';
}

function initials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripHtml(html) {
  if (html === undefined || html === null) return '';
  try {
    const tmp = document.createElement('div');
    tmp.innerHTML = String(html);
    return tmp.textContent || tmp.innerText || '';
  } catch (e) {
    return String(html).replace(/<[^>]*>/g, '');
  }
}

function renderStars(n) {
  return (
    '★'.repeat(n) +
    '☆'.repeat(5 - n)
  );
}

/* ============================================================
   TOAST
   ============================================================ */

function showToast(msg, type = 'success') {

  document.getElementById('bf-toast')?.remove();

  const toast = document.createElement('div');

  toast.id = 'bf-toast';
  toast.textContent = msg;

  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '28px',
    left: '50%',
    transform:
      'translateX(-50%) translateY(20px)',

    background:
      type === 'success'
        ? 'var(--purple-dark)'
        : '#c0392b',

    color: '#fff',
    padding: '12px 24px',
    borderRadius: '999px',
    fontSize: '14px',
    fontWeight: '500',
    fontFamily: 'var(--font-body)',
    boxShadow:
      '0 8px 24px rgba(0,0,0,0.2)',

    zIndex: '9999',
    opacity: '0',

    transition: 'all 0.3s ease',
    whiteSpace: 'nowrap',
  });

  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';

    toast.style.transform =
      'translateX(-50%) translateY(0)';
  });

  setTimeout(() => {

    toast.style.opacity = '0';

    toast.style.transform =
      'translateX(-50%) translateY(10px)';

    setTimeout(() => {
      toast.remove();
    }, 300);

  }, 3000);
}

/* ============================================================
   MODAL SYSTEM
   ============================================================ */

function openModal({
  title,
  body,
  buttons = [],
  size = 'md',
  onClose,
} = {}) {

  document
    .getElementById('bf-modal-overlay')
    ?.remove();

  const overlay =
    document.createElement('div');

  overlay.id = 'bf-modal-overlay';

  overlay.innerHTML = `
    <div class="bf-modal bf-modal-${size}">
      <div class="bf-modal-header">
        <h3 class="bf-modal-title">
          ${title || ''}
        </h3>

        <button
          class="bf-modal-close"
          id="bf-modal-close-btn"
          aria-label="Fechar"
        >
          ×
        </button>
      </div>

      <div class="bf-modal-body">
        ${body || ''}
      </div>

      ${
        buttons.length
          ? `
        <div class="bf-modal-footer">
          ${buttons
            .map(
              (b, i) => `
            <button
              class="bf-btn bf-btn-${b.type || 'ghost'}"
              data-btn-idx="${i}"
            >
              ${b.label}
            </button>
          `
            )
            .join('')}
        </div>
      `
          : ''
      }
    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => {

    overlay.classList.add(
      'bf-modal-leaving'
    );

    setTimeout(() => {
      overlay.remove();
      onClose?.();
    }, 220);
  };

  requestAnimationFrame(() => {
    overlay.classList.add(
      'bf-modal-visible'
    );
  });

  overlay.addEventListener(
    'click',
    (e) => {
      if (e.target === overlay) {
        close();
      }
    }
  );

  document
    .getElementById(
      'bf-modal-close-btn'
    )
    ?.addEventListener('click', close);

  const escH = (e) => {
    if (e.key === 'Escape') {
      close();
      document.removeEventListener(
        'keydown',
        escH
      );
    }
  };

  document.addEventListener(
    'keydown',
    escH
  );

  buttons.forEach((btn, i) => {

    overlay
      .querySelector(
        `[data-btn-idx="${i}"]`
      )
      ?.addEventListener(
        'click',
        () => {

          const result =
            btn.onClick?.(close);

          if (
            btn.closeOnClick !== false &&
            result !== false
          ) {
            close();
          }
        }
      );
  });

  return {
    el: overlay,
    close,
  };
}

/* ============================================================
   LIBRARY DATA (client-side storage + normalization)
   Normaliza formas antigas/locais e expõe API usada pela UI
   ============================================================ */

const LibraryData = (function () {
  const SHELVES_KEY = 'bf_shelves_v1';
  const FOLDERS_KEY = 'bf_folders_v1';
  const COMMENTS_KEY = 'bf_comments_v1';

  function _load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function _save(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.warn('LibraryData: failed saving', key, e);
    }
  }

  function _genId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  }

  function _normalizeLocalBook(raw) {
    if (!raw || typeof raw !== 'object') return null;

    const id = toNumber(firstDefined(raw.id, raw.bookId, raw.livroId)) || toNumber(raw.id) || null;

    return {
      id: id || Date.now(),
      titulo: String(firstDefined(raw.titulo, raw.title, raw.nome, 'Livro sem título')),
      autor: String(firstDefined(raw.autor, raw.author, 'Autor desconhecido')),
      emoji: firstDefined(raw.emoji, raw.emojiChar, '📚'),
      genero: firstDefined(raw.genero, raw.genre, 'Geral'),
      paginas: toNumber(firstDefined(raw.paginas, raw.pages, raw.totalPaginas, raw.total)) || null,
      ano: firstDefined(raw.ano, raw.year) || (raw.dataLancamento ? new Date(raw.dataLancamento).getFullYear() : '') || '',
      editora: String(firstDefined(raw.editora, raw.publisher, '')),
      isbn: String(firstDefined(raw.isbn, raw.codigoIsbn, '')),
      mediaGlobal: toNumber(firstDefined(raw.mediaGlobal, raw.media, raw.averageRating)) || 0,
      totalAvaliacoes: toNumber(firstDefined(raw.totalAvaliacoes, raw.ratingCount, raw.reviewCount)) || 0,
      nota: toNumber(firstDefined(raw.nota, raw.rating)) || 0,
      urlImagem: firstDefined(raw.urlImagem, raw.url_imagem, raw.imagem, raw.coverUrl, '') || '',
      sinopse: firstDefined(raw.sinopse, raw.description, raw.descricao, '') || '',
      // keep any extra fields for future migrations
      _raw: raw,
    };
  }

  function getShelves() {
    const raw = _load(SHELVES_KEY, null);
    if (!raw) {
      const empty = { lidos: [], lendo: [], quererlev: [] };
      _save(SHELVES_KEY, empty);
      return empty;
    }

    return {
      lidos: (raw.lidos || []).map(_normalizeLocalBook),
      lendo: (raw.lendo || []).map(_normalizeLocalBook),
      quererlev: (raw.quererlev || []).map(_normalizeLocalBook),
    };
  }

  function setShelves(shelves) {
    const safe = {
      lidos: (shelves.lidos || []).map(_normalizeLocalBook),
      lendo: (shelves.lendo || []).map(_normalizeLocalBook),
      quererlev: (shelves.quererlev || []).map(_normalizeLocalBook),
    };
    _save(SHELVES_KEY, safe);
  }

  function listUniqueBooks(shelves) {
    const map = new Map();
    ['lidos', 'lendo', 'quererlev'].forEach((k) => {
      (shelves[k] || []).forEach((b) => {
        const nb = _normalizeLocalBook(b);
        if (!nb) return;
        if (!map.has(nb.id)) map.set(nb.id, nb);
      });
    });
    return Array.from(map.values());
  }

  /* Folders (pasta) */
  function getFolders() {
    return _load(FOLDERS_KEY, []);
  }

  function createFolder(name, type = 'genero') {
    const all = getFolders();
    const id = _genId();
    all.push({ id, name, type, bookIds: [] });
    _save(FOLDERS_KEY, all);
    return id;
  }

  function deleteFolder(folderId) {
    const all = getFolders().filter((f) => f.id !== folderId);
    _save(FOLDERS_KEY, all);
  }

  function addBookToFolder(bookId, folderId) {
    const all = getFolders();
    const folder = all.find((f) => f.id === folderId);
    if (!folder) return false;
    folder.bookIds = folder.bookIds || [];
    if (!folder.bookIds.includes(bookId)) folder.bookIds.push(bookId);
    _save(FOLDERS_KEY, all);
    return true;
  }

  function removeBookFromFolder(bookId, folderId) {
    const all = getFolders();
    const folder = all.find((f) => f.id === folderId);
    if (!folder) return false;
    folder.bookIds = (folder.bookIds || []).filter((id) => id !== bookId);
    _save(FOLDERS_KEY, all);
    return true;
  }

  /* Comments per book */
  function getBookComments(bookId) {
    const map = _load(COMMENTS_KEY, {});
    return Array.isArray(map[bookId]) ? map[bookId] : [];
  }

  function addBookComment(bookId, comment) {
    const map = _load(COMMENTS_KEY, {});
    map[bookId] = map[bookId] || [];
    map[bookId].push(comment);
    _save(COMMENTS_KEY, map);
    return true;
  }

  return {
    getShelves,
    setShelves,
    listUniqueBooks,
    getFolders,
    createFolder,
    deleteFolder,
    addBookToFolder,
    removeBookFromFolder,
    getBookComments,
    addBookComment,
  };
})();
