/* ============================================================
   BOOKFLY — utils.js
   Utilitários compartilhados entre todas as páginas
   ============================================================ */

const API_BASE = window.BOOKFLY_API_BASE || 'https://bookfly-wp02.onrender.com';
const API_ENDPOINTS = window.BOOKFLY_API_ENDPOINTS || {
  onboarding: '/api/exemplo',
  login: 'https://bookfly-wp02.onrender.com/auth/login',
  cadastro: 'https://bookfly-wp02.onrender.com/usuarios',
};

const Auth = {
  getToken: () => localStorage.getItem('bf_token'),
  setToken: (t) => localStorage.setItem('bf_token', t),
  getUser:  () => { try { return JSON.parse(localStorage.getItem('bf_user')); } catch { return null; } },
  setUser:  (u) => localStorage.setItem('bf_user', JSON.stringify(u)),
  clear:    () => { localStorage.removeItem('bf_token'); localStorage.removeItem('bf_user'); },
  isLogged: () => !!localStorage.getItem('bf_token'),
  isOnboarded: () => {
    const user = Auth.getUser();
    const key = user?.email ? `bf_onboarded:${String(user.email).toLowerCase()}` : 'bf_onboarded';
    return localStorage.getItem(key) === '1' || localStorage.getItem('bf_onboarded') === '1';
  },
  setOnboarded: (value = true) => {
    const user = Auth.getUser();
    const key = user?.email ? `bf_onboarded:${String(user.email).toLowerCase()}` : 'bf_onboarded';
    if (value) localStorage.setItem(key, '1');
    else localStorage.removeItem(key);
  },
  getLandingPage: () => (Auth.isOnboarded() ? 'home.html' : 'formulario.html'),
};

function requireAuth() {
  if (!Auth.isLogged()) window.location.href = 'login.html';
}

// Wrapper para fetch que já inclui a base da API e o token de autenticação 
async function apiFetch(path, options = {}) {
  const token = Auth.getToken();
  const url = 'https://bookfly-wp02.onrender.com/usuarios';
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  console.log('API Request:', url, options);
  if (res.status === 401) { Auth.clear(); window.location.href = 'login.html'; return; }
  return res;
}

function debounce(fn, delay = 300) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

function showToast(msg, type = 'success') {
  document.getElementById('bf-toast')?.remove();
  const toast = document.createElement('div');
  toast.id = 'bf-toast';
  toast.textContent = msg;
  Object.assign(toast.style, {
    position: 'fixed', bottom: '28px', left: '50%',
    transform: 'translateX(-50%) translateY(20px)',
    background: type === 'success' ? 'var(--purple-dark)' : '#c0392b',
    color: '#fff', padding: '12px 24px', borderRadius: '999px',
    fontSize: '14px', fontWeight: '500', fontFamily: 'var(--font-body)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.2)', zIndex: '9999',
    opacity: '0', transition: 'all 0.3s ease', whiteSpace: 'nowrap',
  });
  document.body.appendChild(toast);
  requestAnimationFrame(() => { toast.style.opacity='1'; toast.style.transform='translateX(-50%) translateY(0)'; });
  setTimeout(() => {
    toast.style.opacity = '0'; toast.style.transform = 'translateX(-50%) translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ── Modal System ──
function openModal({ title, body, buttons = [], size = 'md', onClose } = {}) {
  document.getElementById('bf-modal-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'bf-modal-overlay';
  overlay.innerHTML = `
    <div class="bf-modal bf-modal-${size}">
      <div class="bf-modal-header">
        <h3 class="bf-modal-title">${title || ''}</h3>
        <button class="bf-modal-close" id="bf-modal-close-btn" aria-label="Fechar">×</button>
      </div>
      <div class="bf-modal-body">${body || ''}</div>
      ${buttons.length ? `<div class="bf-modal-footer">${buttons.map((b,i) =>
        `<button class="bf-btn bf-btn-${b.type||'ghost'}" data-btn-idx="${i}">${b.label}</button>`
      ).join('')}</div>` : ''}
    </div>`;
  document.body.appendChild(overlay);

  const close = () => {
    overlay.classList.add('bf-modal-leaving');
    setTimeout(() => { overlay.remove(); onClose?.(); }, 220);
  };
  requestAnimationFrame(() => overlay.classList.add('bf-modal-visible'));
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.getElementById('bf-modal-close-btn').addEventListener('click', close);
  const escH = e => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escH); } };
  document.addEventListener('keydown', escH);
  buttons.forEach((btn, i) => {
    overlay.querySelector(`[data-btn-idx="${i}"]`)?.addEventListener('click', () => {
      const result = btn.onClick?.(close);
      if (btn.closeOnClick !== false && result !== false) close();
    });
  });
  return { el: overlay, close };
}

function confirmModal({ title, message, confirmLabel = 'Confirmar', onConfirm } = {}) {
  return openModal({
    title, size: 'sm',
    body: `<p style="color:var(--brown-mid);font-size:14px;line-height:1.6">${message}</p>`,
    buttons: [
      { label: 'Cancelar', type: 'ghost' },
      { label: confirmLabel, type: 'primary', onClick: onConfirm },
    ],
  });
}

function promptModal({ title, label, placeholder = '', value = '', onConfirm } = {}) {
  return openModal({
    title, size: 'sm',
    body: `
      <div style="display:flex;flex-direction:column;gap:8px">
        ${label ? `<label style="font-size:13px;font-weight:600;color:var(--brown-mid)">${label}</label>` : ''}
        <input id="bf-prompt-input" class="bf-input" type="text"
               placeholder="${escapeHtml(placeholder)}" value="${escapeHtml(value)}"
               style="border-radius:var(--radius-md);border:1.5px solid var(--beige-dark)"/>
      </div>`,
    buttons: [
      { label: 'Cancelar', type: 'ghost' },
      { label: 'Salvar', type: 'primary', closeOnClick: false,
        onClick: (close) => {
          const val = document.getElementById('bf-prompt-input')?.value.trim();
          if (!val) { showToast('Campo obrigatório.', 'error'); return false; }
          onConfirm?.(val, close);
        },
      },
    ],
  });
}

const LibraryData = {
  SHELVES_KEY: 'bf_shelves_v1',
  FOLDERS_KEY: 'bf_folders_v1',
  COMMENTS_KEY: 'bf_book_comments_v1',

  defaultShelves() {
    return {
      lidos: [
        { titulo: 'Duna', autor: 'F. Herbert', emoji: '🏜️', id: 1, genero: 'Ficção Científica' },
        { titulo: '1984', autor: 'G. Orwell', emoji: '👁️', id: 2, genero: 'Distopia' },
      ],
      lendo: [
        { titulo: 'Fundação', autor: 'I. Asimov', emoji: '🌌', id: 3, pagina: 142, total: 255, genero: 'Ficção Científica' },
      ],
      quererlev: [
        { titulo: 'O Mestre e Margarida', autor: 'M. Bulgakov', emoji: '😈', id: 10, genero: 'Fantasia' },
      ],
      avaliados: [
        { titulo: '1984', autor: 'G. Orwell', emoji: '👁️', id: 2, stars: 5, genero: 'Distopia' },
        { titulo: 'Duna', autor: 'F. Herbert', emoji: '🏜️', id: 1, stars: 4, genero: 'Ficção Científica' },
      ],
    };
  },

  getShelves() {
    const defaults = this.defaultShelves();
    try {
      const saved = JSON.parse(localStorage.getItem(this.SHELVES_KEY));
      if (saved && typeof saved === 'object') {
        const merged = { ...defaults };
        Object.keys(defaults).forEach((key) => {
          const value = saved[key];
          if (Array.isArray(value) && value.length) merged[key] = value;
        });
        this.setShelves(merged);
        return merged;
      }
    } catch {}
    this.setShelves(defaults);
    return defaults;
  },

  setShelves(shelves) {
    localStorage.setItem(this.SHELVES_KEY, JSON.stringify(shelves));
  },

  listUniqueBooks(shelves = this.getShelves()) {
    const map = new Map();
    Object.values(shelves).flat().forEach((book) => {
      const key = `${String(book.id || '').trim()}::${String(book.titulo || '').toLowerCase()}::${String(book.autor || '').toLowerCase()}`;
      if (!map.has(key)) map.set(key, book);
    });
    return Array.from(map.values());
  },

  _makeId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  },

  getFolders() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.FOLDERS_KEY));
      if (Array.isArray(saved)) return saved;
    } catch {}

    const shelves = this.getShelves();
    const books = this.listUniqueBooks(shelves);
    const byGenre = {};
    const byAuthor = {};

    books.forEach((book) => {
      const g = book.genero || 'Sem gênero';
      const a = book.autor || 'Autor desconhecido';
      if (!byGenre[g]) byGenre[g] = [];
      if (!byAuthor[a]) byAuthor[a] = [];
      if (book.id != null) {
        byGenre[g].push(book.id);
        byAuthor[a].push(book.id);
      }
    });

    const folders = [
      ...Object.keys(byGenre).map((name) => ({ id: this._makeId('folder'), name, type: 'genero', bookIds: byGenre[name] })),
      ...Object.keys(byAuthor).map((name) => ({ id: this._makeId('folder'), name, type: 'autor', bookIds: byAuthor[name] })),
    ];

    this.setFolders(folders);
    return folders;
  },

  setFolders(folders) {
    localStorage.setItem(this.FOLDERS_KEY, JSON.stringify(folders));
  },

  createFolder(name, type = 'genero') {
    const folders = this.getFolders();
    const folder = {
      id: this._makeId('folder'),
      name: String(name || '').trim(),
      type,
      bookIds: [],
    };
    folders.push(folder);
    this.setFolders(folders);
    return folder;
  },

  deleteFolder(folderId) {
    const folders = this.getFolders().filter((f) => f.id !== folderId);
    this.setFolders(folders);
    return folders;
  },

  addBookToFolder(bookId, folderId) {
    const folders = this.getFolders();
    const folder = folders.find((f) => f.id === folderId);
    if (!folder) return false;
    if (!Array.isArray(folder.bookIds)) folder.bookIds = [];
    if (!folder.bookIds.includes(bookId)) folder.bookIds.push(bookId);
    this.setFolders(folders);
    return true;
  },

  removeBookFromFolder(bookId, folderId) {
    const folders = this.getFolders();
    const folder = folders.find((f) => f.id === folderId);
    if (!folder) return false;
    folder.bookIds = (folder.bookIds || []).filter((id) => id !== bookId);
    this.setFolders(folders);
    return true;
  },

  addBookToShelf(book, shelfKey = 'lendo') {
    const shelves = this.getShelves();
    if (!shelves[shelfKey]) shelves[shelfKey] = [];
    const exists = shelves[shelfKey].some((b) => (b.id != null && b.id === book.id) || (b.titulo === book.titulo && b.autor === book.autor));
    if (!exists) shelves[shelfKey].push(book);
    this.setShelves(shelves);
    return shelves;
  },

  getBookComments(bookId) {
    try {
      const saved = JSON.parse(localStorage.getItem(this.COMMENTS_KEY)) || {};
      return saved[String(bookId)] || [];
    } catch {
      return [];
    }
  },

  addBookComment(bookId, comment) {
    let all = {};
    try { all = JSON.parse(localStorage.getItem(this.COMMENTS_KEY)) || {}; } catch {}
    const key = String(bookId);
    const current = all[key] || [];
    current.unshift(comment);
    all[key] = current;
    localStorage.setItem(this.COMMENTS_KEY, JSON.stringify(all));
    return current;
  },
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}
function truncate(str, n) { return str.length > n ? str.slice(0, n) + '…' : str; }
function initials(name = '') { return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase(); }
function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function renderStars(n) { return '★'.repeat(n) + '☆'.repeat(5 - n); }
