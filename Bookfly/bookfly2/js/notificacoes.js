requireAuth();

const AVATAR_COLORS = ['#8681BD','#F7A8B8','#F2956A','#A8D5BA','#F5D97E','#b0acda'];

let NOTIFS = [
  { id:1,  tipo:'curtida',    lida:false, nome:'Maria Oliveira', cor:AVATAR_COLORS[1], msg:'curtiu seu post sobre <strong>Duna</strong>',          tempo:'2min',   href:'home.html' },
  { id:2,  tipo:'comentario', lida:false, nome:'João Silva',     cor:AVATAR_COLORS[2], msg:'comentou no seu post: <em>"Concordo demais!"</em>',       tempo:'15min',  href:'home.html' },
  { id:3,  tipo:'seguidor',   lida:false, nome:'Ana Costa',      cor:AVATAR_COLORS[3], msg:'começou a te seguir',                                    tempo:'1h',     href:'perfil.html' },
  { id:4,  tipo:'curtida',    lida:false, nome:'Pedro Mendes',   cor:AVATAR_COLORS[0], msg:'curtiu sua avaliação de <strong>1984</strong>',          tempo:'2h',     href:'livro.html?id=2' },
  { id:5,  tipo:'comentario', lida:true,  nome:'Maria Oliveira', cor:AVATAR_COLORS[1], msg:'respondeu seu comentário em <strong>O Alquimista</strong>', tempo:'1 dia', href:'livro.html?id=4' },
  { id:6,  tipo:'seguidor',   lida:true,  nome:'Lucas Ferreira', cor:AVATAR_COLORS[4], msg:'começou a te seguir',                                    tempo:'2 dias', href:'perfil.html' },
  { id:7,  tipo:'curtida',    lida:true,  nome:'Ana Costa',      cor:AVATAR_COLORS[3], msg:'curtiu seu post sobre <strong>Fundação</strong>',        tempo:'3 dias', href:'home.html' },
  { id:8,  tipo:'conquista',  lida:true,  nome:'Bookfly',        cor:'#F2956A',        msg:'🏆 Você conquistou <strong>"Leitor Assíduo"</strong> — 10 livros lidos!', tempo:'1 sem', href:'perfil.html' },
];

let activeFilter = 'todas';

const TIPO_ICON = { curtida:'❤️', comentario:'💬', seguidor:'👤', conquista:'🏆' };

function renderNotifs(list) {
  const container = document.getElementById('notifList');
  if (!list.length) {
    container.innerHTML = `<div class="notif-empty"><div>🔔</div><p>Nenhuma notificação aqui.</p></div>`;
    return;
  }
  container.innerHTML = list.map((n, i) => `
    <div class="notif-item ${n.lida ? 'read' : 'unread'}" id="notif-${n.id}" style="animation-delay:${i*0.05}s">
      <div class="notif-avatar" style="background:${n.cor}">
        ${n.nome === 'Bookfly' ? '🦋' : initials(n.nome)}
      </div>
      <div class="notif-body">
        <div class="notif-text">
          <strong>${escapeHtml(n.nome)}</strong> <span>${n.msg}</span>
        </div>
        <div class="notif-time">${n.tempo} atrás</div>
      </div>
      <div class="notif-right">
        <span class="notif-type-icon">${TIPO_ICON[n.tipo] || '🔔'}</span>
        ${!n.lida ? `<button class="notif-mark" onclick="markRead(${n.id})" title="Marcar como lida">✓</button>` : ''}
      </div>
    </div>`).join('');

  updateMarkAllBtn();
}

function filterNotif(tipo, btn) {
  activeFilter = tipo;
  document.querySelectorAll('.notif-filter').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const filtered = tipo === 'todas' ? NOTIFS : NOTIFS.filter(n => n.tipo === tipo.slice(0,-1) || n.tipo + 's' === tipo || n.tipo === tipo);
  // Map filter keys to tipo values
  const map = { curtidas:'curtida', comentarios:'comentario', seguidores:'seguidor', todas:null };
  const key = map[tipo];
  renderNotifs(key ? NOTIFS.filter(n => n.tipo === key) : NOTIFS);
}

function markRead(id) {
  const n = NOTIFS.find(n => n.id === id);
  if (!n) return;
  n.lida = true;
  const el = document.getElementById(`notif-${id}`);
  el?.classList.replace('unread', 'read');
  el?.querySelector('.notif-mark')?.remove();
  updateMarkAllBtn();
}

function markAllRead() {
  NOTIFS.forEach(n => n.lida = true);
  renderNotifs(NOTIFS);
}

function updateMarkAllBtn() {
  const hasUnread = NOTIFS.some(n => !n.lida);
  const btn = document.getElementById('markAllBtn');
  if (btn) { btn.style.display = hasUnread ? '' : 'none'; }
}

renderNotifs(NOTIFS);

// Init theme toggle icon
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('themeToggleBtn');
  if (btn) renderThemeToggle(btn);
});
