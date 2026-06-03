if (typeof Auth !== 'undefined' && Auth.isLogged()) window.location.href = Auth.getLandingPage();

function renderCommunityFeed(books) {
  const feed = document.getElementById('communityFeed');
  if (!feed) return;

  if (!books.length) {
    feed.innerHTML = '<div class="community-item community-item-loading">Nenhum livro disponível no momento.</div>';
    return;
  }

  const templates = [
    (book) => `A comunidade está lendo <strong>${escapeHtml(book.titulo)}</strong>`,
    (book) => `Novo destaque: <strong>${escapeHtml(book.titulo)}</strong> por ${escapeHtml(book.autor)}`,
    (book) => `${escapeHtml(book.autor)} entrou no radar com <strong>${escapeHtml(book.titulo)}</strong>`,
  ];

  feed.innerHTML = books.slice(0, 3).map((book, index) => `
    <div class="community-item">
      <div class="dot"></div>
      <span>${templates[index % templates.length](book)}</span>
    </div>
  `).join('');
}

async function loadHomeBooks() {
  try {
    const books = await fetchBooksCatalog();
    const carouselBooks = books.slice(0, 14).map((book, index) => ({
      emoji: book.emoji || '📚',
      coverUrl: book.urlImagem || book.url_imagem || '',
      title: book.titulo,
      bg: ['#c4955a', '#3a3a4a', '#2a3a5c', '#8681BD', '#6b4c3b', '#4a5e3a'][index % 6],
      spine: ['#a07040', '#252530', '#1a2540', '#5f5a8a', '#4a3028', '#303e25'][index % 6],
    }));

    if (typeof renderCarouselBooks === 'function') {
      renderCarouselBooks(carouselBooks);
    }

    renderCommunityFeed(books);
  } catch (err) {
    console.warn('Home: não foi possível carregar os livros.', err);
    renderCommunityFeed([]);
    if (typeof renderCarouselBooks === 'function') {
      renderCarouselBooks([]);
    }
  }
}

const stars = document.querySelectorAll('.star');
stars.forEach((s, i) => {
  s.addEventListener('mouseenter', () => {
    stars.forEach((st, j) => {
      st.style.color = j <= i ? '#fff' : 'rgba(255,255,255,0.35)';
    });
  });
  s.addEventListener('mouseleave', () => {
    stars.forEach(st => st.style.color = '#fff');
  });
});

document.addEventListener('DOMContentLoaded', () => {
  loadHomeBooks();
});
