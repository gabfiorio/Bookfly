requireAuth();

const YEAR = new Date().getFullYear();
document.getElementById('challengeYear').textContent = YEAR;

// ── Estado persistido no localStorage ──
function loadState() {
  try { return JSON.parse(localStorage.getItem('bf_desafio')) || {}; } catch { return {}; }
}
function saveState(s) { localStorage.setItem('bf_desafio', JSON.stringify(s)); }

let state = loadState();
if (!state[YEAR]) state[YEAR] = { meta: 12, livros: [] };

// Dados mock para demonstração
if (state[YEAR].livros.length === 0) {
  state[YEAR].livros = [
    { id:1, titulo:'Duna',      autor:'Frank Herbert',  emoji:'🏜️', mes:1, stars:5 },
    { id:2, titulo:'1984',      autor:'George Orwell',  emoji:'👁️', mes:2, stars:5 },
    { id:3, titulo:'Fundação',  autor:'Isaac Asimov',   emoji:'🌌', mes:2, stars:4 },
    { id:4, titulo:'Sapiens',   autor:'Y. N. Harari',   emoji:'🧠', mes:3, stars:4 },
  ];
  saveState(state);
}

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const MSGS   = ['','Começando bem! 🌱','Ótimo ritmo! 📖','Incrível, continue assim! 🔥',
                 'Você está arrasando! ⭐','Quase lá! 💪','Meta batida! 🎉🎉'];

function getMsgIdx(pct) {
  if (pct === 0)   return 0;
  if (pct < 25)    return 1;
  if (pct < 50)    return 2;
  if (pct < 75)    return 3;
  if (pct < 100)   return 4;
  if (pct < 100.1) return 5;
  return 5;
}

// ── Render ──
function render() {
  const { meta, livros } = state[YEAR];
  const lidos = livros.length;
  const pct   = Math.min(100, Math.round((lidos / meta) * 100));

  // Ring SVG
  const circ      = 2 * Math.PI * 52;
  const dashOffset = circ * (1 - pct / 100);
  const fill = document.getElementById('ringFill');
  fill.style.strokeDasharray  = circ;
  fill.style.strokeDashoffset = dashOffset;

  document.getElementById('ringRead').textContent   = lidos;
  document.getElementById('ringGoal').textContent   = meta;
  document.getElementById('challengePct').textContent = `${pct}%`;
  document.getElementById('challengeMsg').textContent  = MSGS[getMsgIdx(pct)];

  renderMonthly(livros);
  renderBooks(livros);
  renderHistory();
}

function renderMonthly(livros) {
  const counts = Array(12).fill(0);
  livros.forEach(b => { if (b.mes >= 1 && b.mes <= 12) counts[b.mes - 1]++; });
  const max = Math.max(...counts, 1);

  document.getElementById('monthlyGrid').innerHTML = counts.map((c, i) => `
    <div class="month-col">
      <div class="month-bar-wrap">
        <div class="month-bar" style="height:${Math.round((c/max)*64)+4}px"
             title="${c} livro${c!==1?'s':''}"></div>
      </div>
      <div class="month-count">${c || ''}</div>
      <div class="month-label">${MONTHS[i]}</div>
    </div>`).join('');
}

function renderBooks(livros) {
  const el = document.getElementById('challengeBooksList');
  if (!livros.length) {
    el.innerHTML = `<div class="empty-state-sm">Nenhum livro adicionado ainda. Comece agora!</div>`;
    return;
  }
  // Ordena por mês desc
  const sorted = [...livros].sort((a, b) => b.mes - a.mes);
  el.innerHTML = sorted.map((b, i) => `
    <div class="challenge-book-item" id="cb-${b.id}">
      <div class="cb-cover" id="cb-cover-${b.id}">${b.emoji}</div>
      <div class="cb-info">
        <div class="cb-title">${escapeHtml(b.titulo)}</div>
        <div class="cb-author">${escapeHtml(b.autor)}</div>
        <div class="cb-meta">
          <span class="cb-month">${MONTHS[b.mes - 1]}</span>
          ${b.stars ? `<span class="cb-stars">${renderStars(b.stars)}</span>` : ''}
        </div>
      </div>
      <button class="cb-remove" onclick="removeBook(${b.id})" title="Remover">×</button>
    </div>`).join('');

  // Capas
  sorted.forEach(b => applyCover(
    document.getElementById(`cb-cover-${b.id}`),
    b.titulo, b.autor, b.emoji,
    { width: 44, height: 62, radius: 5, fontSize: 22 }
  ));
}

function renderHistory() {
  const years = Object.keys(state)
    .map(Number)
    .filter(y => y !== YEAR)
    .sort((a, b) => b - a);

  const el = document.getElementById('historyList');
  if (!years.length) {
    el.innerHTML = `<div class="empty-state-sm">Seu histórico de anos anteriores aparecerá aqui.</div>`;
    return;
  }
  el.innerHTML = years.map(y => {
    const { meta, livros } = state[y];
    const pct = Math.min(100, Math.round((livros.length / meta) * 100));
    return `
      <div class="history-item">
        <div class="history-year">${y}</div>
        <div class="history-bar-wrap">
          <div class="history-bar">
            <div class="history-fill" style="width:${pct}%"></div>
          </div>
        </div>
        <div class="history-stat">${livros.length}/${meta} livros</div>
        <div class="history-pct">${pct}%</div>
      </div>`;
  }).join('');
}

// ── Ações ──
function editGoal() {
  const { meta } = state[YEAR];
  openModal({
    title: '🎯 Meta de leitura',
    size: 'sm',
    body: `
      <div style="display:flex;flex-direction:column;gap:8px">
        <label style="font-size:13px;font-weight:600;color:var(--brown-mid)">Quantos livros em ${YEAR}?</label>
        <input id="goal-input" class="bf-input" type="number" min="1" max="365"
               value="${meta}"
               style="border-radius:var(--radius-md);border:1.5px solid var(--beige-dark);font-size:22px;text-align:center;font-weight:700"/>
        <div class="goal-presets">
          ${[6,12,24,36,52].map(n => `<button class="goal-preset" onclick="document.getElementById('goal-input').value=${n}">${n}</button>`).join('')}
        </div>
      </div>`,
    buttons: [
      { label: 'Cancelar', type: 'ghost' },
      { label: 'Salvar', type: 'primary', closeOnClick: false, onClick: (close) => {
          const val = parseInt(document.getElementById('goal-input')?.value);
          if (!val || val < 1) { showToast('Meta inválida.', 'error'); return false; }
          state[YEAR].meta = val;
          saveState(state);
          render();
          close();
          showToast(`Meta: ${val} livros em ${YEAR}!`);
        },
      },
    ],
  });
}

function addChallengeBook() {
  const BOOKS_DB = [
    { id:1,  titulo:'Duna',              autor:'Frank Herbert',      emoji:'🏜️' },
    { id:2,  titulo:'1984',              autor:'George Orwell',      emoji:'👁️' },
    { id:3,  titulo:'Fundação',          autor:'Isaac Asimov',       emoji:'🌌' },
    { id:4,  titulo:'O Alquimista',      autor:'Paulo Coelho',       emoji:'✨' },
    { id:5,  titulo:'Crime e Castigo',   autor:'F. Dostoiévski',     emoji:'⚖️' },
    { id:6,  titulo:'O Senhor dos Anéis',autor:'J.R.R. Tolkien',     emoji:'💍' },
    { id:7,  titulo:'Sapiens',           autor:'Y. N. Harari',       emoji:'🧠' },
    { id:8,  titulo:'O Mestre e Margarida', autor:'M. Bulgakov',     emoji:'😈' },
  ];
  const monthOptions = MONTHS.map((m, i) => `<option value="${i+1}">${m}</option>`).join('');

  openModal({
    title: '📚 Adicionar livro lido',
    size: 'md',
    body: `
      <div style="display:flex;flex-direction:column;gap:14px">
        <div>
          <label class="modal-label">Livro *</label>
          <input id="add-titulo" class="bf-input" placeholder="Título do livro"
                 style="border-radius:var(--radius-md);border:1.5px solid var(--beige-dark)"/>
        </div>
        <div>
          <label class="modal-label">Autor</label>
          <input id="add-autor" class="bf-input" placeholder="Autor"
                 style="border-radius:var(--radius-md);border:1.5px solid var(--beige-dark)"/>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div>
            <label class="modal-label">Mês de conclusão</label>
            <select id="add-mes" class="bf-input"
                    style="border-radius:var(--radius-md);border:1.5px solid var(--beige-dark)">
              ${monthOptions}
            </select>
          </div>
          <div>
            <label class="modal-label">Nota</label>
            <select id="add-stars" class="bf-input"
                    style="border-radius:var(--radius-md);border:1.5px solid var(--beige-dark)">
              <option value="0">Sem nota</option>
              <option value="1">★☆☆☆☆</option>
              <option value="2">★★☆☆☆</option>
              <option value="3">★★★☆☆</option>
              <option value="4">★★★★☆</option>
              <option value="5" selected>★★★★★</option>
            </select>
          </div>
        </div>
      </div>`,
    buttons: [
      { label: 'Cancelar', type: 'ghost' },
      { label: 'Adicionar', type: 'primary', closeOnClick: false, onClick: (close) => {
          const titulo = document.getElementById('add-titulo')?.value.trim();
          const autor  = document.getElementById('add-autor')?.value.trim() || '';
          const mes    = parseInt(document.getElementById('add-mes')?.value) || new Date().getMonth() + 1;
          const stars  = parseInt(document.getElementById('add-stars')?.value) || 0;
          if (!titulo) { showToast('Título obrigatório.', 'error'); return false; }
          const emojis = ['📘','📗','📕','📙','📓'];
          const newBook = { id: Date.now(), titulo, autor, emoji: emojis[Math.floor(Math.random()*5)], mes, stars };
          state[YEAR].livros.push(newBook);
          saveState(state);
          render();
          close();
          showToast(`"${titulo}" adicionado!`);
        },
      },
    ],
  });
}

function removeBook(id) {
  confirmModal({
    title: 'Remover livro',
    message: 'Tem certeza que deseja remover este livro do desafio?',
    confirmLabel: 'Remover',
    onConfirm: () => {
      state[YEAR].livros = state[YEAR].livros.filter(b => b.id !== id);
      saveState(state);
      render();
      showToast('Livro removido.');
    },
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('themeToggleBtn');
  if (btn) renderThemeToggle(btn);
});

render();
