requireAuth();

let CATALOG = [];

const GENRE_COLORS = {
  'Ficção Científica': '#8681BD', 'Distopia':'#F2956A', 'Fantasia':'#A8D5BA',
  'Clássico':'#F7A8B8', 'Fábula':'#F5D97E', 'Drama Histórico':'#b0acda',
  'Não Ficção':'#F2956A', 'Fantástico':'#8681BD', 'Realismo Mágico':'#A8D5BA',
  'Mistério':'#ccc8bc',
};

let generoAtivo = 'Todos';
const wishlist   = new Set(JSON.parse(localStorage.getItem('bf_wishlist') || '[]'));

function getGenresFromCatalog() {
  return ['Todos', ...new Set(CATALOG.map((b) => b.genero))]
    .sort((a, b) => a === 'Todos' ? -1 : a.localeCompare(b));
}

function renderGenres() {
  document.getElementById('genreFilters').innerHTML = getGenresFromCatalog().map(g => `
    <button class="genre-btn ${g === generoAtivo ? 'active' : ''}"
            onclick="filterGenre('${g}', this)"
            ${g !== 'Todos' ? `style="--gc:${GENRE_COLORS[g] || '#8681BD'}"` : ''}>
      ${g}
    </button>`).join('');
}

function filterGenre(genre, btn) {
  generoAtivo = genre;
  document.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderGrid();
}

function renderGrid() {
  const books = generoAtivo === 'Todos'
    ? CATALOG
    : CATALOG.filter(b => b.genero === generoAtivo);

  const grid = document.getElementById('booksGrid');
  grid.innerHTML = books.map((b, i) => {
    const inWish = wishlist.has(b.id);
    const coverUrl = b.urlImagem || b.url_imagem || '';
    const fallbackCover = b.emoji || '📚';
    return `
      <div class="discover-card" style="animation-delay:${i*0.04}s">
        <a href="livro.html?id=${b.id}" class="dc-cover-link">
          <div class="dc-cover" id="dc-cover-${b.id}">
            ${coverHtml(coverUrl, fallbackCover, { width: '100%', height: '100%', radius: 0, fontSize: 52 })}
          </div>
        </a>
        <div class="dc-genre-tag" style="background:${GENRE_COLORS[b.genero]+'22'};color:${GENRE_COLORS[b.genero] || 'var(--purple)'}">${b.genero}</div>
        <a href="livro.html?id=${b.id}" class="dc-title">${escapeHtml(b.titulo)}</a>
        <div class="dc-author">${escapeHtml(b.autor)} · ${b.ano}</div>
        <div class="dc-rating">★ ${b.nota}</div>
        <p class="dc-desc">${renderExpandableText(b.desc, `discover-desc-${b.id}`, 120)}</p>
        <div class="dc-actions">
          <a href="livro.html?id=${b.id}" class="bf-btn bf-btn-primary dc-btn">Ver livro</a>
          <button class="dc-wish ${inWish ? 'wished' : ''}" id="wish-${b.id}"
                  onclick="toggleWish(${b.id}, this)" title="${inWish ? 'Remover da lista' : 'Quero ler'}">
            ${inWish ? '🔖' : '＋'}
          </button>
        </div>
      </div>`;
  }).join('');

  // Capas assíncronas
  books
    .filter((b) => !(b.urlImagem || b.url_imagem))
    .forEach(b => applyCover(
      document.getElementById(`dc-cover-${b.id}`),
      b.titulo, b.autor, b.emoji || '📚',
      { width: '100%', height: '100%', radius: 0, fontSize: 52 }
    ));
}

async function loadCatalog() {
  try {
    const apiBooks = await fetchBooksCatalog();
    if (Array.isArray(apiBooks) && apiBooks.length) {
      CATALOG = apiBooks.map((book) => ({
        ...book,
          desc: stripHtml(book.sinopse || book.desc || ''),
        nota: book.nota || book.mediaGlobal || 0,
      }));
    }
  } catch (err) {
    console.warn('Descobrir: catálogo indisponível.', err);
    CATALOG = [];
  }

  renderGenres();
  renderGrid();
}

function toggleWish(id, btn) {
  if (wishlist.has(id)) {
    wishlist.delete(id);
    btn.classList.remove('wished');
    btn.textContent = '＋';
    btn.title = 'Quero ler';
    showToast('Removido da lista.');
  } else {
    wishlist.add(id);
    btn.classList.add('wished');
    btn.textContent = '🔖';
    btn.title = 'Remover da lista';
    showToast('Adicionado à lista "Quero ler"!');
  }
  localStorage.setItem('bf_wishlist', JSON.stringify([...wishlist]));
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('themeToggleBtn');
  if (btn) renderThemeToggle(btn);
});

loadCatalog();
