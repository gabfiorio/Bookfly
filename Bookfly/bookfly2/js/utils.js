/* ============================================================
   BOOKFLY — utils.js
   Utilitários compartilhados entre todas as páginas
   ============================================================ */

const API_BASE = 'https://sua-api.com';

const Auth = {
  getToken: () => localStorage.getItem('bf_token'),
  setToken: (t) => localStorage.setItem('bf_token', t),
  getUser:  () => { try { return JSON.parse(localStorage.getItem('bf_user')); } catch { return null; } },
  setUser:  (u) => localStorage.setItem('bf_user', JSON.stringify(u)),
  clear:    () => { localStorage.removeItem('bf_token'); localStorage.removeItem('bf_user'); },
  isLogged: () => !!localStorage.getItem('bf_token'),
};

function requireAuth() {
  if (!Auth.isLogged()) window.location.href = 'login.html';
}

async function apiFetch(path, options = {}) {
  const token = Auth.getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
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

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}
function truncate(str, n) { return str.length > n ? str.slice(0, n) + '…' : str; }
function initials(name = '') { return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase(); }
function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function renderStars(n) { return '★'.repeat(n) + '☆'.repeat(5 - n); }
