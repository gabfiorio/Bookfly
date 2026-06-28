// ─────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────

const GENEROS = {
  'Romance': 1, 'Fantasia': 2, 'Ficção Científica': 3, 'Terror': 4,
  'Mangás': 5, 'Clássicos': 6, 'Não-ficção': 7, 'Geral': 8,
};

const GENERO_TEXTO = {
  1: 'Romance', 2: 'Fantasia', 3: 'Ficção Científica', 4: 'Terror',
  5: 'Mangás', 6: 'Clássicos', 7: 'Não-ficção', 8: 'Geral',
};

const GENRE_META = {
  'Romance':           { icon: '🌹', bg: '#fde8ed', pillClass: 'pink'   },
  'Fantasia':          { icon: '🧙', bg: '#d4d1ee', pillClass: 'purple' },
  'Ficção Científica': { icon: '🚀', bg: '#fdf3d7', pillClass: 'yellow' },
  'Terror':            { icon: '👻', bg: '#e8e8e8', pillClass: 'purple' },
  'Mangás':            { icon: '⛩️', bg: '#fde8ed', pillClass: 'pink'   },
  'Clássicos':         { icon: '📜', bg: '#fdf3d7', pillClass: 'yellow' },
  'Não-ficção':        { icon: '💡', bg: '#daf0e5', pillClass: 'green'  },
  'Geral':             { icon: '📚', bg: '#daf0e5', pillClass: 'green'  },
};

const ICONS = ['📚','🌙','🌹','🚀','👻','🧙','⛩️','💡','📜','🎭','🌿','🔮','🦁','🌊','🎨'];

// ─────────────────────────────────────────────
// ESTADO
// ─────────────────────────────────────────────

let todasComunidades = [];
let minhasComunidades = [];
let generoAtivo = 'all';
let textoBusca = '';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function genreMeta(genre) {
  return GENRE_META[genre] || { icon: '📚', bg: '#d4d1ee', pillClass: 'purple' };
}

function resolveGenreText(c) {
  return c.generoText || GENERO_TEXTO[c.genero] || '';
}

function fmtCount(n) {
  if (!n) return '0';
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k';
  return String(n);
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  requireAuth();

  const user = Auth.getUser();
  const avatarEl = document.getElementById('navAvatar');
  if (avatarEl && user) avatarEl.textContent = initials(user.name || user.email || '?');

  document.getElementById('searchInput').addEventListener(
    'input',
    debounce((e) => { textoBusca = e.target.value.trim().toLowerCase(); renderList(); }, 250)
  );

  const overlay = document.getElementById('bf-modal-overlay');
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  document.getElementById('bf-modal-close-btn').addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  loadCommunities();
});

function logout() {
  Auth.clear();
  window.location.href = 'login.html';
}

// ─────────────────────────────────────────────
// CARREGAR COMUNIDADES
// ─────────────────────────────────────────────

async function loadCommunities() {
  showSkeleton();

  try {
    const res = await apiFetch('/api/Comunidades');
    if (!res?.ok) throw new Error('Erro ao carregar comunidades');

    todasComunidades = await res.json();
    renderList();
    renderSidebar();
  } catch (err) {
    console.error('Erro ao carregar comunidades:', err);
    document.getElementById('commList').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">😕</div>
        <p>Não foi possível carregar as comunidades.</p>
        <small>Tente novamente em instantes.</small>
      </div>`;
  }
}

// ─────────────────────────────────────────────
// ENTRAR / SAIR
// ─────────────────────────────────────────────

async function joinCommunity(id) {
  const btn = document.querySelector(`[data-join-btn="${id}"]`);
  if (btn) { btn.disabled = true; btn.textContent = 'Entrando…'; }

  try {
    const res = await apiFetch(`/comunidades/${id}/join`, { method: 'POST' });
    if (!res?.ok) throw new Error();

    minhasComunidades.push(id);
    const comm = todasComunidades.find((c) => c.id === id);
    if (comm) comm.memberCount = (comm.memberCount || 0) + 1;

    showToast(`Você entrou em "${comm?.nome}"! 🎉`);
    renderList();
    renderSidebar();
  } catch {
    showToast('Erro ao entrar na comunidade.', 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Entrar'; }
  }
}

async function leaveCommunity(id) {
  const comm = todasComunidades.find((c) => c.id === id);

  confirmModal({
    title: 'Sair da comunidade',
    message: `Tem certeza que quer sair de <strong>${escapeHtml(comm?.nome || 'esta comunidade')}</strong>? Você pode entrar de volta quando quiser.`,
    confirmLabel: 'Sair',
    onConfirm: async (close) => {
      close();
      try {
        const res = await apiFetch(`/comunidades/${id}/leave`, { method: 'DELETE' });
        if (!res?.ok) throw new Error();

        minhasComunidades = minhasComunidades.filter((mid) => mid !== id);
        if (comm) comm.memberCount = Math.max(0, (comm.memberCount || 1) - 1);

        showToast(`Você saiu de "${comm?.nome}".`);
        renderList();
        renderSidebar();
      } catch {
        showToast('Erro ao sair da comunidade.', 'error');
      }
    },
  });
}

// ─────────────────────────────────────────────
// CRIAR COMUNIDADE
// ─────────────────────────────────────────────

async function criarComunidade({ nome, descricao, genero }) {
  const usuario = Auth.getUser();

  const resposta = await apiFetch('/api/Comunidades', {
    method: 'POST',
    body: JSON.stringify({
      criadorId: usuario?.id || 0,
      nome,
      descricao,
      genero,
      urlImagem: 'https://via.placeholder.com/300',
      privado: false,
      ativo: true,
      dataCriacao: new Date().toISOString(),
    }),
  });

  if (!resposta.ok) {
    const erro = await resposta.text();
    console.error('Erro API:', erro);
    throw new Error(erro);
  }

  return await resposta.json();
}

// ─────────────────────────────────────────────
// FILTROS
// ─────────────────────────────────────────────

function filterGenre(btn) {
  document.querySelectorAll('.genre-btn').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  generoAtivo = btn.dataset.genre;
  renderList();
}

function filteredCommunities() {
  return todasComunidades.filter((c) => {
    const matchesGenre =
      generoAtivo === 'all'    ? true :
      generoAtivo === 'minhas' ? minhasComunidades.includes(c.id) :
      (c.genero || '').toString().toLowerCase() === generoAtivo.toLowerCase() ||
      resolveGenreText(c).toLowerCase() === generoAtivo.toLowerCase();

    const matchesSearch =
      !textoBusca ||
      (c.nome || '').toLowerCase().includes(textoBusca) ||
      (c.descricao || '').toLowerCase().includes(textoBusca);

    return matchesGenre && matchesSearch;
  });
}

// ─────────────────────────────────────────────
// RENDER — LISTA
// ─────────────────────────────────────────────

function renderList() {
  const container = document.getElementById('commList');
  const list = filteredCommunities();

  if (!list.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <p>Nenhuma comunidade encontrada.</p>
        <small>Tente outro gênero ou crie a sua própria!</small>
      </div>`;
    return;
  }

  container.innerHTML = list.map((c, i) => buildCard(c, i)).join('');
}

function buildCard(c, idx) {
  const isMember = minhasComunidades.includes(c.id);
  const meta = genreMeta(resolveGenreText(c));
  const icon = c.icon || meta.icon;
  const genres = Array.isArray(c.generos) ? c.generos : [resolveGenreText(c)].filter(Boolean);

  const avatarHtml = (() => {
    const sample = (c.members || []).slice(0, 3);
    const extra = (c.memberCount || 0) - sample.length;
    return `<div class="member-avatars">
      ${sample.map((m) => `<div class="m-av">${initials(m.name || '?')}</div>`).join('')}
      ${extra > 0 ? `<div class="m-av">+${extra > 99 ? '99' : extra}</div>` : ''}
    </div>`;
  })();

  const genresPills = genres
    .map((g) => `<span class="genre-pill ${genreMeta(g).pillClass}">${escapeHtml(g)}</span>`)
    .join('');

  const actionBtn = isMember
    ? `<button class="btn-ver-mais" onclick="goToCommunity(${c.id})">Ver comunidade →</button>
       <button class="btn-membro" data-leave-btn="${c.id}" onclick="leaveCommunity(${c.id})">✓ Membro</button>`
    : `<button class="btn-entrar" data-join-btn="${c.id}" onclick="joinCommunity(${c.id})">Entrar</button>`;

  return `
    <div class="comm-card" style="animation-delay:${idx * 0.06}s">
      <div class="comm-top">
        <div class="comm-icon" style="background:${meta.bg}">${icon}</div>
        <div class="comm-info">
          <div class="comm-name">${escapeHtml(c.nome)}</div>
          <div class="comm-desc">${escapeHtml(c.descricao || '')}</div>
        </div>
      </div>
      <div class="comm-meta">
        ${avatarHtml}
        <span class="meta-item">${fmtCount(c.memberCount)} membros</span>
        ${c.onlineCount ? `<span class="meta-sep"></span><span class="meta-item">🟢 ${c.onlineCount} online</span>` : ''}
      </div>
      ${genresPills ? `<div class="comm-genres">${genresPills}</div>` : ''}
      <div class="comm-footer">${actionBtn}</div>
    </div>`;
}

// ─────────────────────────────────────────────
// RENDER — SIDEBAR
// ─────────────────────────────────────────────

function renderSidebar() {
  renderMyGroups();
  renderTrending();
}

function renderMyGroups() {
  const el = document.getElementById('myGroupsList');
  const myComm = todasComunidades.filter((c) => minhasComunidades.includes(c.id));

  if (!myComm.length) {
    el.innerHTML = `<p class="mg-empty">Você ainda não entrou em nenhuma comunidade.</p>`;
    return;
  }

  el.innerHTML = myComm.map((c) => {
    const meta = genreMeta(resolveGenreText(c));
    return `
      <div class="mg-item" onclick="goToCommunity(${c.id})">
        <div class="mg-dot" style="background:${meta.bg};outline:1.5px solid ${meta.bg}"></div>
        <span class="mg-name">${escapeHtml(c.nome)}</span>
        ${c.unread ? `<span class="mg-notif">${c.unread}</span>` : ''}
      </div>`;
  }).join('');
}

function renderTrending() {
  const el = document.getElementById('trendingList');
  const sorted = [...todasComunidades]
    .sort((a, b) => (b.todayJoins || 0) - (a.todayJoins || 0))
    .slice(0, 4);

  el.innerHTML = sorted.map((c) => {
    const meta = genreMeta(resolveGenreText(c));
    return `
      <div class="tc-item" onclick="goToCommunity(${c.id})">
        <div class="tc-icon" style="background:${meta.bg}">${c.icon || meta.icon}</div>
        <div class="tc-info">
          <div class="tc-name">${escapeHtml(c.nome)}</div>
          <div class="tc-count">${fmtCount(c.memberCount)} membros</div>
        </div>
        ${c.todayJoins ? `<span class="tc-badge">+${c.todayJoins} hoje</span>` : ''}
      </div>`;
  }).join('');
}

// ─────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────

function showSkeleton() {
  document.getElementById('commList').innerHTML = `
    <div class="loading-bar">
      <div class="skel" style="height:148px;"></div>
      <div class="skel" style="height:148px;"></div>
      <div class="skel" style="height:148px;"></div>
    </div>`;
}

// ─────────────────────────────────────────────
// MODAL — CRIAR COMUNIDADE
// ─────────────────────────────────────────────

function openCreateModal() {
  document.getElementById('bf-modal-title').textContent = 'Nova comunidade';
  document.getElementById('bf-modal-body').innerHTML = `
    <div class="create-form" id="createForm">
      <div class="form-group">
        <label class="form-label">Nome da comunidade *</label>
        <input id="cf-name" class="form-input" type="text" placeholder="Ex: Leitores da Madrugada" maxlength="60"/>
        <span class="char-count" id="cf-name-count">0 / 60</span>
      </div>
      <div class="form-group">
        <label class="form-label">Descrição</label>
        <textarea id="cf-desc" class="form-textarea" placeholder="Sobre o que é esta comunidade?" maxlength="200"></textarea>
        <span class="char-count" id="cf-desc-count">0 / 200</span>
      </div>
      <div class="form-group">
        <label class="form-label">Gênero principal</label>
        <select id="cf-genre" class="form-select">
          <option value="">Selecione um gênero…</option>
          ${Object.keys(GENEROS).map((g) => `<option value="${g}">${g}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Ícone</label>
        <div class="icon-grid" id="iconGrid">
          ${ICONS.map((ic, i) =>
            `<button type="button" class="icon-option${i === 0 ? ' active' : ''}"
                     data-icon="${ic}" onclick="selectIcon(this)">${ic}</button>`
          ).join('')}
        </div>
      </div>
    </div>`;

  document.getElementById('bf-modal-footer').innerHTML = `
    <button class="bf-btn bf-btn-ghost" onclick="closeModal()">Cancelar</button>
    <button class="bf-btn bf-btn-primary" id="cf-submit-btn" onclick="submitCreate()">Criar comunidade</button>`;

  document.getElementById('cf-name').addEventListener('input', (e) => {
    document.getElementById('cf-name-count').textContent = `${e.target.value.length} / 60`;
  });
  document.getElementById('cf-desc').addEventListener('input', (e) => {
    document.getElementById('cf-desc-count').textContent = `${e.target.value.length} / 200`;
  });

  openModalEl();
}

function selectIcon(btn) {
  document.querySelectorAll('.icon-option').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
}

async function submitCreate() {
  const name        = document.getElementById('cf-name')?.value.trim();
  const description = document.getElementById('cf-desc')?.value.trim();
  const genre       = document.getElementById('cf-genre')?.value;

  if (!name)  { showToast('Dê um nome à comunidade.', 'error'); return; }
  if (!genre) { showToast('Selecione um gênero.', 'error');     return; }

  const submitBtn = document.getElementById('cf-submit-btn');
  submitBtn.disabled    = true;
  submitBtn.textContent = 'Criando…';

  try {
    const novaComunidade = await criarComunidade({
      nome: name,
      descricao: description,
      genero: GENEROS[genre],
    });

    todasComunidades.unshift(novaComunidade);
    if (novaComunidade.id) minhasComunidades.push(novaComunidade.id);

    closeModal();
    showToast(`Comunidade "${name}" criada! 🎉`);
    renderList();
    renderSidebar();
  } catch {
    showToast('Erro ao criar comunidade. Tente novamente.', 'error');
    submitBtn.disabled    = false;
    submitBtn.textContent = 'Criar comunidade';
  }
}

// ─────────────────────────────────────────────
// MODAL — UTILITÁRIOS
// ─────────────────────────────────────────────

function openModalEl() {
  const overlay = document.getElementById('bf-modal-overlay');
  overlay.style.display = 'flex';
  requestAnimationFrame(() => overlay.classList.add('bf-modal-visible'));
}

function closeModal() {
  const overlay = document.getElementById('bf-modal-overlay');
  overlay.classList.remove('bf-modal-visible');
  overlay.classList.add('bf-modal-leaving');
  setTimeout(() => {
    overlay.style.display = 'none';
    overlay.classList.remove('bf-modal-leaving');
  }, 220);
}

// ─────────────────────────────────────────────
// NAVEGAÇÃO
// ─────────────────────────────────────────────

function goToCommunity(id) {
  window.location.href = `comunidade.html?id=${id}`;
}