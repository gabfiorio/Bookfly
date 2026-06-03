if (!Auth.isLogged()) {
  window.location.href = 'login.html';
}

async function handleLivro() {
  const titulo = document.getElementById('titulo')?.value.trim();
  const url_imagem = document.getElementById('url_imagem')?.value.trim();
  const categoria = document.getElementById('categoria')?.value.trim();
  const autor = document.getElementById('autor')?.value.trim();
  const ano = document.getElementById('ano')?.value.trim();
  const paginas = document.getElementById('paginas')?.value.trim();
  const editora = document.getElementById('editora')?.value.trim();
  const isbn = document.getElementById('isbn')?.value.trim();
  const sinopse = document.getElementById('sinopse')?.value.trim();


  const alertEl = document.getElementById('alertMsg');
  const btn = document.getElementById('submitBtn');
  const txt = document.getElementById('btnText');
  const spin = document.getElementById('spinner');

}


const AVATAR_COLORS = ['#8681BD', '#F7A8B8', '#F2956A', '#A8D5BA', '#F5D97E', '#b0acda'];

const params = new URLSearchParams(window.location.search);
const bookId = parseInt(params.get('id')) || 1;
let book = null;
let SHELVES = LibraryData.getShelves();
const SHELF_STATUS = ['Nenhuma', 'Quero ler', 'Lendo', 'Lido'];
let userStatus = 0; // índice no array acima
let REVIEW_STARS = 5;

initBookPage();

async function initBookPage() {
  const loadingState = document.getElementById('bookLoadingState');

  try {
    book = await fetchBookById(bookId);
  } catch (err) {
    console.warn('Livro: fallback sem dados da API.', err);
    book = null;
  }

  if (!book) {
    loadingState?.remove();
    document.getElementById('pageWrap').innerHTML = `
      <div style="text-align:center;padding:80px 20px">
        <div style="font-size:48px;margin-bottom:16px">📚</div>
        <h2 style="font-family:var(--font-display)">Livro não encontrado</h2>
        <a href="home.html" class="bf-btn bf-btn-primary" style="margin-top:24px;display:inline-flex">← Voltar ao feed</a>
      </div>`;
    return;
  }

  loadingState?.remove();
  renderBook();
}

function shelfBookPayload() {
  const coverUrl = book.urlImagem || book.url_imagem || '';

  return {
    id: bookId,
    titulo: book.titulo,
    categoria: book.categoria,
    urlImagem: coverUrl,
    autor: book.autor,
    emoji: book.emoji,
    genero: book.genero,
    stars: null,
  };
}

function removeBookFromAllShelves() {
  Object.keys(SHELVES).forEach((key) => {
    SHELVES[key] = (SHELVES[key] || []).filter((b) => b.id !== bookId);
  });
}

function applyStatusToShelves(statusIdx) {
  removeBookFromAllShelves();
  const payload = shelfBookPayload();

  if (statusIdx === 1) SHELVES.quererlev.push(payload);
  if (statusIdx === 2) SHELVES.lendo.push({ ...payload, pagina: 0, total: book.paginas || null });
  if (statusIdx === 3) SHELVES.lidos.push(payload);

  LibraryData.setShelves(SHELVES);
}

function syncStatusFromShelves() {
  SHELVES = LibraryData.getShelves();
  if ((SHELVES.lidos || []).some((b) => b.id === bookId)) userStatus = 3;
  else if ((SHELVES.lendo || []).some((b) => b.id === bookId)) userStatus = 2;
  else if ((SHELVES.quererlev || []).some((b) => b.id === bookId)) userStatus = 1;
  else userStatus = 0;
}

function renderBook() {
  document.title = `Bookfly — ${book.titulo}`;
  syncStatusFromShelves();

  const coverUrl = book.urlImagem || book.url_imagem || '';
  const fallbackCover = book.emoji || '📚';
  const coverOptions = { width: 120, height: 174, radius: 10, fontSize: 64 };
  document.getElementById('heroCover').innerHTML = coverHtml(coverUrl, fallbackCover, coverOptions);
  document.getElementById('heroTitle').textContent = book.titulo;
  document.getElementById('heroAuthor').textContent = `${book.autor} · ${book.ano}`;
  document.getElementById('heroMeta').textContent = `${book.paginas || 0} páginas · ${book.editora || 'Editora não informada'}`;
  document.getElementById('heroGenre').textContent = book.genero;
  document.getElementById('heroDesc').innerHTML = renderExpandableText(
    book.desc || book.sinopse || 'Sem sinopse disponível.',
    `book-desc-${bookId}`,
    420
  );

  if (!coverUrl) {
    applyCover(document.getElementById('heroCover'), book.titulo, book.autor, fallbackCover, coverOptions);
  }

  // Rating
  const starsRounded = Math.round(book.mediaGlobal || 0);
  document.getElementById('heroRating').innerHTML = `
    <span class="hero-stars">${renderStars(starsRounded)}</span>
    <span class="hero-avg">${book.mediaGlobal || 0}</span>
    <span class="hero-total">(${(book.totalAvaliacoes || 0).toLocaleString('pt-BR')} avaliações)</span>`;

  renderShelfActions();
  renderReviews();
  renderReaders();
  renderDetails();
}

function renderShelfActions() {
  document.getElementById('heroActions').innerHTML = `
    <div class="shelf-actions">
      <div class="shelf-status-wrap">
        <button class="shelf-status-btn" id="shelfStatusBtn" onclick="cycleStatus()">
          ${shelfStatusIcon()} ${SHELF_STATUS[userStatus] === 'Nenhuma' ? 'Adicionar à estante' : SHELF_STATUS[userStatus]}
        </button>
        <button class="shelf-status-arrow" onclick="openStatusMenu()" aria-label="Mudar status">▾</button>
      </div>
      <button class="bf-btn bf-btn-ghost shelf-action-btn" onclick="addBookToFolder()">🗂️ Adicionar à pasta</button>
    </div>`;
}

function shelfStatusIcon() {
  return ['📌', '🔖', '📖', '✅'][userStatus];
}

function cycleStatus() {
  userStatus = (userStatus + 1) % SHELF_STATUS.length;
  applyStatusToShelves(userStatus);
  renderShelfActions();
  showToast(userStatus === 0 ? 'Removido da estante' : `Marcado como: ${SHELF_STATUS[userStatus]}`);
}

function openStatusMenu() {
  openModal({
    title: '📚 Adicionar à estante',
    size: 'sm',
    body: SHELF_STATUS.map((s, i) => `
      <div class="status-menu-item ${i === userStatus ? 'active' : ''}" onclick="setStatus(${i})">
        <span>${['📌', '🔖', '📖', '✅'][i]}</span> ${s}
        ${i === userStatus ? '<span class="status-check">✓</span>' : ''}
      </div>`).join(''),
    buttons: [],
  });
}

function setStatus(idx) {
  userStatus = idx;
  applyStatusToShelves(idx);
  document.getElementById('bf-modal-overlay')?.remove();
  renderShelfActions();
  showToast(idx === 0 ? 'Removido da estante' : `Marcado como: ${SHELF_STATUS[idx]}`);
}

/*function addBookToFolder() {
  const folders = LibraryData.getFolders();
  if (!folders.length) {
    showToast('Crie uma pasta no Perfil primeiro.', 'error');
    return;
  }

  openModal({
    title: '🗂️ Adicionar livro à pasta',
    size: 'sm',
    body: `
      <div style="display:flex;flex-direction:column;gap:8px">
        ${folders.map((f) => `
          <button class="status-menu-item" onclick="confirmAddBookToFolder('${f.id}')">
            <span>${f.type === 'autor' ? '✍️' : '📚'}</span>
            ${escapeHtml(f.name)}
          </button>`).join('')}
      </div>`,
    buttons: [],
  });
} */

function confirmAddBookToFolder(folderId) {
  const ok = LibraryData.addBookToFolder(bookId, folderId);
  document.getElementById('bf-modal-overlay')?.remove();
  if (!ok) {
    showToast('Não foi possível adicionar à pasta.', 'error');
    return;
  }
  showToast('Livro adicionado à pasta!');
}

function getCommunityReviews() {
  return LibraryData.getBookComments(bookId).map((r) => ({ ...r, source: 'custom' }));
}

function submitBookComment() {
  const input = document.getElementById('newReviewText');
  const text = input?.value.trim();
  const stars = REVIEW_STARS;
  if (!text) {
    showToast('Escreva um comentário antes de publicar.', 'error');
    return;
  }

  const me = Auth.getUser() || { nome: 'Leitor' };
  LibraryData.addBookComment(bookId, {
    id: Date.now(),
    nome: me.nome,
    cor: AVATAR_COLORS[0],
    stars: isNaN(stars) ? 5 : stars,
    texto: text,
    data: new Date().toISOString(),
    curtidas: 0,
  });

  input.value = '';
  renderReviews();
  showToast('Comentário publicado!');
}

function renderReviews() {
  const reviews = getCommunityReviews();
  const total = reviews.length;
  const avg = total ? (reviews.reduce((s, r) => s + r.stars, 0) / total).toFixed(1) : '-';
  const avgStars = total ? Math.round(Number(avg)) : 0;

  // Distribuição de estrelas
  const dist = [5, 4, 3, 2, 1].map(s => ({
    s, count: reviews.filter(r => r.stars === s).length,
    pct: total ? Math.round(reviews.filter(r => r.stars === s).length / total * 100) : 0,
  }));

  document.getElementById('reviewsSummary').innerHTML = `
    <div class="reviews-avg">
      <div class="reviews-avg-num">${avg}</div>
      <div class="reviews-avg-stars">${renderStars(avgStars)}</div>
      <div class="reviews-avg-count">${total} avaliações nesta comunidade</div>
    </div>
    <div class="reviews-dist">
      ${dist.map(d => `
        <div class="dist-row">
          <span class="dist-label">${d.s}★</span>
          <div class="dist-bar"><div class="dist-fill" style="width:${d.pct}%"></div></div>
          <span class="dist-pct">${d.pct}%</span>
        </div>`).join('')}
    </div>`;

  document.getElementById('reviewsList').innerHTML = `
    <div class="review-composer">
      <h4>Deixe seu comentário</h4>
      <div class="review-composer-row">
        <div class="review-star-picker" role="radiogroup" aria-label="Escolha a nota">
          ${[1, 2, 3, 4, 5].map((stars) => `
            <button
              type="button"
              data-stars="${stars}"
              class="review-star-btn ${stars <= REVIEW_STARS ? 'active' : ''}"
              onclick="selectReviewStars(${stars})"
              onmouseover="previewReviewStars(${stars})"
              onmouseout="previewReviewStars(REVIEW_STARS)"
              aria-label="${stars} estrela${stars > 1 ? 's' : ''}"
              aria-pressed="${stars <= REVIEW_STARS ? 'true' : 'false'}"
            >★</button>`).join('')}
        </div>
        <div class="review-star-caption" id="reviewStarCaption">${REVIEW_STARS} de 5 estrelas</div>
      </div>
      <textarea id="newReviewText" class="review-compose-input" maxlength="500" placeholder="Escreva seu comentário sobre este livro..."></textarea>
      <button class="bf-btn bf-btn-primary review-publish-btn" onclick="submitBookComment()">Publicar comentário</button>
    </div>
    ${reviews.length
      ? reviews.map((r, i) => `
        <div class="review-card" style="animation-delay:${i * 0.06}s">
          <div class="review-header">
            <div class="review-avatar" style="background:${r.cor}">${initials(r.nome)}</div>
            <div class="review-meta">
              <div class="review-name">${escapeHtml(r.nome)}</div>
              <div class="review-stars">${renderStars(r.stars)}</div>
            </div>
            <div class="review-date">${formatDate(r.data)}</div>
          </div>
          <p class="review-text">${escapeHtml(r.texto)}</p>
          <button class="review-like" onclick="likeReview(this, ${r.curtidas})">
            ♡ <span>${r.curtidas}</span>
          </button>
        </div>`).join('')
      : `<div class="empty-state"><div>💬</div><p>Seja o primeiro a comentar este livro!</p></div>`}`;
}

function syncReviewStarsPicker(activeStars = REVIEW_STARS) {
  document.querySelectorAll('.review-star-btn').forEach((btn) => {
    const stars = parseInt(btn.dataset.stars || '0', 10);
    const isActive = stars <= activeStars;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
  const caption = document.getElementById('reviewStarCaption');
  if (caption) caption.textContent = `${activeStars} de 5 estrelas`;
}

function selectReviewStars(stars) {
  REVIEW_STARS = stars;
  syncReviewStarsPicker(stars);
}

function previewReviewStars(stars) {
  syncReviewStarsPicker(stars);
}

function likeReview(btn, base) {
  const span = btn.querySelector('span');
  const isLiked = btn.dataset.liked === '1';
  btn.dataset.liked = isLiked ? '0' : '1';
  btn.classList.toggle('liked', !isLiked);
  btn.innerHTML = `${isLiked ? '♡' : '♥'} <span>${base + (isLiked ? 0 : 1)}</span>`;
}

function renderReaders() {
  document.getElementById('readersList').innerHTML = '<div class="empty-state"><div>👥</div><p>Nenhum leitor disponível no momento.</p></div>';
}

function renderDetails() {
  const coverUrl = book.urlImagem || book.url_imagem || '';
  const items = [
    { label: 'Título', value: book.titulo },
    { label: 'Autor', value: book.autor },
    { label: 'Imagem', value: coverUrl },
    { label: 'Gênero', value: book.genero },
    { label: 'Ano', value: book.ano },
    { label: 'Páginas', value: book.paginas },
    { label: 'Editora', value: book.editora },
    { label: 'ISBN', value: book.isbn },
  ];
  document.getElementById('detailsGrid').innerHTML = items.map(d => `
    <div class="detail-item">
      <div class="detail-label">${d.label}</div>
      <div class="detail-value">${d.value}</div>
    </div>`).join('');
}

function switchTab(key, btn) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`tab-${key}`).classList.add('active');
  btn.classList.add('active');
}

// Init theme toggle icon
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('themeToggleBtn');
  if (btn) renderThemeToggle(btn);
});
