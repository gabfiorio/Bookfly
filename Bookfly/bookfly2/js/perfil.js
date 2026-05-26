requireAuth();
const user = Auth.getUser() || { nome: 'Leitor', email: '' };
const avatarEl = document.getElementById('profileAvatar');
const savedAvatar = localStorage.getItem('bf_avatar');
const savedBio = localStorage.getItem('bf_bio') || '';

if (savedAvatar) {
  avatarEl.innerHTML = `<img src="${savedAvatar}" alt="avatar"/>`;
  document.getElementById('removeAvatarBtn').style.display = 'block';
} else {
  avatarEl.textContent = initials(user.nome);
}

document.getElementById('profileName').textContent = user.nome;
document.getElementById('profileEmail').textContent = user.email;
document.getElementById('profileBio').textContent = savedBio;

let SHELVES = LibraryData.getShelves();
const GENRE_OPTIONS = [
  'Romance', 'Fantasia', 'Distopia', 'Terror', 'Ficção Científica',
  'Suspense', 'Biografia', 'Não ficção', 'Outro',
];

let FOLDER_MODE = 'todas';
let OPEN_FOLDER_ID = null;

const MY_POSTS = [
  { id: 10, tempo: '2h', texto: 'Começando Duna hoje! Muito animado 🏜️', livro: 'Duna', livroId: 1, stars: null },
  { id: 11, tempo: '1 dia', texto: 'Termino 1984 e fico com um gosto amargo na boca — no bom sentido.', livro: '1984', livroId: 2, stars: 5 },
];

function renderPosts() {
  const el = document.getElementById('myPosts');
  if (!MY_POSTS.length) {
    el.innerHTML = `<div class="empty-shelf"><div class="emoji">📝</div>Você ainda não fez nenhum post.</div>`;
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
  const el = document.getElementById(`shelf-${key}`);
  if (!books.length) {
    el.innerHTML = `<div class="empty-shelf" style="grid-column:1/-1"><div class="emoji">📚</div>Nenhum livro aqui ainda.</div>`;
    return;
  }

  el.innerHTML = books.map((b, i) => {
    const coverId = `shelf-cover-${key}-${i}`;
    const progressBar = (key === 'lendo' && b.pagina != null && b.total) ? `
      <div class="progress-wrap">
        <div class="progress-bar"><div class="progress-fill" style="width:${Math.round((b.pagina / b.total) * 100)}%"></div></div>
        <span class="progress-label">${b.pagina}/${b.total} pág.</span>
        <button class="progress-edit-btn" onclick="editProgress(event,${i},'${key}')" title="Atualizar progresso">✏️</button>
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
    b.titulo,
    b.autor,
    b.emoji,
    { width: 60, height: 86, radius: 5, fontSize: 28 }
  ));
}

function goToBook(id) {
  if (id) window.location.href = `livro.html?id=${id}`;
}

function editProgress(e, idx, key) {
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
      {
        label: 'Salvar', type: 'primary', closeOnClick: false, onClick: (close) => {
          const val = parseInt(document.getElementById('modal-pagina')?.value);
          if (isNaN(val) || val < 0) {
            showToast('Número inválido.', 'error');
            return false;
          }
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
  document.getElementById('statLidos').textContent = SHELVES.lidos.length;
  document.getElementById('statLendo').textContent = SHELVES.lendo.length;
  document.getElementById('statQueremLer').textContent = SHELVES.quererlev.length;
}

function renderFolders() {
  const grid = document.getElementById('foldersGrid');
  if (!grid) return;

  const allFolders = LibraryData.getFolders();
  const folders = allFolders
    .filter((f) => (FOLDER_MODE === 'todas' ? true : f.type === FOLDER_MODE))
    .sort((a, b) => String(a.name).localeCompare(String(b.name), 'pt-BR'));

  const allBooks = LibraryData.listUniqueBooks(SHELVES);
  const byId = new Map(allBooks.map((b) => [b.id, b]));

  if (!folders.length) {
    grid.innerHTML = `
      <div class="empty-shelf" style="grid-column:1/-1">
        <div class="emoji">🗂️</div>
        Nenhuma pasta criada para este filtro.
      </div>`;
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
          <button class="bf-btn bf-btn-ghost" style="font-size:12px;padding:7px 12px" onclick="removeFolder('${folder.id}')">Apagar</button>
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
  openModal({
    title: '🗂️ Nova pasta',
    size: 'sm',
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
      {
        label: 'Criar', type: 'primary', closeOnClick: false, onClick: (close) => {
          const name = document.getElementById('folder-name')?.value.trim();
          const type = document.getElementById('folder-type')?.value || 'genero';
          if (!name) {
            showToast('Digite um nome para a pasta.', 'error');
            return false;
          }
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
  confirmModal({
    title: 'Apagar pasta',
    message: 'Tem certeza que deseja apagar esta pasta?',
    confirmLabel: 'Apagar',
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
        <button class="bf-btn bf-btn-primary" style="font-size:12px;padding:8px 12px" onclick="addBookToFolderPrompt('${folder.id}')">+ Adicionar livro</button>
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
            <button class="bf-btn bf-btn-ghost" style="font-size:11px;padding:6px 10px" onclick="removeBookFromFolder(${book.id || 0}, '${folder.id}')">Remover</button>
          </div>
        </div>
      `).join('') : `
        <div class="empty-shelf" style="padding:18px 8px">
          <div class="emoji">📂</div>
          Esta pasta está vazia.
        </div>`}
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
  const folder = LibraryData.getFolders().find((f) => f.id === folderId);
  if (!folder) return;

  const allBooks = LibraryData.listUniqueBooks(SHELVES);
  const available = allBooks.filter((b) => !folder.bookIds?.includes(b.id));

  if (!available.length) {
    showToast('Todos os livros já estão nesta pasta.', 'error');
    return;
  }

  openModal({
    title: `Adicionar em ${folder.name}`,
    size: 'md',
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
  document.getElementById('avatarInput').click();
}

function handleAvatarChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const src = ev.target.result;
    localStorage.setItem('bf_avatar', src);
    avatarEl.innerHTML = `<img src="${src}" alt="avatar"/>`;
    document.getElementById('removeAvatarBtn').style.display = 'block';
    showToast('Foto atualizada!');
  };
  reader.readAsDataURL(file);
}

function removeAvatar() {
  confirmModal({
    title: 'Remover foto',
    message: 'Tem certeza que deseja remover sua foto de perfil?',
    confirmLabel: 'Remover',
    onConfirm: () => {
      localStorage.removeItem('bf_avatar');
      avatarEl.innerHTML = '';
      avatarEl.textContent = initials(user.nome);
      document.getElementById('removeAvatarBtn').style.display = 'none';
      showToast('Foto removida.');
    },
  });
}

function addToShelf(key) {
  openModal({
    title: '📚 Adicionar livro',
    size: 'md',
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
      {
        label: 'Adicionar', type: 'primary', closeOnClick: false, onClick: (close) => {
          const titulo = document.getElementById('add-titulo')?.value.trim();
          const autor = document.getElementById('add-autor')?.value.trim() || '';
          const genero = document.getElementById('add-genero')?.value || 'Sem gênero';
          if (!titulo) {
            showToast('Título é obrigatório.', 'error');
            return false;
          }
          const emojis = ['📘', '📗', '📕', '📙', '📓'];
          const emoji = emojis[Math.floor(Math.random() * emojis.length)];
          const entry = { id: Date.now(), titulo, autor, emoji, genero };
          if (key === 'lendo') {
            entry.pagina = 0;
            entry.total = parseInt(document.getElementById('add-total')?.value) || null;
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
  openModal({
    title: '✏️ Editar perfil',
    size: 'sm',
    body: `
      <div style="display:flex;flex-direction:column;gap:14px">
        <div>
          <label class="modal-label">Nome</label>
          <input id="edit-nome" class="bf-input" value="${escapeHtml(user.nome)}" style="border-radius:var(--radius-md);border:1.5px solid var(--beige-dark)"/>
        </div>
        <div>
          <label class="modal-label">Bio <span style="font-weight:400;color:var(--brown-light)">(opcional)</span></label>
          <input id="edit-bio" class="bf-input" placeholder="Amante de ficção científica…" value="${escapeHtml(localStorage.getItem('bf_bio') || '')}" style="border-radius:var(--radius-md);border:1.5px solid var(--beige-dark)"/>
        </div>
      </div>`,
    buttons: [
      { label: 'Cancelar', type: 'ghost' },
      {
        label: 'Salvar', type: 'primary', closeOnClick: false, onClick: (close) => {
          const nome = document.getElementById('edit-nome')?.value.trim();
          if (!nome) {
            showToast('Nome obrigatório.', 'error');
            return false;
          }
          const bio = document.getElementById('edit-bio')?.value.trim();
          user.nome = nome;
          Auth.setUser(user);
          localStorage.setItem('bf_bio', bio);
          document.getElementById('profileName').textContent = user.nome;
          document.getElementById('profileBio').textContent = bio;
          if (!savedAvatar) avatarEl.textContent = initials(user.nome);
          close();
          showToast('Perfil atualizado!');
        },
      },
    ],
  });
}

function logout() {
  Auth.clear();
  window.location.href = 'index.html';
}

renderPosts();
Object.keys(SHELVES).forEach(renderShelf);
LibraryData.setShelves(SHELVES);
renderFolders();
updateStats();

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('themeToggleBtn');
  if (btn) renderThemeToggle(btn);
});
