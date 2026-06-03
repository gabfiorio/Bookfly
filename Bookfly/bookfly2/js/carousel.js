function renderCarouselBooks(books = []) {
  const track = document.getElementById('carouselTrack');
  if (!track) return;

  if (!books.length) {
    track.innerHTML = '<div class="carousel-empty">Nenhum livro disponível no momento.</div>';
    return;
  }

  track.innerHTML = '';

  books.concat(books).forEach((book) => {
    const div = document.createElement('div');
    div.className = 'carousel-book';
    div.style.background = book.bg || '#8681BD';
    div.title = book.title || '';
    div.innerHTML = `
      ${book.coverUrl
        ? coverHtml(book.coverUrl, book.emoji || '📚', { width: 84, height: 120, radius: 7, fontSize: 34 })
        : `
          <div class="carousel-book-spine" style="background:${book.spine || '#5f5a8a'}"></div>
          <span class="carousel-book-emoji">${book.emoji || '📚'}</span>
        `}
      <div class="carousel-book-title">${escapeHtml(book.title || 'Livro')}</div>
    `;
    track.appendChild(div);
  });
}
