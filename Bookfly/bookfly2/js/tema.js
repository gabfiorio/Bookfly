/* ============================================================
   BOOKFLY — tema.js
   Dark / Light mode com persistência
   ============================================================ */

(function initTheme() {
  const saved = localStorage.getItem('bf_tema') || 'light';
  if (saved === 'dark') document.documentElement.classList.add('dark');
})();

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('bf_tema', isDark ? 'dark' : 'light');
  // Atualiza ícone em todos os botões da página
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.textContent = isDark ? '☀️' : '🌙';
    btn.title = isDark ? 'Modo claro' : 'Modo escuro';
  });
}

function renderThemeToggle(el) {
  const isDark = document.documentElement.classList.contains('dark');
  el.textContent = isDark ? '☀️' : '🌙';
  el.title       = isDark ? 'Modo claro' : 'Modo escuro';
}
