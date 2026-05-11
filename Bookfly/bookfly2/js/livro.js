requireAuth();

const BOOKS_DB = {
  1:  { titulo:'Duna',                        autor:'Frank Herbert',         ano:1965, paginas:687,  emoji:'🏜️', genero:'Ficção Científica', editora:'Chilton Books', isbn:'978-0441013593',
        desc:'Épica e filosófica, Duna leva o leitor ao planeta deserto de Arrakis, onde água é mais valiosa que ouro e um jovem nobre descobre ser o messias de um povo oprimido. Uma obra que moldou décadas de ficção científica.',
        mediaGlobal:4.8, totalAvaliacoes:2341 },
  2:  { titulo:'1984',                        autor:'George Orwell',         ano:1949, paginas:328,  emoji:'👁️', genero:'Distopia',          editora:'Secker & Warburg', isbn:'978-0451524935',
        desc:'Em um futuro totalitário onde o Partido governa tudo e o Grande Irmão vigia a todos, Winston Smith começa a questionar o sistema. Uma das obras mais perturbadoras e influentes já escritas.',
        mediaGlobal:4.7, totalAvaliacoes:5128 },
  3:  { titulo:'Fundação',                    autor:'Isaac Asimov',          ano:1951, paginas:255,  emoji:'🌌', genero:'Ficção Científica', editora:'Gnome Press', isbn:'978-0553293357',
        desc:'O matemático Hari Seldon prevê a queda do Império Galáctico e cria a Fundação para preservar o conhecimento da humanidade. O início de uma das maiores sagas da literatura.',
        mediaGlobal:4.6, totalAvaliacoes:1872 },
  4:  { titulo:'O Alquimista',                autor:'Paulo Coelho',          ano:1988, paginas:208,  emoji:'✨', genero:'Fábula',            editora:'HarperCollins', isbn:'978-0062315007',
        desc:'Santiago, um jovem pastor, parte em busca de um tesouro e encontra muito mais: a si mesmo. O livro brasileiro mais traduzido da história.',
        mediaGlobal:4.6, totalAvaliacoes:9834 },
  5:  { titulo:'Crime e Castigo',             autor:'Fiódor Dostoiévski',    ano:1866, paginas:671,  emoji:'⚖️', genero:'Romance Psicológico', editora:'The Russian Messenger', isbn:'978-0143058144',
        desc:'Raskólnikov, um estudante pobre, acredita que homens extraordinários estão acima da lei comum. Após cometer um assassinato, é consumido pela culpa e paranoia.',
        mediaGlobal:4.7, totalAvaliacoes:3102 },
  6:  { titulo:'O Senhor dos Anéis',          autor:'J.R.R. Tolkien',        ano:1954, paginas:1178, emoji:'💍', genero:'Fantasia',          editora:'Allen & Unwin', isbn:'978-0618640157',
        desc:'A saga épica de Frodo Baggins e seus companheiros para destruir o Um Anel e salvar a Terra Média do Senhor das Trevas Sauron.',
        mediaGlobal:4.9, totalAvaliacoes:7421 },
  7:  { titulo:'Harry Potter e a Pedra Filosofal', autor:'J.K. Rowling',     ano:1997, paginas:332,  emoji:'⚡', genero:'Fantasia',          editora:'Bloomsbury', isbn:'978-0439708180',
        desc:'No dia de seu décimo primeiro aniversário, Harry Potter descobre que é um bruxo e é admitido na escola de magia de Hogwarts, onde irá viver aventuras extraordinárias.',
        mediaGlobal:4.8, totalAvaliacoes:12503 },
  8:  { titulo:'A Menina que Roubava Livros', autor:'Markus Zusak',          ano:2005, paginas:556,  emoji:'📖', genero:'Drama Histórico',   editora:'Picador', isbn:'978-0375842207',
        desc:'Narrado pela Morte, acompanha Liesel Meminger na Alemanha nazista, onde ela aprende o poder das palavras para sobreviver ao horror ao seu redor.',
        mediaGlobal:4.7, totalAvaliacoes:4205 },
  9:  { titulo:'Sapiens',                     autor:'Yuval Noah Harari',     ano:2011, paginas:443,  emoji:'🧠', genero:'Não Ficção',        editora:'Kinneret', isbn:'978-0062316097',
        desc:'Uma provocadora história da humanidade, do surgimento do Homo sapiens na Idade da Pedra até os impérios políticos e as descobertas científicas da atualidade.',
        mediaGlobal:4.5, totalAvaliacoes:6712 },
  10: { titulo:'O Mestre e Margarida',        autor:'Mikhail Bulgakov',      ano:1967, paginas:480,  emoji:'😈', genero:'Fantástico',        editora:'YMCA Press', isbn:'978-0143108573',
        desc:'O Diabo e sua comitiva chegam à Moscou soviética semeando o caos. Paralelamente, em Jerusalém antiga, Pôncio Pilatos condena Iéschua Ha-Notzri.',
        mediaGlobal:4.8, totalAvaliacoes:1904 },
};

const AVATAR_COLORS = ['#8681BD','#F7A8B8','#F2956A','#A8D5BA','#F5D97E','#b0acda'];

const MOCK_REVIEWS = {
  1: [
    { id:1, nome:'Maria Oliveira', cor:AVATAR_COLORS[1], stars:5, texto:'Duna é uma obra-prima absoluta. A construção de mundo é incomparável — Arrakis parece real, com sua política, ecologia e religião próprias.', data:'2025-03-12', curtidas:34 },
    { id:2, nome:'João Silva',     cor:AVATAR_COLORS[2], stars:4, texto:'Incrível, mas a primeira metade é bem densa. Vale muito a pena persistir — a segunda metade compensa cada página lenta do início.', data:'2025-01-28', curtidas:18 },
    { id:3, nome:'Ana Costa',      cor:AVATAR_COLORS[3], stars:5, texto:'Li três vezes. Cada releitura revela camadas novas. Herbert era um gênio.', data:'2024-11-05', curtidas:27 },
  ],
  2: [
    { id:4, nome:'Ana Costa',      cor:AVATAR_COLORS[3], stars:5, texto:'Perturbadoramente atual. Cada página parece uma profecia. Obrigatório.', data:'2025-04-01', curtidas:51 },
    { id:5, nome:'Pedro Mendes',   cor:AVATAR_COLORS[0], stars:5, texto:'Li em 2025 e ficou ainda mais assustador. A língua dupla, a polícia do pensamento... parece que Orwell previu o futuro.', data:'2025-02-14', curtidas:43 },
  ],
};

const MOCK_READERS = {
  1: [
    { nome:'Maria Oliveira', cor:AVATAR_COLORS[1], status:'Leu', stars:5 },
    { nome:'Ana Costa',      cor:AVATAR_COLORS[3], status:'Leu', stars:5 },
    { nome:'João Silva',     cor:AVATAR_COLORS[2], status:'Lendo', stars:null },
    { nome:'Pedro Mendes',   cor:AVATAR_COLORS[0], status:'Quer ler', stars:null },
  ],
};

const params = new URLSearchParams(window.location.search);
const bookId = parseInt(params.get('id')) || 1;
const book   = BOOKS_DB[bookId];

if (!book) {
  document.getElementById('pageWrap').innerHTML = `
    <div style="text-align:center;padding:80px 20px">
      <div style="font-size:48px;margin-bottom:16px">📚</div>
      <h2 style="font-family:var(--font-display)">Livro não encontrado</h2>
      <a href="home.html" class="bf-btn bf-btn-primary" style="margin-top:24px;display:inline-flex">← Voltar ao feed</a>
    </div>`;
} else {
  renderBook();
}

const SHELF_STATUS = ['Nenhuma', 'Quero ler', 'Lendo', 'Lido'];
let userStatus = 0; // índice no array acima

function renderBook() {
  document.title = `Bookfly — ${book.titulo}`;

  document.getElementById('heroCover').innerHTML = coverHtml(null, book.emoji, { width: 120, height: 174, radius: 10, fontSize: 64 });
  document.getElementById('heroTitle').textContent  = book.titulo;
  document.getElementById('heroAuthor').textContent = `${book.autor} · ${book.ano}`;
  document.getElementById('heroMeta').textContent   = `${book.paginas} páginas · ${book.editora}`;
  document.getElementById('heroGenre').textContent  = book.genero;
  document.getElementById('heroDesc').textContent   = book.desc;

  applyCover(document.getElementById('heroCover'), book.titulo, book.autor, book.emoji,
    { width: 120, height: 174, radius: 10, fontSize: 64 });

  // Rating
  const starsRounded = Math.round(book.mediaGlobal);
  document.getElementById('heroRating').innerHTML = `
    <span class="hero-stars">${renderStars(starsRounded)}</span>
    <span class="hero-avg">${book.mediaGlobal}</span>
    <span class="hero-total">(${book.totalAvaliacoes.toLocaleString('pt-BR')} avaliações)</span>`;

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
      <a href="avaliar.html?id=${bookId}" class="bf-btn bf-btn-ghost shelf-action-btn">⭐ Avaliar</a>
    </div>`;
}

function shelfStatusIcon() {
  return ['📌','🔖','📖','✅'][userStatus];
}

function cycleStatus() {
  userStatus = (userStatus + 1) % SHELF_STATUS.length;
  renderShelfActions();
  showToast(userStatus === 0 ? 'Removido da estante' : `Marcado como: ${SHELF_STATUS[userStatus]}`);
}

function openStatusMenu() {
  openModal({
    title: '📚 Adicionar à estante',
    size: 'sm',
    body: SHELF_STATUS.map((s, i) => `
      <div class="status-menu-item ${i === userStatus ? 'active' : ''}" onclick="setStatus(${i})">
        <span>${['📌','🔖','📖','✅'][i]}</span> ${s}
        ${i === userStatus ? '<span class="status-check">✓</span>' : ''}
      </div>`).join(''),
    buttons: [],
  });
}

function setStatus(idx) {
  userStatus = idx;
  document.getElementById('bf-modal-overlay')?.remove();
  renderShelfActions();
  showToast(idx === 0 ? 'Removido da estante' : `Marcado como: ${SHELF_STATUS[idx]}`);
}

function renderReviews() {
  const reviews = MOCK_REVIEWS[bookId] || [];
  const total   = reviews.length;
  const avg     = total ? (reviews.reduce((s, r) => s + r.stars, 0) / total).toFixed(1) : '-';

  // Distribuição de estrelas
  const dist = [5,4,3,2,1].map(s => ({
    s, count: reviews.filter(r => r.stars === s).length,
    pct: total ? Math.round(reviews.filter(r => r.stars === s).length / total * 100) : 0,
  }));

  document.getElementById('reviewsSummary').innerHTML = `
    <div class="reviews-avg">
      <div class="reviews-avg-num">${avg}</div>
      <div class="reviews-avg-stars">${renderStars(Math.round(parseFloat(avg)))}</div>
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

  document.getElementById('reviewsList').innerHTML = reviews.length
    ? reviews.map((r, i) => `
        <div class="review-card" style="animation-delay:${i*0.06}s">
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
    : `<div class="empty-state"><div>💬</div><p>Seja o primeiro a avaliar este livro!</p>
       <a href="avaliar.html?id=${bookId}" class="bf-btn bf-btn-primary" style="margin-top:12px;display:inline-flex">Avaliar agora</a></div>`;
}

function likeReview(btn, base) {
  const span   = btn.querySelector('span');
  const isLiked = btn.dataset.liked === '1';
  btn.dataset.liked = isLiked ? '0' : '1';
  btn.classList.toggle('liked', !isLiked);
  btn.innerHTML = `${isLiked ? '♡' : '♥'} <span>${base + (isLiked ? 0 : 1)}</span>`;
}

function renderReaders() {
  const readers = MOCK_READERS[bookId] || [];
  document.getElementById('readersList').innerHTML = readers.length
    ? `<div class="readers-grid">${readers.map(r => `
        <div class="reader-card">
          <div class="reader-avatar" style="background:${r.cor}">${initials(r.nome)}</div>
          <div class="reader-name">${escapeHtml(r.nome)}</div>
          <div class="reader-status ${r.status.replace(' ','-').toLowerCase()}">${r.status}</div>
          ${r.stars ? `<div class="reader-stars">${renderStars(r.stars)}</div>` : ''}
        </div>`).join('')}</div>`
    : '<div class="empty-state"><div>👥</div><p>Nenhum leitor da comunidade ainda.</p></div>';
}

function renderDetails() {
  const items = [
    { label: 'Título',    value: book.titulo },
    { label: 'Autor',     value: book.autor },
    { label: 'Gênero',    value: book.genero },
    { label: 'Ano',       value: book.ano },
    { label: 'Páginas',   value: book.paginas },
    { label: 'Editora',   value: book.editora },
    { label: 'ISBN',      value: book.isbn },
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
