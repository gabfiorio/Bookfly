requireAuth();

let selectedBook  = null;
let selectedStars = 0;

const MOCK_BOOKS = [
  { id:1,  titulo:'Duna',                         autor:'Frank Herbert',         ano:1965, paginas:687,  emoji:'🏜️', desc:'A épica história de Paul Atreides no planeta deserto de Arrakis.' },
  { id:2,  titulo:'1984',                         autor:'George Orwell',         ano:1949, paginas:328,  emoji:'👁️', desc:'Uma distopia sobre um regime totalitário onde o Grande Irmão te observa.' },
  { id:3,  titulo:'Fundação',                     autor:'Isaac Asimov',          ano:1951, paginas:255,  emoji:'🌌', desc:'Hari Seldon e a missão de preservar o conhecimento da humanidade.' },
  { id:4,  titulo:'O Alquimista',                 autor:'Paulo Coelho',          ano:1988, paginas:208,  emoji:'✨', desc:'A jornada de Santiago em busca de seu tesouro pessoal.' },
  { id:5,  titulo:'Crime e Castigo',              autor:'Fiódor Dostoiévski',    ano:1866, paginas:671,  emoji:'⚖️', desc:'Raskólnikov e o peso psicológico de um crime premeditado.' },
  { id:6,  titulo:'O Senhor dos Anéis',           autor:'J.R.R. Tolkien',        ano:1954, paginas:1178, emoji:'💍', desc:'A grande jornada de Frodo para destruir o Um Anel.' },
  { id:7,  titulo:'Harry Potter e a Pedra Filosofal', autor:'J.K. Rowling',    ano:1997, paginas:332,  emoji:'⚡', desc:'O início da jornada mágica do bruxo Harry Potter em Hogwarts.' },
  { id:8,  titulo:'A Menina que Roubava Livros',  autor:'Markus Zusak',         ano:2005, paginas:556,  emoji:'📖', desc:'Liesel Meminger e a sua relação com as palavras durante a Segunda Guerra.' },
  { id:9,  titulo:'Sapiens',                      autor:'Yuval Noah Harari',     ano:2011, paginas:443,  emoji:'🧠', desc:'Uma breve história da humanidade desde o surgimento do Homo sapiens.' },
  { id:10, titulo:'O Mestre e Margarida',         autor:'Mikhail Bulgakov',      ano:1967, paginas:480,  emoji:'😈', desc:'O Diabo visita Moscou soviética com consequências caóticas e magistrais.' },
];

const STAR_CAPTIONS = ['','Não gostei','Foi ok','Gostei','Muito bom!','Obra-prima! ⭐'];

// ── Busca com debounce ──
const doSearch = debounce(function() {
  const q       = document.getElementById('searchInput').value.trim().toLowerCase();
  const results = document.getElementById('searchResults');

  if (q.length < 2) { results.style.display = 'none'; return; }

  const filtered = MOCK_BOOKS.filter(b =>
    b.titulo.toLowerCase().includes(q) || b.autor.toLowerCase().includes(q)
  ).slice(0, 6);

  if (!filtered.length) { results.style.display = 'none'; return; }

  results.innerHTML = filtered.map(b => `
    <div class="search-result-item" onclick="selectBook(${b.id})">
      <div class="result-cover" id="rc-${b.id}">${b.emoji}</div>
      <div class="result-info">
        <div class="result-title">${escapeHtml(b.titulo)}</div>
        <div class="result-author">${escapeHtml(b.autor)} · ${b.ano}</div>
      </div>
    </div>`).join('');
  results.style.display = 'block';

  // Carrega capas assincronamente
  filtered.forEach(b => applyCover(
    document.getElementById(`rc-${b.id}`),
    b.titulo, b.autor, b.emoji,
    { width: 36, height: 50, radius: 4, fontSize: 20 }
  ));
}, 300);

function handleSearch() { doSearch(); }

function selectBook(id) {
  const book = MOCK_BOOKS.find(b => b.id === id);
  if (!book) return;
  selectedBook = book;
  document.getElementById('searchResults').style.display = 'none';
  document.getElementById('searchInput').value = book.titulo;

  document.getElementById('previewCover').innerHTML = coverHtml(null, book.emoji, { width: 90, height: 130, radius: 8, fontSize: 48 });
  document.getElementById('previewTitle').textContent  = book.titulo;
  document.getElementById('previewAuthor').textContent = book.autor;
  document.getElementById('previewMeta').textContent   = `${book.ano} · ${book.paginas} páginas`;
  document.getElementById('previewDesc').textContent   = book.desc;
  document.getElementById('bookPreview').classList.add('visible');
  document.getElementById('ratingSection').classList.add('visible');
  document.getElementById('reviewForm').classList.add('visible');

  // Capa grande no preview
  applyCover(document.getElementById('previewCover'), book.titulo, book.autor, book.emoji,
    { width: 90, height: 130, radius: 8, fontSize: 48 });
}

const starBtns = document.querySelectorAll('.star-btn');
starBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    selectedStars = parseInt(btn.dataset.v);
    updateStars(selectedStars);
    document.getElementById('submitBtn').classList.add('visible');
  });
  btn.addEventListener('mouseenter', () => hoverStars(parseInt(btn.dataset.v)));
  btn.addEventListener('mouseleave', () => updateStars(selectedStars));
});

function hoverStars(n) {
  starBtns.forEach((b, i) => { b.classList.toggle('hover', i < n); b.classList.remove('active'); });
  document.getElementById('starsCaption').textContent = STAR_CAPTIONS[n];
}
function updateStars(n) {
  starBtns.forEach((b, i) => { b.classList.remove('hover'); b.classList.toggle('active', i < n); });
  document.getElementById('starsCaption').textContent = n ? STAR_CAPTIONS[n] : 'Clique para avaliar';
}
function updateCharCount() {
  const len = document.getElementById('reviewText').value.length;
  document.getElementById('charCount').textContent = `${len} / 1000`;
}

async function submitReview() {
  if (!selectedBook) { showToast('Selecione um livro.', 'error'); return; }
  if (!selectedStars) { showToast('Escolha uma nota antes de publicar.', 'error'); return; }

  const reviewText = document.getElementById('reviewText').value.trim();
  const btn  = document.getElementById('submitBtn');
  const txt  = document.getElementById('submitText');
  const spin = document.getElementById('submitSpinner');

  btn.disabled = true; txt.textContent = 'Publicando…'; spin.style.display = 'block';

  // TODO: await apiFetch('/reviews', { method:'POST', body: JSON.stringify({ bookId: selectedBook.id, stars: selectedStars, text: reviewText }) })
  await new Promise(r => setTimeout(r, 900));

  document.getElementById('bookPreview').classList.remove('visible');
  document.getElementById('ratingSection').classList.remove('visible');
  document.getElementById('reviewForm').classList.remove('visible');
  btn.classList.remove('visible');
  document.querySelector('.search-wrap').style.display   = 'none';
  document.querySelector('.page-title').style.display    = 'none';
  document.getElementById('successCard').classList.add('visible');
}

function resetForm() {
  selectedBook = null; selectedStars = 0;
  document.getElementById('searchInput').value = '';
  document.getElementById('reviewText').value  = '';
  updateStars(0); updateCharCount();
}

document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrap')) document.getElementById('searchResults').style.display = 'none';
});

// Init theme toggle icon
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('themeToggleBtn');
  if (btn) renderThemeToggle(btn);
});
