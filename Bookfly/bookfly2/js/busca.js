requireAuth();

const AVATAR_COLORS = ['#8681BD','#F7A8B8','#F2956A','#A8D5BA','#F5D97E','#b0acda'];

const BOOKS = [
  { id:1,  titulo:'Duna',                        autor:'Frank Herbert',         ano:1965, paginas:687,  emoji:'🏜️', genero:'Ficção Científica', nota:4.8 },
  { id:2,  titulo:'1984',                        autor:'George Orwell',         ano:1949, paginas:328,  emoji:'👁️', genero:'Distopia',          nota:4.7 },
  { id:3,  titulo:'Fundação',                    autor:'Isaac Asimov',          ano:1951, paginas:255,  emoji:'🌌', genero:'Ficção Científica', nota:4.6 },
  { id:4,  titulo:'O Alquimista',                autor:'Paulo Coelho',          ano:1988, paginas:208,  emoji:'✨', genero:'Fábula',            nota:4.6 },
  { id:5,  titulo:'Crime e Castigo',             autor:'Fiódor Dostoiévski',    ano:1866, paginas:671,  emoji:'⚖️', genero:'Romance Psicológico', nota:4.7 },
  { id:6,  titulo:'O Senhor dos Anéis',          autor:'J.R.R. Tolkien',        ano:1954, paginas:1178, emoji:'💍', genero:'Fantasia',          nota:4.9 },
  { id:7,  titulo:'Harry Potter',                autor:'J.K. Rowling',          ano:1997, paginas:332,  emoji:'⚡', genero:'Fantasia',          nota:4.8 },
  { id:8,  titulo:'A Menina que Roubava Livros', autor:'Markus Zusak',          ano:2005, paginas:556,  emoji:'📖', genero:'Drama Histórico',   nota:4.7 },
  { id:9,  titulo:'Sapiens',                     autor:'Yuval Noah Harari',     ano:2011, paginas:443,  emoji:'🧠', genero:'Não Ficção',        nota:4.5 },
  { id:10, titulo:'O Mestre e Margarida',        autor:'Mikhail Bulgakov',      ano:1967, paginas:480,  emoji:'😈', genero:'Fantástico',        nota:4.8 },
];

const USERS = [
  { id:2, nome:'Maria Oliveira', livros:48, seguidores:120, cor:AVATAR_COLORS[1], bio:'Fanática em FC e fantasia 🚀' },
  { id:3, nome:'João Silva',     livros:31, seguidores:67,  cor:AVATAR_COLORS[2], bio:'Clássicos da literatura' },
  { id:4, nome:'Ana Costa',      livros:72, seguidores:204, cor:AVATAR_COLORS[3], bio:'Leio de tudo um pouco 📚' },
  { id:5, nome:'Pedro Mendes',   livros:19, seguidores:34,  cor:AVATAR_COLORS[0], bio:'Tolkien é vida' },
  { id:6, nome:'Lucas Ferreira', livros:55, seguidores:98,  cor:AVATAR_COLORS[4], bio:'Literatura brasileira ❤️' },
];

const POPULAR = BOOKS.slice(0, 5);
let activeTab = 'livros';

// Render popular books on load
function renderPopular() {
  document.getElementById('popularList').innerHTML = POPULAR.map((b, i) => `
    <a class="book-result-card" href="livro.html?id=${b.id}" style="animation-delay:${i*0.05}s">
      <div class="brc-cover" id="pop-${b.id}">${b.emoji}</div>
      <div class="brc-info">
        <div class="brc-title">${escapeHtml(b.titulo)}</div>
        <div class="brc-author">${escapeHtml(b.autor)} · ${b.ano}</div>
        <div class="brc-meta">
          <span class="brc-genre">${b.genero}</span>
          <span class="brc-rating">★ ${b.nota}</span>
        </div>
      </div>
    </a>`).join('');

  POPULAR.forEach(b => applyCover(
    document.getElementById(`pop-${b.id}`),
    b.titulo, b.autor, b.emoji,
    { width: 52, height: 74, radius: 6, fontSize: 28 }
  ));
}

const doSearch = debounce(function(q) {
  if (!q) { showDefault(); return; }

  const books   = BOOKS.filter(b   => b.titulo.toLowerCase().includes(q) || b.autor.toLowerCase().includes(q));
  const users   = USERS.filter(u   => u.nome.toLowerCase().includes(q));

  document.getElementById('defaultView').style.display  = 'none';
  document.getElementById('resultsView').style.display  = 'block';
  document.getElementById('searchTabs').style.display   = 'flex';
  document.getElementById('clearBtn').style.display     = 'block';

  document.getElementById('livrosResults').innerHTML = books.length
    ? books.map((b, i) => `
        <a class="book-result-card" href="livro.html?id=${b.id}" style="animation-delay:${i*0.05}s">
          <div class="brc-cover" id="brc-${b.id}">${b.emoji}</div>
          <div class="brc-info">
            <div class="brc-title">${escapeHtml(b.titulo)}</div>
            <div class="brc-author">${escapeHtml(b.autor)} · ${b.ano}</div>
            <div class="brc-meta">
              <span class="brc-genre">${b.genero}</span>
              <span class="brc-rating">★ ${b.nota}</span>
            </div>
          </div>
          <div class="brc-pages">${b.paginas} pág.</div>
        </a>`).join('')
    : '<div class="no-results">Nenhum livro encontrado.</div>';

  // Capas assíncronas nos resultados
  books.forEach(b => applyCover(
    document.getElementById(`brc-${b.id}`),
    b.titulo, b.autor, b.emoji,
    { width: 52, height: 74, radius: 6, fontSize: 28 }
  ));

  document.getElementById('leitoresResults').innerHTML = users.length
    ? users.map((u, i) => `
        <div class="user-result-card" style="animation-delay:${i*0.05}s">
          <div class="urc-avatar" style="background:${u.cor}">${initials(u.nome)}</div>
          <div class="urc-info">
            <div class="urc-name">${escapeHtml(u.nome)}</div>
            <div class="urc-bio">${escapeHtml(u.bio)}</div>
            <div class="urc-stats">${u.livros} livros · ${u.seguidores} seguidores</div>
          </div>
          <button class="sug-follow" id="uf-${u.id}" onclick="toggleFollow(${u.id}, this)">Seguir</button>
        </div>`).join('')
    : '<div class="no-results">Nenhum leitor encontrado.</div>';
}, 280);

function handleSearch() {
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  doSearch(q);
}

function showDefault() {
  document.getElementById('defaultView').style.display  = 'block';
  document.getElementById('resultsView').style.display  = 'none';
  document.getElementById('searchTabs').style.display   = 'none';
  document.getElementById('clearBtn').style.display     = 'none';
}

function clearSearch() {
  document.getElementById('searchInput').value = '';
  showDefault();
  document.getElementById('searchInput').focus();
}

function switchSearchTab(tab, btn) {
  activeTab = tab;
  document.querySelectorAll('.stab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.stab-pane').forEach(p => p.classList.remove('active'));
  document.getElementById(`${tab}Results`).classList.add('active');
}

function toggleFollow(id, btn) {
  const isF = btn.classList.contains('following');
  btn.classList.toggle('following', !isF);
  btn.textContent = isF ? 'Seguir' : 'Seguindo';
  showToast(isF ? 'Você deixou de seguir.' : 'Seguindo!');
}

// URL param: preencher busca se vier da nav
const urlQ = new URLSearchParams(window.location.search).get('q');
if (urlQ) {
  document.getElementById('searchInput').value = urlQ;
  doSearch(urlQ.toLowerCase());
}

renderPopular();

// Init theme toggle icon
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('themeToggleBtn');
  if (btn) renderThemeToggle(btn);
});
