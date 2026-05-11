requireAuth();

const user = Auth.getUser() || { nome: 'Leitor', email: '' };
const savedAvatar = localStorage.getItem('bf_avatar');

// Nav avatar
const navAvatarEl = document.getElementById('navAvatar');
if (savedAvatar) {
  navAvatarEl.innerHTML = `<img src="${savedAvatar}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`;
} else {
  navAvatarEl.textContent = initials(user.nome);
}

// Composer avatar
const composerAvatarEl = document.getElementById('composerAvatar');
if (savedAvatar) {
  composerAvatarEl.innerHTML = `<img src="${savedAvatar}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`;
} else {
  composerAvatarEl.textContent = initials(user.nome);
}

const AVATAR_COLORS = ['#8681BD','#F7A8B8','#F2956A','#A8D5BA','#F5D97E','#b0acda'];

const MOCK_USERS = [
  { id: 2, nome: 'Maria Oliveira', livros: 48, cor: AVATAR_COLORS[1] },
  { id: 3, nome: 'João Silva',     livros: 31, cor: AVATAR_COLORS[2] },
  { id: 4, nome: 'Ana Costa',      livros: 72, cor: AVATAR_COLORS[3] },
];

const MOCK_TRENDING = [
  { id: 1, titulo: 'Duna',         autor: 'Frank Herbert', nota: 4.8, emoji: '🏜️' },
  { id: 2, titulo: 'O Alquimista', autor: 'Paulo Coelho',  nota: 4.6, emoji: '✨' },
];

const ALL_MOCK_POSTS = [
  { id: 1,  nome: 'Maria Oliveira', cor: AVATAR_COLORS[1], tempo: '2min',  texto: 'Acabei de terminar Duna e estou completamente apaixonada! A construção do mundo é incrível 🏜️', livro: 'Duna',     livroId: 1, stars: 5,    curtidas: 14, comentarios: [] },
  { id: 2,  nome: 'João Silva',     cor: AVATAR_COLORS[2], tempo: '15min', texto: 'Alguém mais acha que a trilogia Fundação é ainda mais épica que o hype? Estou no segundo livro e mal consigo parar.', livro: 'Fundação', livroId: 3, stars: null, curtidas: 7,  comentarios: [] },
  { id: 3,  nome: 'Ana Costa',      cor: AVATAR_COLORS[3], tempo: '1h',    texto: '1984 continua perturbadoramente atual. Releitura bate diferente.', livro: '1984',     livroId: 2, stars: 5,    curtidas: 23, comentarios: [
    { id: 100, nome: 'Maria Oliveira', cor: AVATAR_COLORS[1], texto: 'Concordo demais! Terminei semana passada.', tempo: '45min' }
  ]},
  { id: 4,  nome: 'Pedro Mendes',   cor: AVATAR_COLORS[0], tempo: '2h',    texto: 'Começando O Senhor dos Anéis pela primeira vez. Desejo-me sorte com o vocabulário do Tolkien 😅', livro: null, livroId: null, stars: null, curtidas: 5, comentarios: [] },
  { id: 5,  nome: 'Ana Costa',      cor: AVATAR_COLORS[3], tempo: '3h',    texto: 'Dica: se você gostou de Sapiens, leia também "21 Lições para o Século 21". A sequência faz ainda mais sentido hoje.', livro: 'Sapiens', livroId: 9, stars: 4, curtidas: 19, comentarios: [] },
  { id: 6,  nome: 'João Silva',     cor: AVATAR_COLORS[2], tempo: '5h',    texto: 'Crime e Castigo é uma montanha-russa emocional. Não consigo parar de pensar no Raskólnikov.', livro: 'Crime e Castigo', livroId: 5, stars: 5, curtidas: 11, comentarios: [] },
];

let page = 1;
const BATCH = 4;
const liked = new Set();

function renderPost(p) {
  const hasLike = liked.has(p.id);
  const commentsHtml = p.comentarios.length ? `
    <div class="comments-section" id="comments-${p.id}">
      ${p.comentarios.map(c => renderComment(c)).join('')}
    </div>` : `<div class="comments-section" id="comments-${p.id}" style="display:none"></div>`;

  return `
    <div class="post-card" id="post-${p.id}">
      <div class="post-header">
        <div class="post-avatar" style="background:${p.cor}">${initials(p.nome)}</div>
        <div class="post-meta">
          <div class="post-name">${escapeHtml(p.nome)}</div>
          <div class="post-time">há ${p.tempo}</div>
        </div>
      </div>
      <div class="post-body">${escapeHtml(p.texto)}</div>
      ${p.stars ? `<div class="post-stars">${renderStars(p.stars)}</div>` : ''}
      ${p.livro ? `<a class="post-book-tag" href="livro.html?id=${p.livroId||''}" title="Ver livro">📚 ${escapeHtml(p.livro)}</a>` : ''}
      <div class="post-actions">
        <button class="post-action ${hasLike?'liked':''}" onclick="toggleLike(${p.id}, this)">
          ${hasLike?'♥':'♡'} <span class="like-count">${p.curtidas + (hasLike?1:0)}</span>
        </button>
        <button class="post-action" onclick="toggleCommentBox(${p.id})">
          💬 <span>${p.comentarios.length}</span>
        </button>
        <button class="post-action" onclick="sharePost(${p.id})">↗ Compartilhar</button>
      </div>
      ${commentsHtml}
      <div class="comment-composer" id="comment-composer-${p.id}" style="display:none">
        <div class="comment-composer-inner">
          <div class="comment-avatar" style="background:${AVATAR_COLORS[0]}">${initials(user.nome)}</div>
          <input class="comment-input" id="comment-input-${p.id}"
                 placeholder="Escreva um comentário…" maxlength="300"
                 onkeydown="handleCommentKey(event, ${p.id})"/>
          <button class="comment-send" onclick="sendComment(${p.id})">↵</button>
        </div>
      </div>
    </div>`;
}

function renderComment(c) {
  return `
    <div class="comment-item">
      <div class="comment-avatar" style="background:${c.cor}">${initials(c.nome)}</div>
      <div class="comment-bubble">
        <span class="comment-name">${escapeHtml(c.nome)}</span>
        <span class="comment-text">${escapeHtml(c.texto)}</span>
        <span class="comment-time">há ${c.tempo}</span>
      </div>
    </div>`;
}

function toggleCommentBox(id) {
  const section  = document.getElementById(`comments-${id}`);
  const composer = document.getElementById(`comment-composer-${id}`);
  const isOpen   = composer.style.display !== 'none';

  if (isOpen) {
    composer.style.display = 'none';
  } else {
    composer.style.display = 'block';
    section.style.display  = 'block';
    document.getElementById(`comment-input-${id}`)?.focus();
  }
}

function handleCommentKey(e, id) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendComment(id); }
}

function sendComment(postId) {
  const input = document.getElementById(`comment-input-${postId}`);
  const text  = input?.value.trim();
  if (!text) return;

  const post = ALL_MOCK_POSTS.find(p => p.id === postId);
  const newComment = { id: Date.now(), nome: user.nome, cor: AVATAR_COLORS[0], texto: text, tempo: 'agora' };

  if (post) post.comentarios.push(newComment);

  const section = document.getElementById(`comments-${postId}`);
  const div = document.createElement('div');
  div.innerHTML = renderComment(newComment);
  div.firstElementChild.style.animation = 'fadeUp 0.3s ease both';
  section.appendChild(div.firstElementChild);
  section.style.display = 'block';

  // Atualiza contagem
  const btn = document.querySelector(`#post-${postId} .post-action:nth-child(2) span`);
  if (btn && post) btn.textContent = post.comentarios.length;

  input.value = '';
  showToast('Comentário publicado!');
}

function renderFeed(posts) {
  const container = document.getElementById('feedContainer');
  posts.forEach((p, i) => {
    const div = document.createElement('div');
    div.innerHTML = renderPost(p);
    const card = div.firstElementChild;
    card.style.animationDelay = `${i * 0.07}s`;
    container.appendChild(card);
  });
}

function loadMore() {
  const btn = document.getElementById('loadMoreBtn');
  btn.classList.add('loading'); btn.textContent = 'Carregando…';
  setTimeout(() => {
    const start = page * BATCH;
    const slice = ALL_MOCK_POSTS.slice(start, start + BATCH);
    if (!slice.length) {
      btn.textContent = 'Nada mais por aqui 🎉';
      btn.disabled = true; btn.classList.remove('loading'); return;
    }
    renderFeed(slice);
    page++;
    btn.classList.remove('loading'); btn.textContent = 'Carregar mais';
  }, 700);
}

function toggleLike(id, btn) {
  const post = ALL_MOCK_POSTS.find(p => p.id === id);
  if (!post) return;
  const countEl = btn.querySelector('.like-count');
  if (liked.has(id)) {
    liked.delete(id);
    btn.classList.remove('liked');
    btn.innerHTML = `♡ <span class="like-count">${post.curtidas}</span>`;
  } else {
    liked.add(id);
    btn.classList.add('liked');
    btn.innerHTML = `♥ <span class="like-count">${post.curtidas + 1}</span>`;
  }
}

function sharePost(id) {
  navigator.clipboard?.writeText(`${window.location.origin}/post.html?id=${id}`)
    .then(() => showToast('Link copiado!'));
}

// ── Composer com modal de seleção de livro ──
const MOCK_BOOKS_SEARCH = [
  { id:1,  titulo:'Duna',                 autor:'Frank Herbert',      emoji:'🏜️' },
  { id:2,  titulo:'1984',                 autor:'George Orwell',      emoji:'👁️' },
  { id:3,  titulo:'Fundação',             autor:'Isaac Asimov',       emoji:'🌌' },
  { id:4,  titulo:'O Alquimista',         autor:'Paulo Coelho',       emoji:'✨' },
  { id:5,  titulo:'Crime e Castigo',      autor:'Fiódor Dostoiévski', emoji:'⚖️' },
  { id:6,  titulo:'O Senhor dos Anéis',   autor:'J.R.R. Tolkien',     emoji:'💍' },
  { id:7,  titulo:'Harry Potter',         autor:'J.K. Rowling',       emoji:'⚡' },
  { id:8,  titulo:'Sapiens',              autor:'Yuval Noah Harari',  emoji:'🧠' },
  { id:9,  titulo:'O Mestre e Margarida', autor:'Mikhail Bulgakov',   emoji:'😈' },
];

let taggedBook = null;

function tagBook() {
  const body = `
    <input id="modal-book-search" class="bf-input" placeholder="Buscar livro…"
           style="border-radius:var(--radius-md);border:1.5px solid var(--beige-dark);margin-bottom:12px"
           oninput="filterModalBooks(this.value)"/>
    <div id="modal-book-list" class="modal-book-list">
      ${MOCK_BOOKS_SEARCH.map(b => `
        <div class="modal-book-item" onclick="selectTagBook(${b.id},'${escapeHtml(b.titulo)}')">
          <span class="modal-book-emoji">${b.emoji}</span>
          <div><div style="font-weight:600;font-size:13px">${escapeHtml(b.titulo)}</div>
          <div style="font-size:11.5px;color:var(--brown-light)">${escapeHtml(b.autor)}</div></div>
        </div>`).join('')}
    </div>`;

  openModal({
    title: '📚 Marcar livro no post',
    body,
    size: 'sm',
    buttons: [],
  });

  setTimeout(() => document.getElementById('modal-book-search')?.focus(), 150);
}

function filterModalBooks(q) {
  const filtered = q.length < 1
    ? MOCK_BOOKS_SEARCH
    : MOCK_BOOKS_SEARCH.filter(b => b.titulo.toLowerCase().includes(q.toLowerCase()) || b.autor.toLowerCase().includes(q.toLowerCase()));
  document.getElementById('modal-book-list').innerHTML = filtered.length
    ? filtered.map(b => `
        <div class="modal-book-item" onclick="selectTagBook(${b.id},'${escapeHtml(b.titulo)}')">
          <span class="modal-book-emoji">${b.emoji}</span>
          <div><div style="font-weight:600;font-size:13px">${escapeHtml(b.titulo)}</div>
          <div style="font-size:11.5px;color:var(--brown-light)">${escapeHtml(b.autor)}</div></div>
        </div>`).join('')
    : '<p style="text-align:center;color:var(--brown-light);font-size:13px;padding:16px 0">Nenhum livro encontrado</p>';
}

function selectTagBook(id, titulo) {
  taggedBook = { id, titulo };
  document.getElementById('bf-modal-overlay')?.remove();
  const btn = document.querySelector('.composer-book-tag');
  btn.textContent = `📚 ${titulo}`;
  btn.style.background = 'var(--purple-light)';
  btn.style.color = 'var(--purple-deeper)';
  showToast(`"${titulo}" marcado no post`);
}

function publishPost() {
  const text = document.getElementById('postText').value.trim();
  if (!text) { showToast('Escreva algo antes de publicar!', 'error'); return; }
  const newPost = {
    id: Date.now(), nome: user.nome, cor: AVATAR_COLORS[0], tempo: 'agora',
    texto: text, livro: taggedBook?.titulo || null, livroId: taggedBook?.id || null,
    stars: null, curtidas: 0, comentarios: [],
  };
  ALL_MOCK_POSTS.unshift(newPost);
  const container = document.getElementById('feedContainer');
  const div = document.createElement('div');
  div.innerHTML = renderPost(newPost);
  container.insertBefore(div.firstElementChild, container.firstElementChild);
  document.getElementById('postText').value = '';
  document.getElementById('charCount').textContent = '0/500';
  taggedBook = null;
  const btn = document.querySelector('.composer-book-tag');
  btn.textContent = '📚 Marcar livro'; btn.style.background=''; btn.style.color='';
  showToast('Post publicado!');
}

document.getElementById('postText').addEventListener('input', function () {
  document.getElementById('charCount').textContent = `${this.value.length}/500`;
});

function renderSuggested() {
  document.getElementById('suggestedUsers').innerHTML = MOCK_USERS.map(u => `
    <div class="suggested-user">
      <div class="sug-avatar" style="background:${u.cor}">${initials(u.nome)}</div>
      <div class="sug-info">
        <div class="sug-name">${escapeHtml(u.nome)}</div>
        <div class="sug-books">${u.livros} livros</div>
      </div>
      <button class="sug-follow" id="follow-${u.id}" onclick="followUser(${u.id}, this)">Seguir</button>
    </div>`).join('');
}

function followUser(id, btn) {
  const isF = btn.classList.contains('following');
  btn.classList.toggle('following', !isF);
  btn.textContent = isF ? 'Seguir' : 'Seguindo';
  showToast(isF ? 'Você deixou de seguir.' : 'Seguindo!');
}

function renderTrending() {
  document.getElementById('trendingBooks').innerHTML = MOCK_TRENDING.map(b => `
    <a class="trending-book" href="livro.html?id=${b.id}" style="text-decoration:none;color:inherit">
      <div class="book-cover">${b.emoji}</div>
      <div class="book-info">
        <div class="book-title">${escapeHtml(b.titulo)}</div>
        <div class="book-author">${escapeHtml(b.autor)}</div>
        <div class="book-rating">★ ${b.nota}</div>
      </div>
    </a>`).join('');
}

function logout() { Auth.clear(); window.location.href = 'index.html'; }

function renderChallengeSidebar() {
  const el = document.getElementById('sidebarChallenge');
  if (!el) return;
  const YEAR = new Date().getFullYear();
  let state = {};
  try { state = JSON.parse(localStorage.getItem('bf_desafio')) || {}; } catch {}
  const { meta = 12, livros = [] } = state[YEAR] || {};
  const lidos = livros.length;
  const pct   = Math.min(100, Math.round((lidos / meta) * 100));

  const circ  = 2 * Math.PI * 22;
  const dash  = circ * (1 - pct / 100);

  el.innerHTML = `
    <div class="sc-mini-ring-wrap">
      <svg class="sc-mini-ring" width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r="22" fill="none" stroke="var(--beige-dark)" stroke-width="5"/>
        <circle cx="28" cy="28" r="22" fill="none" stroke="var(--purple)" stroke-width="5"
                stroke-linecap="round"
                stroke-dasharray="${circ}" stroke-dashoffset="${dash}"
                transform="rotate(-90 28 28)"
                style="transition:stroke-dashoffset 1s ease"/>
      </svg>
      <div class="sc-mini-info">
        <div class="sc-mini-nums">${lidos} <span style="font-size:13px;font-weight:400;color:var(--brown-light)">/ ${meta}</span></div>
        <div class="sc-mini-label">livros em ${YEAR}</div>
      </div>
    </div>
    <div class="sc-bar"><div class="sc-bar-fill" style="width:${pct}%"></div></div>`;
}

renderFeed(ALL_MOCK_POSTS.slice(0, BATCH));
renderSuggested();
renderTrending();
renderChallengeSidebar();

// Init theme toggle icon
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('themeToggleBtn');
  if (btn) renderThemeToggle(btn);
});
