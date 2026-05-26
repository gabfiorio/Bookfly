let allCommunities = [];   // cache com todas as comunidades vindas da API
let myMemberships  = [];   // IDs das comunidades que o usuário é membro
let activeGenre    = 'all';
let searchQuery    = '';

const GENRE_META = {
  'Romance':            { icon: '🌹', bg: '#fde8ed', pillClass: 'pink'   },
  'Fantasia':           { icon: '🧙', bg: '#d4d1ee', pillClass: 'purple' },
  'Ficção Científica':  { icon: '🚀', bg: '#fdf3d7', pillClass: 'yellow' },
  'Terror':             { icon: '👻', bg: '#e8e8e8', pillClass: 'purple' },
  'Mangás':             { icon: '⛩️', bg: '#fde8ed', pillClass: 'pink'   },
  'Clássicos':          { icon: '📜', bg: '#fdf3d7', pillClass: 'yellow' },
  'Não-ficção':         { icon: '💡', bg: '#daf0e5', pillClass: 'green'  },
  'Geral':              { icon: '📚', bg: var_or('#daf0e5'), pillClass: 'green' },
};
function var_or(fallback) { return fallback; }

function genreMeta(genre) {
  return GENRE_META[genre] || { icon: '📚', bg: '#d4d1ee', pillClass: 'purple' };
}

document.addEventListener('DOMContentLoaded', () => {
  requireAuth();

  const user = Auth.getUser();
  const avatarEl = document.getElementById('navAvatar');
  if (avatarEl && user) avatarEl.textContent = initials(user.name || user.email || '?');

  document.getElementById('searchInput').addEventListener(
    'input',
    debounce(e => { searchQuery = e.target.value.trim().toLowerCase(); renderList(); }, 250)
  );

  document.getElementById('bf-modal-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('bf-modal-overlay')) closeModal();
  });
  document.getElementById('bf-modal-close-btn').addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  loadCommunities();
});

function logout() {
  Auth.clear();
  window.location.href = 'login.html';
}

async function loadCommunities() {
  showSkeleton();
  try {
    const [commRes, mineRes] = await Promise.all([
      apiFetch('/communities'),
      apiFetch('/communities/mine'),
    ]);

    if (!commRes || !mineRes) return;

    allCommunities = await commRes.json();
    const mine     = await mineRes.json();

    myMemberships = mine.map(m => (typeof m === 'object' ? m.communityId ?? m.id : m));

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

async function joinCommunity(id) {
  const btn = document.querySelector(`[data-join-btn="${id}"]`);
  if (btn) { btn.disabled = true; btn.textContent = 'Entrando…'; }

  try {
    const res = await apiFetch(`/communities/${id}/join`, { method: 'POST' });
    if (!res || !res.ok) throw new Error('Falha ao entrar');

    myMemberships.push(id);
    const comm = allCommunities.find(c => c.id === id);
    if (comm) comm.memberCount = (comm.memberCount || 0) + 1;

    showToast(`Você entrou em "${comm?.name}"! 🎉`);
    renderList();
    renderSidebar();
  } catch {
    showToast('Erro ao entrar na comunidade.', 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Entrar'; }
  }
}

async function leaveCommunity(id) {
  const comm = allCommunities.find(c => c.id === id);

  confirmModal({
    title: 'Sair da comunidade',
    message: `Tem certeza que quer sair de <strong>${escapeHtml(comm?.name || 'esta comunidade')}</strong>? Você pode entrar de volta quando quiser.`,
    confirmLabel: 'Sair',
    onConfirm: async (close) => {
      close();
      try {
        const res = await apiFetch(`/communities/${id}/leave`, { method: 'DELETE' });
        if (!res || !res.ok) throw new Error('Falha ao sair');

        myMemberships = myMemberships.filter(mid => mid !== id);
        if (comm) comm.memberCount = Math.max(0, (comm.memberCount || 1) - 1);

        showToast(`Você saiu de "${comm?.name}".`);
        renderList();
        renderSidebar();
      } catch {
        showToast('Erro ao sair da comunidade.', 'error');
      }
    },
  });
}

async function createCommunity({ name, description, genre, icon }) {
  const res = await apiFetch('/communities', {
    method: 'POST',
    body: JSON.stringify({ name, description, genre, icon }),
  });
  if (!res || !res.ok) throw new Error('Falha ao criar');
  return res.json();
}

function filterGenre(btn) {
  document.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  activeGenre = btn.dataset.genre;
  renderList();
}

function filteredCommunities() {
  return allCommunities.filter(c => {
    const matchesGenre =
      activeGenre === 'all'   ? true :
      activeGenre === 'minhas' ? myMemberships.includes(c.id) :
      (c.genre || '').toLowerCase() === activeGenre.toLowerCase();

    const matchesSearch =
      !searchQuery ||
      c.name.toLowerCase().includes(searchQuery) ||
      (c.description || '').toLowerCase().includes(searchQuery);

    return matchesGenre && matchesSearch;
  });
}

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
  const isMember = myMemberships.includes(c.id);
  const meta     = genreMeta(c.genre);
  const icon     = c.icon || meta.icon;
  const bg       = meta.bg;
  const genres   = Array.isArray(c.genres) ? c.genres : [c.genre].filter(Boolean);

  const onlineText = c.onlineCount ? `🟢 ${c.onlineCount} online` : '';

  const avatarHtml = (() => {
    const sample = (c.members || []).slice(0, 3);
    const extra  = (c.memberCount || 0) - sample.length;
    return `<div class="member-avatars">
      ${sample.map(m => `<div class="m-av">${initials(m.name || '?')}</div>`).join('')}
      ${extra > 0 ? `<div class="m-av">+${extra > 99 ? '99' : extra}</div>` : ''}
    </div>`;
  })();

  const genresPills = genres.map(g => {
    const gm = genreMeta(g);
    return `<span class="genre-pill ${gm.pillClass}">${escapeHtml(g)}</span>`;
  }).join('');

  const actionBtn = isMember
    ? `<button class="btn-ver-mais" onclick="goToCommunity(${c.id})">Ver comunidade →</button>
       <button class="btn-membro" data-leave-btn="${c.id}" onclick="leaveCommunity(${c.id})">✓ Membro</button>`
    : `<button class="btn-entrar" data-join-btn="${c.id}" onclick="joinCommunity(${c.id})">Entrar</button>`;

  return `
    <div class="comm-card" style="animation-delay:${idx * 0.06}s">
      <div class="comm-top">
        <div class="comm-icon" style="background:${bg}">${icon}</div>
        <div class="comm-info">
          <div class="comm-name">${escapeHtml(c.name)}</div>
          <div class="comm-desc">${escapeHtml(c.description || '')}</div>
        </div>
      </div>
      <div class="comm-meta">
        ${avatarHtml}
        <span class="meta-item">${fmtCount(c.memberCount)} membros</span>
        ${onlineText ? `<span class="meta-sep"></span><span class="meta-item">${onlineText}</span>` : ''}
      </div>
      ${genresPills ? `<div class="comm-genres">${genresPills}</div>` : ''}
      <div class="comm-footer">${actionBtn}</div>
    </div>`;
}

function renderSidebar() {
  renderMyGroups();
  renderTrending();
}

function renderMyGroups() {
  const el     = document.getElementById('myGroupsList');
  const myComm = allCommunities.filter(c => myMemberships.includes(c.id));

  if (!myComm.length) {
    el.innerHTML = `<p class="mg-empty">Você ainda não entrou em nenhuma comunidade.</p>`;
    return;
  }

  el.innerHTML = myComm.map(c => {
    const meta = genreMeta(c.genre);
    return `
      <div class="mg-item" onclick="goToCommunity(${c.id})">
        <div class="mg-dot" style="background:${meta.bg};outline:1.5px solid ${meta.bg}"></div>
        <span class="mg-name">${escapeHtml(c.name)}</span>
        ${c.unread ? `<span class="mg-notif">${c.unread}</span>` : ''}
      </div>`;
  }).join('');
}

function renderTrending() {
  const el      = document.getElementById('trendingList');
  const sorted  = [...allCommunities]
    .sort((a, b) => (b.todayJoins || 0) - (a.todayJoins || 0))
    .slice(0, 4);

  el.innerHTML = sorted.map(c => {
    const meta = genreMeta(c.genre);
    return `
      <div class="tc-item" onclick="goToCommunity(${c.id})">
        <div class="tc-icon" style="background:${meta.bg}">${c.icon || meta.icon}</div>
        <div class="tc-info">
          <div class="tc-name">${escapeHtml(c.name)}</div>
          <div class="tc-count">${fmtCount(c.memberCount)} membros</div>
        </div>
        ${c.todayJoins ? `<span class="tc-badge">+${c.todayJoins} hoje</span>` : ''}
      </div>`;
  }).join('');
}

function showSkeleton() {
  document.getElementById('commList').innerHTML = `
    <div class="loading-bar">
      <div class="skel" style="height:148px;"></div>
      <div class="skel" style="height:148px;"></div>
      <div class="skel" style="height:148px;"></div>
    </div>`;
}

const ICONS = ['📚','🌙','🌹','🚀','👻','🧙','⛩️','💡','📜','🎭','🌿','🔮','🦁','🌊','🎨'];

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
          <option value="Romance">Romance</option>
          <option value="Fantasia">Fantasia</option>
          <option value="Ficção Científica">Ficção Científica</option>
          <option value="Terror">Terror</option>
          <option value="Mangás">Mangás</option>
          <option value="Clássicos">Clássicos</option>
          <option value="Não-ficção">Não-ficção</option>
          <option value="Geral">Geral</option>
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
    <button class="bf-btn bf-btn-ghost"   onclick="closeModal()">Cancelar</button>
    <button class="bf-btn bf-btn-primary" id="cf-submit-btn" onclick="submitCreate()">Criar comunidade</button>`;

  // contadores de caracteres
  document.getElementById('cf-name').addEventListener('input', e => {
    document.getElementById('cf-name-count').textContent = `${e.target.value.length} / 60`;
  });
  document.getElementById('cf-desc').addEventListener('input', e => {
    document.getElementById('cf-desc-count').textContent = `${e.target.value.length} / 200`;
  });

  openModalEl();
}

function selectIcon(btn) {
  document.querySelectorAll('.icon-option').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

async function submitCreate() {
  const name        = document.getElementById('cf-name')?.value.trim();
  const description = document.getElementById('cf-desc')?.value.trim();
  const genre       = document.getElementById('cf-genre')?.value;
  const icon        = document.querySelector('.icon-option.active')?.dataset.icon || '📚';

  if (!name)  { showToast('Dê um nome à comunidade.', 'error'); return; }
  if (!genre) { showToast('Selecione um gênero.', 'error');     return; }

  const submitBtn = document.getElementById('cf-submit-btn');
  submitBtn.disabled    = true;
  submitBtn.textContent = 'Criando…';

  try {
    const newComm = await createCommunity({ name, description, genre, icon });

    allCommunities.unshift(newComm);
    myMemberships.push(newComm.id);

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

function goToCommunity(id) {
  window.location.href = `comunidade.html?id=${id}`;
}

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

function fmtCount(n) {
  if (!n) return '0';
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k';
  return String(n);
}
