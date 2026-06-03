requireAuth();
/* ── Detecta se é perfil próprio ou de outro usuário ── */
const _urlParams   = new URLSearchParams(window.location.search);
const _viewedId    = _urlParams.get('id') ? Number(_urlParams.get('id')) : null;
const _selfUser    = Auth.getUser();
const IS_OWN       = !_viewedId || Number(_viewedId) === Number(_selfUser?.id);

let user              = normalizeProfileUser(_selfUser);
const avatarEl        = document.getElementById('profileAvatar');
let profileAvatarSrc  = user.avatar || '';
let profileBio        = user.bio    || '';

let SHELVES        = IS_OWN ? LibraryData.getShelves() : { lidos: [], lendo: [], quererlev: [] };
const GENRE_OPTIONS = [
  'Romance','Fantasia','Distopia','Terror','Ficção Científica',
  'Suspense','Biografia','Não ficção','Outro',
];

let FOLDER_MODE   = 'todas';
let OPEN_FOLDER_ID = null;

const MY_POSTS = [
  { id: 10, tempo: '2h',    texto: 'Começando Duna hoje! Muito animado 🏜️',            livro: 'Duna', livroId: 1, stars: null },
  { id: 11, tempo: '1 dia', texto: 'Termino 1984 e fico com um gosto amargo na boca — no bom sentido.', livro: '1984', livroId: 2, stars: 5 },
];

/* ── Adapta a UI para perfil alheio ── */
function applyViewMode() {
  if (IS_OWN) return;

  /* Esconde controles de edição */
  const editBtn  = document.querySelector('.profile-actions .bf-btn[onclick="editProfile()"]');
  if (editBtn)  editBtn.remove();

  const avatarEditBtn   = document.querySelector('.avatar-edit-btn');
  const removeAvatarBtn = document.getElementById('removeAvatarBtn');
  const avatarInput     = document.getElementById('avatarInput');
  if (avatarEditBtn)   avatarEditBtn.remove();
  if (removeAvatarBtn) removeAvatarBtn.style.display = 'none';
  if (avatarInput)     avatarInput.remove();
  /* Torna o avatar não-clicável */
  if (avatarEl) avatarEl.onclick = null;

  /* Esconde botões exclusivos do próprio perfil */
  const addShelfBtns = document.querySelectorAll('.add-book-btn');
  addShelfBtns.forEach(b => b.style.display = 'none');

  ['avaliar.html', 'desafio.html', 'formulario.html'].forEach(href => {
    const btn = document.querySelector(`.profile-actions a[href="${href}"]`);
    if (btn) btn.remove();
  });

  /* Injeta botão Seguir */
  const actionsEl = document.querySelector('.profile-actions');
  if (actionsEl) {
    const followBtn = document.createElement('button');
    followBtn.id        = 'followBtn';
    followBtn.className = 'bf-btn bf-btn-primary';
    followBtn.style     = 'font-size:13px;padding:9px 20px;';
    followBtn.textContent = 'Seguir';
    followBtn.onclick = toggleFollow;
    actionsEl.prepend(followBtn);
    checkFollowStatus();
  }
}

async function checkFollowStatus() {
  if (!_selfUser?.id || !_viewedId) return;
  try {
    const res = await apiFetch(`/seguidorUsuario/api/seguindo?usuarioId=${_selfUser.id}`);
    if (!res || !res.ok) return;
    const payload = await res.json().catch(() => []);
    const list    = extractArrayPayload(payload);
    const isFollowing = list.some(
      (item) => Number(firstDefined(item.seguidoID, item.SeguidoID, item.seguidoId)) === _viewedId
    );
    const btn = document.getElementById('followBtn');
    if (btn) {
      btn.textContent = isFollowing ? 'Seguindo' : 'Seguir';
      btn.classList.toggle('bf-btn-ghost',   isFollowing);
      btn.classList.toggle('bf-btn-primary', !isFollowing);
    }
  } catch (err) {
    console.warn('Perfil: não foi possível verificar seguindo.', err);
  }
}

async function toggleFollow() {
  const btn = document.getElementById('followBtn');
  if (!btn || !_viewedId || !_selfUser?.id) return;

  const isFollowing = btn.textContent.trim() === 'Seguindo';
  btn.disabled = true;

  try {
    if (isFollowing) {
      await apiFetch(`/seguidorUsuario/api/deixarSeguir`, {
        method: 'DELETE',
        body: JSON.stringify({ seguidorId: _selfUser.id, seguidoId: _viewedId }),
      });
    } else {
      await apiFetch(`/seguidorUsuario/api/seguir`, {
        method: 'POST',
        body: JSON.stringify({ seguidorId: _selfUser.id, seguidoId: _viewedId }),
      });
    }
    btn.textContent = isFollowing ? 'Seguir' : 'Seguindo';
    btn.classList.toggle('bf-btn-ghost',   !isFollowing);
    btn.classList.toggle('bf-btn-primary', isFollowing);
    showToast(isFollowing ? 'Você deixou de seguir.' : 'Seguindo!');
    updateFollowStats();
  } catch (err) {
    showToast('Não foi possível atualizar.', 'error');
  } finally {
    btn.disabled = false;
  }
}

/* ─────────────────────────────────────────
   Funções existentes (sem alteração de lógica)
───────────────────────────────────────── */

function normalizeProfileUser(raw = {}) {
  const name = firstDefined(raw.nome, raw.name, raw.username, raw.Username, raw.usuario, 'Leitor');
  return {
    ...raw,
    id:             firstDefined(raw.id, raw.userId, raw.usuarioId, raw._id, null),
    nome:           String(name),
    email:          String(firstDefined(raw.email, raw.mail, '')),
    bio:            firstDefined(raw.bio, raw.biografia, raw.descricao, raw.description, ''),
    avatar:         firstDefined(raw.avatar, raw.foto, raw.fotoPerfil, raw.urlImagem, raw.url_imagem, ''),
    senhaHash:      firstDefined(raw.senhaHash, ''),
    receberSpoilers:firstDefined(raw.receberSpoilers, true),
    situacao:       firstDefined(raw.situacao, true),
    criadoEm:       firstDefined(raw.criadoEm, raw.createdAt, new Date().toISOString()),
  };
}

function profilePayload({
  nome = user.nome, email = user.email, bio = profileBio,
  avatar = profileAvatarSrc, senhaHash = user.senhaHash,
  receberSpoilers = user.receberSpoilers, situacao = user.situacao,
  criadoEm = user.criadoEm,
} = {}) {
  const avatarUrl = String(avatar || '');
  return {
    email, username: nome,
    senhaHash:       String(senhaHash || ''),
    biografia:       bio || '',
    urlImagem:       avatarUrl.startsWith('data:') ? '' : avatarUrl,
    receberSpoilers: Boolean(receberSpoilers),
    situacao:        Boolean(situacao),
    criadoEm:        criadoEm || new Date().toISOString(),
  };
}

async function tryProfileRequest(paths, options = {}) {
  for (const path of paths.filter(Boolean)) {
    try {
      const response = await apiFetch(path, options);
      if (!response || !response.ok) continue;
      const data = await response.json().catch(() => ({}));
      return data?.user || data?.usuario || data?.data || data;
    } catch (err) {
      console.warn(`Perfil: endpoint indisponível (${path}).`, err);
    }
  }
  return null;
}

function profileEndpoints() {
  const id = IS_OWN ? user.id : _viewedId;
  return [id ? `/usuarios/${id}` : null];
}

async function fetchProfileFromBackend() {
  const remoteUser = await tryProfileRequest(profileEndpoints());
  if (!remoteUser) return;

  user             = normalizeProfileUser({ ...(IS_OWN ? user : {}), ...remoteUser });
  profileAvatarSrc = user.avatar || profileAvatarSrc;
  profileBio       = user.bio    || profileBio;
}

async function saveProfileToBackend(payload) {
  if (!user.id) throw new Error('ID do usuário não encontrado.');

  const response = await apiFetch(`/usuarios/${user.id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  if (!response) throw new Error('Servidor indisponível.');

  const rawBody = await response.text().catch(() => '');
  let data = {};
  try { data = rawBody ? JSON.parse(rawBody) : {}; } catch { data = {}; }

  if (!response.ok) {
    throw new Error(
      data.message || data.erro || data.error || rawBody ||
      `Não foi possível atualizar o perfil. HTTP ${response.status}`
    );
  }

  return normalizeProfileUser({
    ...user,
    ...(data.user || data.usuario || data.data || data),
    username: payload.username, email: payload.email,
    biografia: payload.biografia, urlImagem: payload.urlImagem,
  });
}

function renderProfileHeader() {
  if (profileAvatarSrc) {
    avatarEl.innerHTML = `<img src="${profileAvatarSrc}" alt="avatar"/>`;
    if (IS_OWN) document.getElementById('removeAvatarBtn').style.display = 'block';
  } else {
    avatarEl.innerHTML  = '';
    avatarEl.textContent = initials(user.nome);
    if (IS_OWN) document.getElementById('removeAvatarBtn').style.display = 'none';
  }
  document.getElementById('profileName').textContent  = user.nome;
  document.getElementById('profileEmail').textContent = IS_OWN ? user.email : '';
  document.getElementById('profileBio').textContent   = profileBio;
}

function renderPosts() {
  const el = document.getElementById('myPosts');
  if (!MY_POSTS.length) {
    el.innerHTML = `<div class="empty-shelf"><div class="emoji">📝</div>${IS_OWN ? 'Você ainda não fez' : 'Este leitor ainda não fez'} nenhum post.</div>`;
    return;
  }
  el.innerHTML = MY_POSTS.map((p, i) => `
    <div class="post-card" style="animation-delay:${i * 0.07}s">
      <div class="post-top">
        <span class="post-name">${escapeHtml(user.nome)}</span>
        <span class="post-time">há ${p.tempo}</span>
      </div>
      <div class="post-body">${escapeHtml(p.texto)}</div>
      ${p.stars ? `<div class="post-stars">${renderStars(p.stars)}</div>` : ''}
      ${p.livro ? `<a class="post-book-tag" href="livro.html?id=${p.livroId}">📚 ${escapeHtml(p.livro)}</a>` : ''}
    </div>`).join('');
}

function renderShelf(key) {
  const books = SHELVES[key] || [];
  const el    = document.getElementById(`shelf-${key}`);
  if (!books.length) {
    el.innerHTML = `<div class="empty-shelf" style="grid-column:1/-1"><div class="emoji">📚</div>Nenhum livro aqui ainda.</div>`;
    return;
  }
  el.innerHTML = books.map((b, i) => {
    const coverId     = `shelf-cover-${key}-${i}`;
    const progressBar = (key === 'lendo' && b.pagina != null && b.total) ? `
      <div class="progress-wrap">
        <div class="progress-bar"><div class="progress-fill" style="width:${Math.round((b.pagina / b.total) * 100)}%"></div></div>
        <span class="progress-label">${b.pagina}/${b.total} pág.</span>
        ${IS_OWN ? `<button class="progress-edit-btn" onclick="editProgress(event,${i},'${key}')" title="Atualizar progresso">✏️</button>` : ''}
      </div>` : '';
    return `
      <div class="shelf-book" style="animation-delay:${i * 0.06}s" onclick="goToBook(${b.id || 0})">
        <div class="shelf-cover" id="${coverId}">${b.emoji}</div>
        <div class="shelf-book-title">${escapeHtml(b.titulo)}</div>
        <div class="shelf-book-author">${escapeHtml(b.autor)}</div>
        ${b.stars ? `<div class="shelf-book-stars">${renderStars(b.stars)}</div>` : ''}
        ${progressBar}
      </div>`;
  }).join('');

  books.forEach((b, i) => applyCover(
    document.getElementById(`shelf-cover-${key}-${i}`),
    b.titulo, b.autor, b.emoji,
    { width: 60, height: 86, radius: 5, fontSize: 28 }
  ));
}

function goToBook(id) {
  if (id) window.location.href = `livro.html?id=${id}`;
}

function editProgress(e, idx, key) {
  if (!IS_OWN) return;
  e.stopPropagation();
  const book = SHELVES[key][idx];
  openModal({
    title: `📖 Progresso — ${book.titulo}`,
    size: 'sm',
    body: `
      <div style="display:flex;flex-direction:column;gap:16px">
        <label style="font-size:13px;font-weight:600;color:var(--brown-mid)">Página atual</label>
        <input id="modal-pagina" class="bf-input" type="number" min="0" max="${book.total || 9999}" value="${book.pagina || 0}" style="border-radius:var(--radius-md);border:1.5px solid var(--beige-dark)"/>
        ${book.total ? `<p style="font-size:12px;color:var(--brown-light)">${book.total} páginas no total</p>` : ''}
      </div>`,
    buttons: [
      { label: 'Cancelar', type: 'ghost' },
      { label: 'Salvar', type: 'primary', closeOnClick: false, onClick: (close) => {
          const val = parseInt(document.getElementById('modal-pagina')?.value);
          if (isNaN(val) || val < 0) { showToast('Número inválido.', 'error'); return false; }
          book.pagina = val;
          LibraryData.setShelves(SHELVES);
          renderShelf(key);
          close();
          showToast('Progresso atualizado!');
        },
      },
    ],
  });
}

function updateStats() {
  document.getElementById('statLidos').textContent     = SHELVES.lidos.length;
  document.getElementById('statLendo').textContent     = SHELVES.lendo.length;
  document.getElementById('statQueremLer').textContent = SHELVES.quererlev.length;
  updateFollowStats();
}

async function getFollowCount(kind) {
  const targetId = IS_OWN ? user.id : _viewedId;
  if (!targetId) return 0;
  try {
    const response = await apiFetch(`/seguidorUsuario/api/${kind}?usuarioId=${targetId}`);
    if (!response || response.status === 204) return 0;
    if (!response.ok) throw new Error(`Falha ao carregar ${kind}.`);
    const payload = await response.json().catch(() => []);
    return extractArrayPayload(payload).length;
  } catch (err) {
    console.warn(`Perfil: ${kind} indisponíveis.`, err);
    return 0;
  }
}

async function updateFollowStats() {
  const [seguidores, seguindo] = await Promise.all([
    getFollowCount('seguidores'),
    getFollowCount('seguindo'),
  ]);
  const seguidoresEl = document.getElementById('statSeguidores');
  const seguindoEl   = document.getElementById('statSeguindo');
  if (seguidoresEl) seguidoresEl.textContent = seguidores;
  if (seguindoEl)   seguindoEl.textContent   = seguindo;
}

function renderFolders() {
  if (!IS_OWN) return;
  const grid = document.getElementById('foldersGrid');
  if (!grid) return;

  const allFolders = LibraryData.getFolders();
  const folders = allFolders
    .filter((f) => (FOLDER_MODE === 'todas' ? true : f.type === FOLDER_MODE))
    .sort((a, b) => String(a.name).localeCompare(String(b.name), 'pt-BR'));

  const allBooks = LibraryData.listUniqueBooks(SHELVES);
  const byId = new Map(allBooks.map((b) => [b.id, b]));

  if (!folders.length) {
    grid.innerHTML = `<div class="empty-shelf" style="grid-column:1/-1"><div class="emoji">🗂️</div>Nenhuma pasta criada para este filtro.</div>`;
    const detail = document.getElementById('folderDetail');
    if (detail) detail.style.display = 'none';
    return;
  }

  grid.innerHTML = folders.map((folder, i) => {
    const count = (folder.bookIds || []).filter((id) => byId.has(id)).length;
    const badge = folder.type === 'autor' ? '✍️ Autor' : '📚 Gênero';
    return `
      <article class="folder-card" style="animation-delay:${i * 0.05}s">
        <header class="folder-head">
          <h4 class="folder-name">📁 ${escapeHtml(folder.name)}</h4>
          <span class="folder-count">${count} livro${count > 1 ? 's' : ''}</span>
        </header>
        <div class="folder-meta-row"><span class="folder-type-chip">${badge}</span></div>
        <div class="folder-actions-row">
          <button class="bf-btn bf-btn-primary" style="font-size:12px;padding:7px 12px" onclick="openFolder('${folder.id}')">Abrir pasta</button>
          <button class="bf-btn bf-btn-ghost"   style="font-size:12px;padding:7px 12px" onclick="removeFolder('${folder.id}')">Apagar</button>
        </div>
      </article>`;
  }).join('');
}

function setFolderMode(mode, btn) {
  FOLDER_MODE = mode;
  document.querySelectorAll('.folder-mode-btn').forEach((el) => el.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderFolders();
}

function createFolder() {
  if (!IS_OWN) return;
  openModal({
    title: '🗂️ Nova pasta', size: 'sm',
    body: `
      <div style="display:flex;flex-direction:column;gap:12px">
        <div>
          <label class="modal-label">Nome da pasta *</label>
          <input id="folder-name" class="bf-input" placeholder="Ex: Favoritos de Ficção" style="border-radius:var(--radius-md);border:1.5px solid var(--beige-dark)"/>
        </div>
        <div>
          <label class="modal-label">Tipo</label>
          <select id="folder-type" class="bf-input" style="border-radius:var(--radius-md);border:1.5px solid var(--beige-dark)">
            <option value="genero">Por gênero</option>
            <option value="autor">Por autor</option>
          </select>
        </div>
      </div>`,
    buttons: [
      { label: 'Cancelar', type: 'ghost' },
      { label: 'Criar', type: 'primary', closeOnClick: false, onClick: (close) => {
          const name = document.getElementById('folder-name')?.value.trim();
          const type = document.getElementById('folder-type')?.value || 'genero';
          if (!name) { showToast('Digite um nome para a pasta.', 'error'); return false; }
          LibraryData.createFolder(name, type);
          renderFolders();
          close();
          showToast('Pasta criada!');
        },
      },
    ],
  });
}

function removeFolder(folderId) {
  if (!IS_OWN) return;
  confirmModal({
    title: 'Apagar pasta', message: 'Tem certeza que deseja apagar esta pasta?', confirmLabel: 'Apagar',
    onConfirm: () => {
      LibraryData.deleteFolder(folderId);
      if (OPEN_FOLDER_ID === folderId) {
        OPEN_FOLDER_ID = null;
        const detail = document.getElementById('folderDetail');
        if (detail) detail.style.display = 'none';
      }
      renderFolders();
      showToast('Pasta apagada.');
    },
  });
}

function openFolder(folderId) {
  OPEN_FOLDER_ID = folderId;
  const folder = LibraryData.getFolders().find((f) => f.id === folderId);
  const detail = document.getElementById('folderDetail');
  if (!folder || !detail) return;

  const allBooks = LibraryData.listUniqueBooks(SHELVES);
  const byId = new Map(allBooks.map((b) => [b.id, b]));
  const books = (folder.bookIds || []).map((id) => byId.get(id)).filter(Boolean);

  detail.style.display = 'block';
  detail.innerHTML = `
    <div class="folder-detail-head">
      <div>
        <h3 class="folder-detail-title">📂 ${escapeHtml(folder.name)}</h3>
        <p class="folder-detail-sub">${books.length} livro${books.length > 1 ? 's' : ''} nesta pasta</p>
      </div>
      <div class="folder-detail-actions">
        ${IS_OWN ? `<button class="bf-btn bf-btn-primary" style="font-size:12px;padding:8px 12px" onclick="addBookToFolderPrompt('${folder.id}')">+ Adicionar livro</button>` : ''}
        <button class="bf-btn bf-btn-ghost" style="font-size:12px;padding:8px 12px" onclick="closeFolder()">Fechar</button>
      </div>
    </div>
    <div class="folder-books">
      ${books.length ? books.map((book) => `
        <div class="folder-book-item">
          <span class="folder-book-emoji">${book.emoji || '📘'}</span>
          <span class="folder-book-meta">
            <span class="folder-book-title">${escapeHtml(book.titulo || 'Sem título')}</span>
            <span class="folder-book-author">${escapeHtml(book.autor || 'Autor desconhecido')}</span>
          </span>
          <div class="folder-book-row-actions">
            <button class="bf-btn bf-btn-ghost" style="font-size:11px;padding:6px 10px" onclick="goToBook(${book.id || 0})">Abrir</button>
            ${IS_OWN ? `<button class="bf-btn bf-btn-ghost" style="font-size:11px;padding:6px 10px" onclick="removeBookFromFolder(${book.id || 0}, '${folder.id}')">Remover</button>` : ''}
          </div>
        </div>`).join('') : `<div class="empty-shelf" style="padding:18px 8px"><div class="emoji">📂</div>Esta pasta está vazia.</div>`}
    </div>`;
}

function closeFolder() {
  OPEN_FOLDER_ID = null;
  const detail = document.getElementById('folderDetail');
  if (!detail) return;
  detail.style.display = 'none';
  detail.innerHTML = '';
}

function addBookToFolderPrompt(folderId) {
  if (!IS_OWN) return;
  const folder = LibraryData.getFolders().find((f) => f.id === folderId);
  if (!folder) return;
  const allBooks = LibraryData.listUniqueBooks(SHELVES);
  const available = allBooks.filter((b) => !folder.bookIds?.includes(b.id));
  if (!available.length) { showToast('Todos os livros já estão nesta pasta.', 'error'); return; }
  openModal({
    title: `Adicionar em ${folder.name}`, size: 'md',
    body: `
      <div style="display:flex;flex-direction:column;gap:8px;max-height:320px;overflow:auto">
        ${available.map((b) => `
          <button class="folder-book-item" onclick="confirmAddBookToFolder(${b.id || 0}, '${folder.id}')">
            <span class="folder-book-emoji">${b.emoji || '📘'}</span>
            <span class="folder-book-meta">
              <span class="folder-book-title">${escapeHtml(b.titulo || 'Sem título')}</span>
              <span class="folder-book-author">${escapeHtml(b.autor || 'Autor desconhecido')}</span>
            </span>
          </button>`).join('')}
      </div>`,
    buttons: [],
  });
}

function confirmAddBookToFolder(bookId, folderId) {
  LibraryData.addBookToFolder(bookId, folderId);
  document.getElementById('bf-modal-overlay')?.remove();
  openFolder(folderId);
  renderFolders();
  showToast('Livro adicionado na pasta!');
}

function removeBookFromFolder(bookId, folderId) {
  LibraryData.removeBookFromFolder(bookId, folderId);
  openFolder(folderId);
  renderFolders();
  showToast('Livro removido da pasta.');
}

function switchTab(key, btn) {
  document.querySelectorAll('.tab-pane').forEach((p) => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
  document.getElementById(`tab-${key}`).classList.add('active');
  btn.classList.add('active');
}

function triggerAvatarUpload() {
  if (!IS_OWN) return;
  document.getElementById('avatarInput').click();
}

function handleAvatarChange(e) {
  if (!IS_OWN) return;
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (ev) => {
    const src = ev.target.result;
    const previousAvatar = profileAvatarSrc;
    profileAvatarSrc = src;
    renderProfileHeader();
    try {
      const updatedUser = await saveProfileToBackend(profilePayload({ avatar: src }));
      user = normalizeProfileUser(updatedUser);
      profileAvatarSrc = user.avatar || src;
      renderProfileHeader();
      showToast('Foto atualizada!');
    } catch (err) {
      console.error(err);
      profileAvatarSrc = previousAvatar;
      renderProfileHeader();
      showToast('API não respondeu ao atualizar a foto.', 'error');
    }
  };
  reader.readAsDataURL(file);
}

function removeAvatar() {
  if (!IS_OWN) return;
  confirmModal({
    title: 'Remover foto', message: 'Tem certeza que deseja remover sua foto de perfil?', confirmLabel: 'Remover',
    onConfirm: async () => {
      const previousAvatar = profileAvatarSrc;
      profileAvatarSrc = '';
      renderProfileHeader();
      try {
        const updatedUser = await saveProfileToBackend(profilePayload({ avatar: '' }));
        user = normalizeProfileUser({ ...updatedUser, avatar: '', urlImagem: '' });
        renderProfileHeader();
        showToast('Foto removida.');
      } catch (err) {
        console.error(err);
        profileAvatarSrc = previousAvatar;
        renderProfileHeader();
        showToast('API não respondeu ao remover a foto.', 'error');
      }
    },
  });
}

function addToShelf(key) {
  if (!IS_OWN) return;
  openModal({
    title: '📚 Adicionar livro', size: 'md',
    body: `
      <div style="display:flex;flex-direction:column;gap:14px">
        <div>
          <label class="modal-label">Título *</label>
          <input id="add-titulo" class="bf-input" placeholder="Ex: Dom Casmurro" style="border-radius:var(--radius-md);border:1.5px solid var(--beige-dark)"/>
        </div>
        <div>
          <label class="modal-label">Autor</label>
          <input id="add-autor" class="bf-input" placeholder="Ex: Machado de Assis" style="border-radius:var(--radius-md);border:1.5px solid var(--beige-dark)"/>
        </div>
        <div>
          <label class="modal-label">Gênero</label>
          <select id="add-genero" class="bf-input" style="border-radius:var(--radius-md);border:1.5px solid var(--beige-dark)">
            ${GENRE_OPTIONS.map((g) => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join('')}
          </select>
        </div>
        ${key === 'lendo' ? `
        <div>
          <label class="modal-label">Total de páginas</label>
          <input id="add-total" class="bf-input" type="number" min="1" placeholder="Ex: 350" style="border-radius:var(--radius-md);border:1.5px solid var(--beige-dark)"/>
        </div>` : ''}
      </div>`,
    buttons: [
      { label: 'Cancelar', type: 'ghost' },
      { label: 'Adicionar', type: 'primary', closeOnClick: false, onClick: (close) => {
          const titulo = document.getElementById('add-titulo')?.value.trim();
          const autor  = document.getElementById('add-autor')?.value.trim() || '';
          const genero = document.getElementById('add-genero')?.value || 'Sem gênero';
          if (!titulo) { showToast('Título é obrigatório.', 'error'); return false; }
          const emojis = ['📘','📗','📕','📙','📓'];
          const emoji  = emojis[Math.floor(Math.random() * emojis.length)];
          const entry  = { id: Date.now(), titulo, autor, emoji, genero };
          if (key === 'lendo') {
            entry.pagina = 0;
            entry.total  = parseInt(document.getElementById('add-total')?.value) || null;
          }
          SHELVES[key].push(entry);
          LibraryData.setShelves(SHELVES);
          renderShelf(key);
          renderFolders();
          if (OPEN_FOLDER_ID) openFolder(OPEN_FOLDER_ID);
          updateStats();
          close();
          showToast('Livro adicionado!');
        },
      },
    ],
  });
}

function editProfile() {
  if (!IS_OWN) return;
  openModal({
    title: '✏️ Editar perfil', size: 'md',
    body: `
      <div style="display:flex;flex-direction:column;gap:14px">
        <div>
          <label class="modal-label">Username</label>
          <input id="edit-nome" class="bf-input" value="${escapeHtml(user.nome)}" style="border-radius:var(--radius-md);border:1.5px solid var(--beige-dark)"/>
        </div>
        <div>
          <label class="modal-label">Email</label>
          <input id="edit-email" class="bf-input" type="email" value="${escapeHtml(user.email)}" style="border-radius:var(--radius-md);border:1.5px solid var(--beige-dark)"/>
        </div>
        <div>
          <label class="modal-label">Biografia</label>
          <input id="edit-bio" class="bf-input" placeholder="Amante de ficção científica…" value="${escapeHtml(profileBio)}" style="border-radius:var(--radius-md);border:1.5px solid var(--beige-dark)"/>
        </div>
        <div>
          <label class="modal-label">URL da imagem</label>
          <input id="edit-url-imagem" class="bf-input" placeholder="https://..." value="${escapeHtml(profileAvatarSrc)}" style="border-radius:var(--radius-md);border:1.5px solid var(--beige-dark)"/>
        </div>
        <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--brown-mid)">
          <input id="edit-receber-spoilers" type="checkbox" ${user.receberSpoilers ? 'checked' : ''}/>
          Receber spoilers
        </label>
        <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--brown-mid)">
          <input id="edit-situacao" type="checkbox" ${user.situacao ? 'checked' : ''}/>
          Usuário ativo
        </label>
        <input id="edit-senha-hash" type="hidden" value="${escapeHtml(user.senhaHash || '')}"/>
        <input id="edit-criado-em"  type="hidden" value="${escapeHtml(user.criadoEm || new Date().toISOString())}"/>
      </div>`,
    buttons: [
      { label: 'Cancelar', type: 'ghost' },
      { label: 'Salvar', type: 'primary', closeOnClick: false, onClick: async (close) => {
          const nome  = document.getElementById('edit-nome')?.value.trim();
          if (!nome)  { showToast('Nome obrigatório.', 'error'); return false; }
          const email = document.getElementById('edit-email')?.value.trim();
          if (!email) { showToast('Email obrigatório para atualizar na API.', 'error'); return false; }
          const bio    = document.getElementById('edit-bio')?.value.trim();
          const avatar = document.getElementById('edit-url-imagem')?.value.trim();
          const senhaHash       = document.getElementById('edit-senha-hash')?.value || '';
          const receberSpoilers = document.getElementById('edit-receber-spoilers')?.checked ?? true;
          const situacao        = document.getElementById('edit-situacao')?.checked ?? true;
          const criadoEm        = document.getElementById('edit-criado-em')?.value || new Date().toISOString();
          try {
            const updatedUser = await saveProfileToBackend(profilePayload({
              nome, email, bio, avatar, senhaHash, receberSpoilers, situacao, criadoEm,
            }));
            user = normalizeProfileUser({ ...updatedUser, nome, email, bio, avatar, receberSpoilers, situacao, criadoEm });
            profileBio       = bio;
            profileAvatarSrc = user.avatar || avatar;
            renderProfileHeader();
            renderPosts();
            close();
            showToast('Perfil atualizado!');
          } catch (err) {
            console.error(err);
            showToast(err.message || 'Não foi possível atualizar o perfil.', 'error');
            return false;
          }
        },
      },
    ],
  });
}

function logout() {
  Auth.clear();
  window.location.href = 'index.html';
}

async function initProfilePage() {
  applyViewMode();
  renderProfileHeader();
  renderPosts();
  Object.keys(SHELVES).forEach(renderShelf);
  if (IS_OWN) LibraryData.setShelves(SHELVES);
  renderFolders();
  updateStats();

  try {
    await fetchProfileFromBackend();
    renderProfileHeader();
    renderPosts();
    updateStats();
  } catch (err) {
    console.warn('Perfil: usando dados locais.', err);
  }
}

initProfilePage();

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('themeToggleBtn');
  if (btn) renderThemeToggle(btn);
});
