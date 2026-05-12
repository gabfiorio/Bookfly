requireAuth();
const user = Auth.getUser() || { nome: 'Leitor', email: '' };
const avatarEl   = document.getElementById('profileAvatar');
const savedAvatar = localStorage.getItem('bf_avatar');
const savedBio    = localStorage.getItem('bf_bio') || '';

if (savedAvatar) {
  avatarEl.innerHTML = `<img src="${savedAvatar}" alt="avatar"/>`;
  document.getElementById('removeAvatarBtn').style.display = 'block'; // ← mostra o botão
}
else { avatarEl.textContent = initials(user.nome); }

document.getElementById('profileName').textContent  = user.nome;
document.getElementById('profileEmail').textContent = user.email;
document.getElementById('profileBio').textContent   = savedBio;

const SHELVES = {
  lidos:     [
    { titulo: 'Duna',   autor: 'F. Herbert',  emoji: '🏜️', id: 1 },
    { titulo: '1984',   autor: 'G. Orwell',   emoji: '👁️', id: 2 },
  ],
  lendo:     [ { titulo: 'Fundação', autor: 'I. Asimov',   emoji: '🌌', id: 3, pagina: 142, total: 255 } ],
  quererlev: [ { titulo: 'O Mestre e Margarida', autor: 'M. Bulgakov', emoji: '😈', id: 10 } ],
  avaliados: [
    { titulo: '1984', autor: 'G. Orwell',  emoji: '👁️', id: 2, stars: 5 },
    { titulo: 'Duna', autor: 'F. Herbert', emoji: '🏜️', id: 1, stars: 4 },
  ],
};

const MY_POSTS = [
  { id: 10, tempo: '2h',   texto: 'Começando Duna hoje! Muito animado 🏜️', livro: 'Duna', livroId: 1, stars: null },
  { id: 11, tempo: '1 dia',texto: 'Termino 1984 e fico com um gosto amargo na boca — no bom sentido.', livro: '1984', livroId: 2, stars: 5 },
];

function renderPosts() {
  const el = document.getElementById('myPosts');
  if (!MY_POSTS.length) {
    el.innerHTML = `<div class="empty-shelf"><div class="emoji">📝</div>Você ainda não fez nenhum post.</div>`;
    return;
  }
  el.innerHTML = MY_POSTS.map((p, i) => `
    <div class="post-card" style="animation-delay:${i*0.07}s">
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
    const coverId = `shelf-cover-${key}-${i}`;
    const progressBar = (key === 'lendo' && b.pagina != null && b.total) ? `
      <div class="progress-wrap">
        <div class="progress-bar">
          <div class="progress-fill" style="width:${Math.round((b.pagina/b.total)*100)}%"></div>
        </div>
        <span class="progress-label">${b.pagina}/${b.total} pág.</span>
        <button class="progress-edit-btn" onclick="editProgress(event,${i},'${key}')" title="Atualizar progresso">✏️</button>
      </div>` : '';
    return `
      <div class="shelf-book" style="animation-delay:${i*0.06}s" onclick="goToBook(${b.id||0})">
        <div class="shelf-cover" id="${coverId}">${b.emoji}</div>
        <div class="shelf-book-title">${escapeHtml(b.titulo)}</div>
        <div class="shelf-book-author">${escapeHtml(b.autor)}</div>
        ${b.stars ? `<div class="shelf-book-stars">${renderStars(b.stars)}</div>` : ''}
        ${progressBar}
      </div>`;
  }).join('');

  // Capas assíncronas
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
  e.stopPropagation();
  const book = SHELVES[key][idx];
  openModal({
    title: `📖 Progresso — ${book.titulo}`,
    size: 'sm',
    body: `
      <div style="display:flex;flex-direction:column;gap:16px">
        <label style="font-size:13px;font-weight:600;color:var(--brown-mid)">Página atual</label>
        <input id="modal-pagina" class="bf-input" type="number" min="0" max="${book.total||9999}"
               value="${book.pagina||0}"
               style="border-radius:var(--radius-md);border:1.5px solid var(--beige-dark)"/>
        ${book.total ? `<p style="font-size:12px;color:var(--brown-light)">${book.total} páginas no total</p>` : ''}
      </div>`,
    buttons: [
      { label: 'Cancelar', type: 'ghost' },
      { label: 'Salvar', type: 'primary', closeOnClick: false, onClick: (close) => {
          const val = parseInt(document.getElementById('modal-pagina')?.value);
          if (isNaN(val) || val < 0) { showToast('Número inválido.', 'error'); return false; }
          book.pagina = val;
          renderShelf(key);
          close();
          showToast('Progresso atualizado!');
        },
      },
    ],
  });
}

function updateStats() {
  document.getElementById('statLidos').textContent    = SHELVES.lidos.length;
  document.getElementById('statLendo').textContent    = SHELVES.lendo.length;
  document.getElementById('statQueremLer').textContent = SHELVES.quererlev.length;
}

function switchTab(key, btn) {
  document.querySelectorAll('.tab-pane').forEach(p  => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b   => b.classList.remove('active'));
  document.getElementById(`tab-${key}`).classList.add('active');
  btn.classList.add('active');
}

function triggerAvatarUpload() { document.getElementById('avatarInput').click(); }

function handleAvatarChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const src = ev.target.result;
    localStorage.setItem('bf_avatar', src);
    avatarEl.innerHTML = `<img src="${src}" alt="avatar"/>`;
    document.getElementById('removeAvatarBtn').style.display = 'block'; // ← mostra o botão
    showToast('Foto atualizada!');
  };
  reader.readAsDataURL(file);
}

// ── Remover foto de perfil ──
function removeAvatar() {
  confirmModal({
    title: 'Remover foto',
    message: 'Tem certeza que deseja remover sua foto de perfil?',
    confirmLabel: 'Remover',
    onConfirm: () => {
      localStorage.removeItem('bf_avatar');
      avatarEl.innerHTML = '';
      avatarEl.textContent = initials(user.nome);
      document.getElementById('removeAvatarBtn').style.display = 'none'; // ← esconde o botão
      showToast('Foto removida.');
    },
  });
}

// ── Adicionar livro com modal ──
function addToShelf(key) {
  openModal({
    title: '📚 Adicionar livro',
    size: 'md',
    body: `
      <div style="display:flex;flex-direction:column;gap:14px">
        <div>
          <label class="modal-label">Título *</label>
          <input id="add-titulo" class="bf-input" placeholder="Ex: Dom Casmurro"
                 style="border-radius:var(--radius-md);border:1.5px solid var(--beige-dark)"/>
        </div>
        <div>
          <label class="modal-label">Autor</label>
          <input id="add-autor" class="bf-input" placeholder="Ex: Machado de Assis"
                 style="border-radius:var(--radius-md);border:1.5px solid var(--beige-dark)"/>
        </div>
        ${key === 'lendo' ? `
        <div>
          <label class="modal-label">Total de páginas</label>
          <input id="add-total" class="bf-input" type="number" min="1" placeholder="Ex: 350"
                 style="border-radius:var(--radius-md);border:1.5px solid var(--beige-dark)"/>
        </div>` : ''}
      </div>`,
    buttons: [
      { label: 'Cancelar', type: 'ghost' },
      { label: 'Adicionar', type: 'primary', closeOnClick: false, onClick: (close) => {
          const titulo = document.getElementById('add-titulo')?.value.trim();
          const autor  = document.getElementById('add-autor')?.value.trim() || '';
          if (!titulo) { showToast('Título é obrigatório.', 'error'); return false; }
          const emojis = ['📘','📗','📕','📙','📓'];
          const emoji  = emojis[Math.floor(Math.random() * emojis.length)];
          const entry  = { titulo, autor, emoji };
          if (key === 'lendo') {
            entry.pagina = 0;
            entry.total  = parseInt(document.getElementById('add-total')?.value) || null;
          }
          SHELVES[key].push(entry);
          renderShelf(key);
          updateStats();
          close();
          showToast('Livro adicionado!');
        },
      },
    ],
  });
}

// ── Editar perfil com modal ──
function editProfile() {
  openModal({
    title: '✏️ Editar perfil',
    size: 'sm',
    body: `
      <div style="display:flex;flex-direction:column;gap:14px">
        <div>
          <label class="modal-label">Nome</label>
          <input id="edit-nome" class="bf-input" value="${escapeHtml(user.nome)}"
                 style="border-radius:var(--radius-md);border:1.5px solid var(--beige-dark)"/>
        </div>
        <div>
          <label class="modal-label">Bio <span style="font-weight:400;color:var(--brown-light)">(opcional)</span></label>
          <input id="edit-bio" class="bf-input" placeholder="Amante de ficção científica…"
                 value="${escapeHtml(localStorage.getItem('bf_bio') || '')}"
                 style="border-radius:var(--radius-md);border:1.5px solid var(--beige-dark)"/>
        </div>
      </div>`,
    buttons: [
      { label: 'Cancelar', type: 'ghost' },
      { label: 'Salvar', type: 'primary', closeOnClick: false, onClick: (close) => {
          const nome = document.getElementById('edit-nome')?.value.trim();
          if (!nome) { showToast('Nome obrigatório.', 'error'); return false; }
          const bio = document.getElementById('edit-bio')?.value.trim();
          user.nome = nome;
          Auth.setUser(user);
          localStorage.setItem('bf_bio', bio);
          document.getElementById('profileName').textContent = user.nome;
          document.getElementById('profileBio').textContent  = bio;
          if (!savedAvatar) avatarEl.textContent = initials(user.nome);
          close();
          showToast('Perfil atualizado!');
        },
      },
    ],
  });
}

function logout() { Auth.clear(); window.location.href = 'index.html'; }

renderPosts();
Object.keys(SHELVES).forEach(renderShelf);
updateStats();

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('themeToggleBtn');
  if (btn) renderThemeToggle(btn);
});
