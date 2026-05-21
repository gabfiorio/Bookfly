const CAROUSEL_BOOKS = [
  { emoji: '🏜️', title: 'Duna',                      bg: '#c4955a', spine: '#a07040' },
  { emoji: '👁️', title: '1984',                      bg: '#3a3a4a', spine: '#252530' },
  { emoji: '🌌', title: 'Fundação',                   bg: '#2a3a5c', spine: '#1a2540' },
  { emoji: '✨', title: 'O Alquimista',               bg: '#8681BD', spine: '#5f5a8a' },
  { emoji: '⚖️', title: 'Crime e Castigo',           bg: '#6b4c3b', spine: '#4a3028' },
  { emoji: '💍', title: 'O Senhor dos Anéis',        bg: '#4a5e3a', spine: '#303e25' },
  { emoji: '⚡', title: 'Harry Potter',               bg: '#7a3060', spine: '#521040' },
  { emoji: '📖', title: 'A Menina que Roubava Livros', bg: '#b04a3a', spine: '#803020' },
  { emoji: '🧠', title: 'Sapiens',                    bg: '#2a5050', spine: '#1a3535' },
  { emoji: '😈', title: 'O Mestre e Margarida',      bg: '#3d2060', spine: '#280d45' },
  { emoji: '🌊', title: 'Moby Dick',                  bg: '#1a4a6a', spine: '#0d2e45' },
  { emoji: '🌹', title: 'Dom Casmurro',               bg: '#8b3252', spine: '#5e1f38' },
  { emoji: '🔥', title: 'Fahrenheit 451',             bg: '#b84a20', spine: '#7a2c0d' },
  { emoji: '🦋', title: 'Cem Anos de Solidão',       bg: '#8a6020', spine: '#5c3e10' },
];

(function initCarousel() {
  const track = document.getElementById('carouselTrack');
  if (!track) return;

  [...CAROUSEL_BOOKS, ...CAROUSEL_BOOKS].forEach(b => {
    const div = document.createElement('div');
    div.className = 'carousel-book';
    div.style.background = b.bg;
    div.title = b.title;
    div.innerHTML = `
      <div class="carousel-book-spine" style="background:${b.spine}"></div>
      <span class="carousel-book-emoji">${b.emoji}</span>
      <div class="carousel-book-title">${b.title}</div>
    `;
    track.appendChild(div);
  });
})();
