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

  await new Promise(r => setTimeout(r, 900));

  document.getElementById('bookPreview').classList.remove('visible');
  document.getElementById('ratingSection').classList.remove('visible');
  document.getElementById('reviewForm').classList.remove('visible');
  btn.classList.remove('visible');
  document.querySelector('.search-wrap').style.display   = 'none';
  document.querySelector('.page-title').style.display    = 'none';
  document.getElementById('successCard').classList.add('visible');

  await generateShareCard(selectedBook, selectedStars, reviewText);
}

async function generateShareCard(book, stars, reviewText) {

  const canvas = document.createElement('canvas');
  canvas.width  = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 0, 1920);
  grad.addColorStop(0,   '#2d2b4e');
  grad.addColorStop(0.5, '#3c3878');
  grad.addColorStop(1,   '#1a1830');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1920);

  ctx.fillStyle = 'rgba(255,255,255,0.025)';
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * 1080;
    const y = Math.random() * 1920;
    const r = Math.random() * 2.5 + 0.5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  await new Promise(resolve => {
    const logoImg = new Image();
    logoImg.onload = () => {
      const logoSize = 90;
      ctx.globalAlpha = 0.90;
      ctx.drawImage(logoImg, 540 - logoSize / 2, 60, logoSize, logoSize);
      ctx.globalAlpha = 1;
      resolve();
    };
    logoImg.onerror = () => resolve();
    logoImg.src = 'assets/lirica.png';
  });

  ctx.strokeStyle = 'rgba(134,129,189,0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(200, 175);
  ctx.lineTo(880, 175);
  ctx.stroke();

  const cardX = 80, cardY = 600, cardW = 920, cardH = 700;
  ctx.fillStyle = 'rgba(240,236,225,0.96)';
  roundRect(ctx, cardX, cardY, cardW, cardH, 48);
  ctx.fill();

  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur  = 60;
  ctx.shadowOffsetY = 20;
  ctx.fillStyle = 'rgba(240,236,225,0.96)';
  roundRect(ctx, cardX, cardY, cardW, cardH, 48);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur  = 0;
  ctx.shadowOffsetY = 0;

  const coverX = 540 - 110, coverY = cardY + 60, coverW = 220, coverH = 310;
  const coverGrad = ctx.createLinearGradient(coverX, coverY, coverX + coverW, coverY + coverH);
  coverGrad.addColorStop(0, '#8681BD');
  coverGrad.addColorStop(1, '#5a5594');
  ctx.fillStyle = coverGrad;
  roundRect(ctx, coverX, coverY, coverW, coverH, 14);
  ctx.fill();

  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur  = 30;
  ctx.shadowOffsetX = 8;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = coverGrad;
  roundRect(ctx, coverX, coverY, coverW, coverH, 14);
  ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;

  ctx.font = '100px serif';
  ctx.textAlign = 'center';
  ctx.fillText(book.emoji, 540, coverY + 190);

  ctx.fillStyle = '#2e2318';
  ctx.font = 'bold 52px serif';
  ctx.textAlign = 'center';
  wrapText(ctx, book.titulo, 540, cardY + 430, 800, 62);

  ctx.fillStyle = '#7a6a5a';
  ctx.font = '36px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(book.autor, 540, cardY + 530);

  ctx.strokeStyle = 'rgba(134,129,189,0.25)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cardX + 80, cardY + 565);
  ctx.lineTo(cardX + cardW - 80, cardY + 565);
  ctx.stroke();

  const starSize = 76;
  const starsTotal = 5;
  const starsWidth = starsTotal * starSize + (starsTotal - 1) * 16;
  const starsStartX = 540 - starsWidth / 2;
  const starsY = cardY + 600;

  for (let i = 0; i < 5; i++) {
    ctx.font = `${starSize}px serif`;
    ctx.fillStyle = i < stars ? '#F2956A' : 'rgba(0,0,0,0.12)';
    ctx.textAlign = 'left';
    ctx.fillText('★', starsStartX + i * (starSize + 16), starsY + starSize);
  }

  ctx.fillStyle = '#F2956A';
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${stars}/5`, 540, cardY + 700);

  if (reviewText) {
    ctx.fillStyle = 'rgba(46,35,24,0.65)';
    ctx.font = 'italic 34px serif';
    ctx.textAlign = 'center';
    const shortReview = reviewText.length > 100 ? reviewText.slice(0, 97) + '…' : reviewText;
    wrapText(ctx, `"${shortReview}"`, 540, cardY + 780, 820, 46);
  }

  ctx.fillStyle = '#8681BD';
  roundRect(ctx, 540 - 155, cardY - 30, 310, 60, 30);
  ctx.fill();
  ctx.fillStyle = 'white';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('📚 li esse livro', 540, cardY + 10);

  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = '32px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('bookfly.app • sua estante virtual', 540, 1820);

  const dataUrl = canvas.toDataURL('image/png');
  const img = document.getElementById('sharePreviewImg');
  if (img) {
    img.src = dataUrl;
    img.dataset.filename = `bookfly-${book.titulo.replace(/\s+/g, '-').toLowerCase()}.png`;
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  for (const word of words) {
    const testLine  = line + word + ' ';
    const metrics   = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line !== '') {
      ctx.fillText(line.trim(), x, currentY);
      line = word + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line.trim()) ctx.fillText(line.trim(), x, currentY);
}

function downloadShareCard() {
  const img = document.getElementById('sharePreviewImg');
  if (!img?.src) return;
  const a = document.createElement('a');
  a.href     = img.src;
  a.download = img.dataset.filename || 'bookfly-avaliacao.png';
  a.click();
  showToast('Imagem salva! Agora é só postar no Instagram 📸');
}

function openInstagram() {
  downloadShareCard();
  setTimeout(() => {
    window.open('https://www.instagram.com/', '_blank');
  }, 600);
}

function resetForm() {
  selectedBook = null; selectedStars = 0;
  document.getElementById('searchInput').value = '';
  document.getElementById('reviewText').value  = '';
  const shareSection = document.getElementById('shareSection');
  if (shareSection) shareSection.classList.remove('visible');
  updateStars(0); updateCharCount();
}

document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrap')) document.getElementById('searchResults').style.display = 'none';
});

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('themeToggleBtn');
  if (btn) renderThemeToggle(btn);
});
