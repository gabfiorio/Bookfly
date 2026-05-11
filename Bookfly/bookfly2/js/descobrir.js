requireAuth();

const CATALOG = [
  { id:1,  titulo:'Duna',                         autor:'Frank Herbert',       ano:1965, emoji:'🏜️', genero:'Ficção Científica', nota:4.8, desc:'A épica saga de Paul Atreides no planeta deserto de Arrakis.' },
  { id:2,  titulo:'1984',                         autor:'George Orwell',       ano:1949, emoji:'👁️', genero:'Distopia',          nota:4.7, desc:'Um futuro totalitário onde o Grande Irmão vigia a todos.' },
  { id:3,  titulo:'Fundação',                     autor:'Isaac Asimov',        ano:1951, emoji:'🌌', genero:'Ficção Científica', nota:4.6, desc:'Hari Seldon e a missão de preservar o conhecimento humano.' },
  { id:4,  titulo:'O Alquimista',                 autor:'Paulo Coelho',        ano:1988, emoji:'✨', genero:'Fábula',            nota:4.6, desc:'A jornada de Santiago em busca de seu tesouro pessoal.' },
  { id:5,  titulo:'Crime e Castigo',              autor:'F. Dostoiévski',      ano:1866, emoji:'⚖️', genero:'Clássico',          nota:4.7, desc:'Raskólnikov e o peso psicológico de um crime premeditado.' },
  { id:6,  titulo:'O Senhor dos Anéis',           autor:'J.R.R. Tolkien',      ano:1954, emoji:'💍', genero:'Fantasia',          nota:4.9, desc:'A jornada de Frodo para destruir o Um Anel.' },
  { id:7,  titulo:'Harry Potter',                 autor:'J.K. Rowling',        ano:1997, emoji:'⚡', genero:'Fantasia',          nota:4.8, desc:'O início da jornada mágica de Harry Potter em Hogwarts.' },
  { id:8,  titulo:'A Menina que Roubava Livros',  autor:'Markus Zusak',        ano:2005, emoji:'📖', genero:'Drama Histórico',   nota:4.7, desc:'Liesel Meminger e o poder das palavras na Segunda Guerra.' },
  { id:9,  titulo:'Sapiens',                      autor:'Y. N. Harari',        ano:2011, emoji:'🧠', genero:'Não Ficção',        nota:4.5, desc:'Uma provocadora história da humanidade.' },
  { id:10, titulo:'O Mestre e Margarida',         autor:'M. Bulgakov',         ano:1967, emoji:'😈', genero:'Fantástico',        nota:4.8, desc:'O Diabo visita Moscou soviética com consequências caóticas.' },
  { id:11, titulo:'Cem Anos de Solidão',          autor:'G. García Márquez',   ano:1967, emoji:'🌿', genero:'Realismo Mágico',   nota:4.8, desc:'A saga multigeneracional da família Buendía em Macondo.' },
  { id:12, titulo:'O Grande Gatsby',              autor:'F. Scott Fitzgerald', ano:1925, emoji:'🥂', genero:'Clássico',          nota:4.4, desc:'Ambição, amor e ilusão na era do jazz americano.' },
  { id:13, titulo:'Admirável Mundo Novo',         autor:'Aldous Huxley',       ano:1932, emoji:'🧬', genero:'Distopia',          nota:4.5, desc:'Uma sociedade utópica construída sobre controle e prazer.' },
  { id:14, titulo:'A Revolução dos Bichos',       autor:'George Orwell',       ano:1945, emoji:'🐷', genero:'Fábula',            nota:4.6, desc:'Uma fábula política sobre poder e corrupção.' },
  { id:15, titulo:'Neuromancer',                  autor:'William Gibson',      ano:1984, emoji:'💻', genero:'Ficção Científica', nota:4.4, desc:'O romance que definiu o gênero cyberpunk.' },
  { id:16, titulo:'O Nome da Rosa',               autor:'Umberto Eco',         ano:1980, emoji:'🌹', genero:'Mistério',          nota:4.6, desc:'Um monge investiga uma série de mortes em um mosteiro medieval.' },
  { id:17, titulo:'Memórias Póstumas de Brás Cubas', autor:'Machado de Assis', ano:1881, emoji:'💀', genero:'Clássico',          nota:4.7, desc:'Um defunto autor narra sua própria vida após a morte.' },
  { id:18, titulo:'O Processo',                  autor:'Franz Kafka',          ano:1925, emoji:'🚪', genero:'Clássico',          nota:4.5, desc:'Josef K. é preso por um crime que nunca lhe é revelado.' },
];

const GENEROS = ['Todos', ...new Set(CATALOG.map(b => b.genero))].sort((a, b) => a === 'Todos' ? -1 : a.localeCompare(b));
const GENRE_COLORS = {
  'Ficção Científica': '#8681BD', 'Distopia':'#F2956A', 'Fantasia':'#A8D5BA',
  'Clássico':'#F7A8B8', 'Fábula':'#F5D97E', 'Drama Histórico':'#b0acda',
  'Não Ficção':'#F2956A', 'Fantástico':'#8681BD', 'Realismo Mágico':'#A8D5BA',
  'Mistério':'#ccc8bc',
};

let activeGenre = 'Todos';
const wishlist   = new Set(JSON.parse(localStorage.getItem('bf_wishlist') || '[]'));

function renderGenres() {
  document.getElementById('genreFilters').innerHTML = GENEROS.map(g => `
    <button class="genre-btn ${g === activeGenre ? 'active' : ''}"
            onclick="filterGenre('${g}', this)"
            ${g !== 'Todos' ? `style="--gc:${GENRE_COLORS[g] || '#8681BD'}"` : ''}>
      ${g}
    </button>`).join('');
}

function filterGenre(genre, btn) {
  activeGenre = genre;
  document.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderGrid();
}

function renderGrid() {
  const books = activeGenre === 'Todos'
    ? CATALOG
    : CATALOG.filter(b => b.genero === activeGenre);

  const grid = document.getElementById('booksGrid');
  grid.innerHTML = books.map((b, i) => {
    const inWish = wishlist.has(b.id);
    return `
      <div class="discover-card" style="animation-delay:${i*0.04}s">
        <a href="livro.html?id=${b.id}" class="dc-cover-link">
          <div class="dc-cover" id="dc-cover-${b.id}">${b.emoji}</div>
        </a>
        <div class="dc-genre-tag" style="background:${GENRE_COLORS[b.genero]+'22'};color:${GENRE_COLORS[b.genero] || 'var(--purple)'}">${b.genero}</div>
        <a href="livro.html?id=${b.id}" class="dc-title">${escapeHtml(b.titulo)}</a>
        <div class="dc-author">${escapeHtml(b.autor)} · ${b.ano}</div>
        <div class="dc-rating">★ ${b.nota}</div>
        <p class="dc-desc">${escapeHtml(truncate(b.desc, 80))}</p>
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
  books.forEach(b => applyCover(
    document.getElementById(`dc-cover-${b.id}`),
    b.titulo, b.autor, b.emoji,
    { width: '100%', height: '100%', radius: 0, fontSize: 52 }
  ));
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

renderGenres();
renderGrid();
