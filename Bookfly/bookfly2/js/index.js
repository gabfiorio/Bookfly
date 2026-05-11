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
