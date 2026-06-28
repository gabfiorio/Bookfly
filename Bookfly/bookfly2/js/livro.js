
const AVATAR_COLORS = ['#8681BD', '#F7A8B8', '#F2956A', '#A8D5BA', '#F5D97E', '#b0acda'];

const params = new URLSearchParams(window.location.search);
const bookId = parseInt(params.get('id')) || 1;
let book = null;
let SHELVES = LibraryData.getShelves();
const SHELF_STATUS = ['Nenhuma', 'Quero ler', 'Lendo', 'Lido'];
let userStatus = 0;
let REVIEW_STARS = 5;

initBookPage();

// ─────────────────────────────────────────────
// INICIALIZAÇÃO
// ─────────────────────────────────────────────

async function initBookPage() {
  const loadingState = document.getElementById('bookLoadingState');

  try {
    book = await fetchBookById(bookId);
  } catch (err) {
    console.warn('Livro: fallback sem dados da API.', err);
    book = null;
  }

  if (!book) {
    loadingState?.remove();
    document.getElementById('pageWrap').innerHTML = `
      <div style="text-align:center;padding:80px 20px">
        <div style="font-size:48px;margin-bottom:16px">📚</div>
        <h2 style="font-family:var(--font-display)">Livro não encontrado</h2>
        <a href="home.html" class="bf-btn bf-btn-primary" style="margin-top:24px;display:inline-flex">← Voltar ao feed</a>
      </div>`;
    return;
  }

  loadingState?.remove();
  await renderBook();
}

// ─────────────────────────────────────────────
// LIVRO — RENDER PRINCIPAL
// ─────────────────────────────────────────────

async function renderBook() {
  document.title = `Bookfly — ${book.titulo}`;
  syncStatusFromShelves();

  const coverUrl = book.urlImagem || book.url_imagem || '';
  const fallbackCover = book.emoji || '📚';
  const coverOptions = { width: 120, height: 174, radius: 10, fontSize: 64 };

  document.getElementById('heroCover').innerHTML = coverHtml(coverUrl, fallbackCover, coverOptions);
  document.getElementById('heroTitle').textContent = book.titulo;
  document.getElementById('heroAuthor').textContent = `${book.autor} · ${book.ano}`;
  document.getElementById('heroMeta').textContent = `${book.paginas || 0} páginas · ${book.editora || 'Editora não informada'}`;
  document.getElementById('heroGenre').textContent = book.genero;
  document.getElementById('heroDesc').innerHTML = renderExpandableText(
    book.desc || book.sinopse || 'Sem sinopse disponível.',
    `book-desc-${bookId}`,
    420
  );

  if (!coverUrl) {
    applyCover(document.getElementById('heroCover'), book.titulo, book.autor, fallbackCover, coverOptions);
  }

  const starsRounded = Math.round(book.mediaGlobal || 0);
  document.getElementById('heroRating').innerHTML = `
    <span class="hero-stars">${renderStars(starsRounded)}</span>
    <span class="hero-avg">${book.mediaGlobal || 0}</span>
    <span class="hero-total">(${(book.totalAvaliacoes || 0).toLocaleString('pt-BR')} avaliações)</span>`;

  renderShelfActions();
  renderReviews();
  renderReaders();
  renderDetails();
}

// ─────────────────────────────────────────────
// ESTANTE
// ─────────────────────────────────────────────

let selectedShelfId = null; // Armazena a estante atual do livro

// Ícones para cada status
function shelfStatusIcon() {
  return ['📌', '🔖', '📖', '✅'][userStatus] || '📌';
}

// Sincroniza o status do livro a partir da API
async function syncStatusFromShelves() {
  try {
    const token = localStorage.getItem('bf_token');
    const res = await fetch("https://bookfly-wp02.onrender.com/estante-livros", {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }
    });
    const all = await res.json();
    
    // Procura o livro atual nas estantes do usuário
    const entry = all.find(x => (x.livroId === bookId || (x.livro && x.livro.id === bookId)));
    
    if (entry) {
      userStatus = entry.statusLeitura || 0;
      selectedShelfId = entry.estanteId || (entry.estante && entry.estante.id);
    } else {
      userStatus = 0;
      selectedShelfId = null;
    }
  } catch (err) {
    console.error("Erro ao sincronizar status:", err);
    userStatus = 0;
  }
}

// Aplica o status (Quero ler, Lendo, Lido ou Nenhuma)
async function applyStatusToShelves(statusIdx) {
  const token = localStorage.getItem('bf_token');
  
  // Se o status for 0 (Nenhuma), deveríamos remover ou desativar? 
  // Baseado no seu código, vamos tratar como atualização ou novo registro
  
  try {
    const check = await fetch("https://bookfly-wp02.onrender.com/estante-livros", {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }
    });
    const all = await check.json();

    // Tenta encontrar se o livro já está em alguma estante
    const existing = all.find(x => (x.livroId === bookId || (x.livro && x.livro.id === bookId)));

    if (existing) {
      // Se já existe, apenas atualiza o status
      await fetch(`https://bookfly-wp02.onrender.com/estante-livros/${existing.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...existing,
          statusLeitura: statusIdx,
          ativo: statusIdx !== 0 // Se status for 0, marcamos como inativo
        })
      });
    } else if (statusIdx !== 0) {
      // Se não existe e o status não é "Nenhuma", precisamos de uma estante padrão ou pedir para selecionar
      if (!selectedShelfId) {
        // Se não tem estante selecionada, abre o menu para o usuário escolher
        openStatusMenu();
        return;
      }

      await fetch("https://bookfly-wp02.onrender.com/estante-livros", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          estanteId: selectedShelfId,
          livroId: bookId,
          ativo: true,
          statusLeitura: statusIdx,
          paginaAtual: statusIdx === 2 ? 0 : null,
          favorito: false,
          iniciadoEm: new Date().toISOString()
        })
      });
    }
    
    await syncStatusFromShelves();
    renderShelfActions();
  } catch (err) {
    console.error("Erro ao aplicar status:", err);
    showToast("Erro ao atualizar estante", "error");
  }
}

async function cycleStatus() {
  // Se o livro não está em nenhuma estante, primeiro abre o menu para escolher a estante
  if (!selectedShelfId && userStatus === 0) {
    openStatusMenu();
    return;
  }

  userStatus = (userStatus + 1) % SHELF_STATUS.length;
  await applyStatusToShelves(userStatus);

  showToast(
    userStatus === 0
      ? "Removido da estante"
      : `Marcado como: ${SHELF_STATUS[userStatus]}`
  );
}

async function setShelf(estanteId) {
  selectedShelfId = estanteId;
  // Ao selecionar uma estante, define o status inicial como "Quero ler" (1)
  await applyStatusToShelves(1);

  document.getElementById("bf-modal-overlay")?.remove();
  showToast("Livro adicionado à estante");
}

function renderShelfActions() {
  const label = (userStatus === 0) ? "Adicionar à estante" : SHELF_STATUS[userStatus];

  const container = document.getElementById("heroActions");
  if (!container) return;

  container.innerHTML = `
    <div class="shelf-actions">
      <div class="shelf-status-wrap">
        <button class="shelf-status-btn" onclick="cycleStatus()">
          ${shelfStatusIcon()} ${label}
        </button>
      </div>
      <button class="bf-btn bf-btn-ghost shelf-action-btn" onclick="openStatusMenu()">
        🗂️ Estantes
      </button>
    </div>
  `;
}

async function openStatusMenu() {
  try {
    const token = localStorage.getItem('bf_token');
    const res = await fetch("https://bookfly-wp02.onrender.com/estantes", {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }
    });
    const estantes = await res.json();

    if (!estantes || estantes.length === 0) {
      showToast("Você não tem estantes criadas.", "error");
      return;
    }

    openModal({
      title: "📚 Suas estantes",
      size: "sm",
      body: estantes.map(e => `
        <div class="status-menu-item ${e.id === selectedShelfId ? 'active' : ''}" onclick="setShelf(${e.id})">
          📁 ${e.nome} ${e.id === selectedShelfId ? '✓' : ''}
        </div>
      `).join(""),
      buttons: []
    });
  } catch (err) {
    console.error("Erro ao carregar estantes:", err);
    showToast("Erro ao carregar estantes", "error");
  }
}

/*
function applyStatusToShelves(statusIdx) {
  removeBookFromAllShelves();
  const payload = shelfBookPayload();

  if (statusIdx === 1) SHELVES.quererlev.push(payload);
  if (statusIdx === 2) SHELVES.lendo.push({ ...payload, pagina: 0, total: book.paginas || null });
  if (statusIdx === 3) SHELVES.lidos.push(payload);

  LibraryData.setShelves(SHELVES);
}

function syncStatusFromShelves() {
  SHELVES = LibraryData.getShelves();
  if ((SHELVES.lidos || []).some((b) => b.id === bookId)) userStatus = 3;
  else if ((SHELVES.lendo || []).some((b) => b.id === bookId)) userStatus = 2;
  else if ((SHELVES.quererlev || []).some((b) => b.id === bookId)) userStatus = 1;
  else userStatus = 0;
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
      <button class="bf-btn bf-btn-ghost shelf-action-btn" onclick="addBookToFolder()">🗂️ Adicionar à pasta</button>
    </div>`;
}

function shelfStatusIcon() {
  return ['📌', '🔖', '📖', '✅'][userStatus];
}

function cycleStatus() {
  userStatus = (userStatus + 1) % SHELF_STATUS.length;
  applyStatusToShelves(userStatus);
  renderShelfActions();
  showToast(userStatus === 0 ? 'Removido da estante' : `Marcado como: ${SHELF_STATUS[userStatus]}`);
}

function openStatusMenu() {
  openModal({
    title: '📚 Adicionar à estante',
    size: 'sm',
    body: SHELF_STATUS.map((s, i) => `
      <div class="status-menu-item ${i === userStatus ? 'active' : ''}" onclick="setStatus(${i})">
        <span>${['📌', '🔖', '📖', '✅'][i]}</span> ${s}
        ${i === userStatus ? '<span class="status-check">✓</span>' : ''}
      </div>`).join(''),
    buttons: [],
  });
}

function setStatus(idx) {
  userStatus = idx;
  applyStatusToShelves(idx);
  document.getElementById('bf-modal-overlay')?.remove();
  renderShelfActions();
  showToast(idx === 0 ? 'Removido da estante' : `Marcado como: ${SHELF_STATUS[idx]}`);
}
*/
// ─────────────────────────────────────────────
// PASTAS
// ─────────────────────────────────────────────

function addBookToFolder() {
  const folders = LibraryData.getFolders();
  if (!folders.length) {
    showToast('Crie uma pasta no Perfil primeiro.', 'error');
    return;
  }

  openModal({
    title: '🗂️ Adicionar livro à pasta',
    size: 'sm',
    body: `
      <div style="display:flex;flex-direction:column;gap:8px">
        ${folders.map((f) => `
          <button class="status-menu-item" onclick="confirmAddBookToFolder('${f.id}')">
            <span>${f.type === 'autor' ? '✍️' : '📚'}</span>
            ${escapeHtml(f.name)}
          </button>`).join('')}
      </div>`,
    buttons: [],
  });
}

function confirmAddBookToFolder(folderId) {
  const ok = LibraryData.addBookToFolder(bookId, folderId);
  document.getElementById('bf-modal-overlay')?.remove();
  if (!ok) {
    showToast('Não foi possível adicionar à pasta.', 'error');
    return;
  }
  showToast('Livro adicionado à pasta!');
}

// ─────────────────────────────────────────────
// AVALIAÇÕES — API
// ─────────────────────────────────────────────

async function carregarAvaliacoes(livroId) {
  try {
    const token = localStorage.getItem('bf_token');

    const resposta = await fetch(
      `https://bookfly-wp02.onrender.com/avaliacoes-livros/${livroId}`,
      {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    if (!resposta.ok) {
      console.error('Erro HTTP:', resposta.status);
      return [];
    }

    const texto = await resposta.text();
    if (!texto?.trim()) return [];

    const dados = JSON.parse(texto);
    return Array.isArray(dados) ? dados : [dados];
  } catch (erro) {
    console.error('Erro ao carregar avaliações:', erro);
    return [];
  }
}

async function getCommunityReviews() {
  try {
    const avaliacoes = await carregarAvaliacoes(bookId); // ← passa o id direto

    return avaliacoes.map((a) => ({
      id: a.id,
      nome: a.usuarioNome || 'Leitor',
      stars: Number(a.nota) || 0,
      texto: a.review || '',
      data: a.dataCriacao,
      curtidas: 0,
      spoiler: a.contemSpoiler,
      cor: '#8681BD',
    }));
  } catch (erro) {
    console.error('Erro ao obter avaliações:', erro);
    return [];
  }
}

async function enviarAvaliacaoLivro(livroId, nota, review, contemSpoiler = false) {
  const token = localStorage.getItem('bf_token'); 

  console.log('Token:', token);
  console.log('Payload:', { livroId, nota, review, contemSpoiler });

  const resposta = await fetch('https://bookfly-wp02.onrender.com/avaliacoes-livros', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ livroId, nota, review, contemSpoiler }),
  });

  return resposta;
}

// ─────────────────────────────────────────────
// AVALIAÇÕES — SUBMIT  ← FUNÇÃO QUE ESTAVA FALTANDO
// ─────────────────────────────────────────────

async function submitBookComment() {
  const texto = document.getElementById('newReviewText')?.value.trim();
  const spoiler = document.getElementById('spoilerCheck')?.checked || false;

  if (!texto) {
    showToast('Escreva um comentário antes de publicar.', 'error');
    return;
  }

  const btn = document.querySelector('.review-publish-btn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Publicando...';
  }

  try {
    const resposta = await enviarAvaliacaoLivro(bookId, REVIEW_STARS, texto, spoiler);

    if (!resposta.ok) {
      const erro = await resposta.text().catch(() => '');
      console.error('Erro ao publicar:', resposta.status, erro);
      showToast('Erro ao publicar comentário. Tente novamente.', 'error');
      return;
    }

    showToast('Comentário publicado com sucesso!');
    REVIEW_STARS = 5;
    await renderReviews();
  }  catch (err) {
  
    if (err.message === 'Failed to fetch') {
      showToast('Você ja avaliou esse livro.', 'error');
    } else {
      showToast('Erro inesperado. Tente novamente.', 'error');
    }
    console.error('Erro ao submeter comentário:', err);
  
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Publicar comentário';
    }
  }
}

// ─────────────────────────────────────────────
// AVALIAÇÕES — RENDER
// ─────────────────────────────────────────────

async function renderReviews() {
  const reviewsList = document.getElementById('reviewsList');
  const reviewsSummary = document.getElementById('reviewsSummary');

  if (!reviewsList || !reviewsSummary) {
    console.error('reviewsList ou reviewsSummary não encontrados');
    return;
  }

  try {
    const reviews = await getCommunityReviews();
    const total = reviews.length;
    const avg = total
      ? (reviews.reduce((s, r) => s + r.stars, 0) / total).toFixed(1)
      : '-';
    const avgStars = total ? Math.round(Number(avg)) : 0;

    const dist = [5, 4, 3, 2, 1].map((s) => ({
      s,
      count: reviews.filter((r) => r.stars === s).length,
      pct: total
        ? Math.round((reviews.filter((r) => r.stars === s).length / total) * 100)
        : 0,
    }));

    reviewsSummary.innerHTML = `
      <div class="reviews-avg">
        <div class="reviews-avg-num">${avg}</div>
        <div class="reviews-avg-stars">${renderStars(avgStars)}</div>
        <div class="reviews-avg-count">${total} avaliações nesta comunidade</div>
      </div>
      <div class="reviews-dist">
        ${dist
          .map(
            (d) => `
          <div class="dist-row">
            <span class="dist-label">${d.s}★</span>
            <div class="dist-bar">
              <div class="dist-fill" style="width:${d.pct}%"></div>
            </div>
            <span class="dist-pct">${d.pct}%</span>
          </div>`
          )
          .join('')}
      </div>`;

    reviewsList.innerHTML = `
      <div class="review-composer">
        <h4>Deixe seu comentário</h4>
        <div class="review-composer-row">
          <div class="review-star-picker" role="radiogroup">
            ${[1, 2, 3, 4, 5]
              .map(
                (stars) => `
              <button
                type="button"
                data-stars="${stars}"
                class="review-star-btn ${stars <= REVIEW_STARS ? 'active' : ''}"
                onclick="selectReviewStars(${stars})">
                ★
              </button>`
              )
              .join('')}
          </div>
          <div class="review-star-caption" id="reviewStarCaption">
            ${REVIEW_STARS} de 5 estrelas
          </div>
        </div>
        <textarea
          id="newReviewText"
          class="review-compose-input"
          maxlength="500"
          placeholder="Escreva seu comentário sobre este livro...">
        </textarea>
        <label class="spoiler-check">
          <input type="checkbox" id="spoilerCheck"> Contém spoiler
        </label>
        <button
          class="bf-btn bf-btn-primary review-publish-btn"
          onclick="submitBookComment()">
          Publicar comentário
        </button>
      </div>

      ${
        reviews.length
          ? reviews
              .map(
                (r, i) => `
            <div class="review-card" style="animation-delay:${i * 0.06}s">
              <div class="review-header">
                <div class="review-avatar" style="background:${r.cor}">
                  ${initials(r.nome)}
                </div>
                <div class="review-meta">
                  <div class="review-name">${escapeHtml(r.nome)}</div>
                  <div class="review-stars">${renderStars(r.stars)}</div>
                </div>
                <div class="review-date">${formatDate(r.data)}</div>
              </div>
              <p class="review-text">${escapeHtml(r.texto)}</p>
            </div>`
              )
              .join('')
          : `<div class="empty-state">
              <div>💬</div>
              <p>Seja o primeiro a comentar este livro!</p>
            </div>`
      }`;
  } catch (erro) {
    console.error('Erro ao renderizar avaliações:', erro);
    reviewsSummary.innerHTML = '';
    reviewsList.innerHTML = `
      <div class="review-composer">
        <h4>Deixe seu comentário</h4>
        <textarea
          id="newReviewText"
          class="review-compose-input"
          maxlength="500"
          placeholder="Escreva seu comentário sobre este livro...">
        </textarea>
        <button class="bf-btn bf-btn-primary" onclick="submitBookComment()">
          Publicar comentário
        </button>
      </div>
      <div class="empty-state">
        <div>⚠️</div>
        <p>Não foi possível carregar avaliações.</p>
      </div>`;
  }
}

// ─────────────────────────────────────────────
// ESTRELAS
// ─────────────────────────────────────────────

function syncReviewStarsPicker(activeStars = REVIEW_STARS) {
  document.querySelectorAll('.review-star-btn').forEach((btn) => {
    const stars = parseInt(btn.dataset.stars || '0', 10);
    const isActive = stars <= activeStars;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
  const caption = document.getElementById('reviewStarCaption');
  if (caption) caption.textContent = `${activeStars} de 5 estrelas`;
}

function selectReviewStars(stars) {
  REVIEW_STARS = stars;
  syncReviewStarsPicker(stars);
}

function previewReviewStars(stars) {
  syncReviewStarsPicker(stars);
}

function likeReview(btn, base) {
  const isLiked = btn.dataset.liked === '1';
  btn.dataset.liked = isLiked ? '0' : '1';
  btn.classList.toggle('liked', !isLiked);
  btn.innerHTML = `${isLiked ? '♡' : '♥'} <span>${base + (isLiked ? 0 : 1)}</span>`;
}

// ─────────────────────────────────────────────
// LEITORES / DETALHES / ABAS
// ─────────────────────────────────────────────

function renderReaders() {
  document.getElementById('readersList').innerHTML =
    '<div class="empty-state"><div>👥</div><p>Nenhum leitor disponível no momento.</p></div>';
}

function renderDetails() {
  const coverUrl = book.urlImagem || book.url_imagem || '';
  const items = [
    { label: 'Título', value: book.titulo },
    { label: 'Autor', value: book.autor },
    { label: 'Imagem', value: coverUrl },
    { label: 'Gênero', value: book.genero },
    { label: 'Ano', value: book.ano },
    { label: 'Páginas', value: book.paginas },
    { label: 'Editora', value: book.editora },
    { label: 'ISBN', value: book.isbn },
  ];
  document.getElementById('detailsGrid').innerHTML = items
    .map(
      (d) => `
    <div class="detail-item">
      <div class="detail-label">${d.label}</div>
      <div class="detail-value">${d.value}</div>
    </div>`
    )
    .join('');
}

function switchTab(key, btn) {
  document.querySelectorAll('.tab-pane').forEach((p) => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
  document.getElementById(`tab-${key}`).classList.add('active');
  btn.classList.add('active');
}

// ─────────────────────────────────────────────
// TEMA
// ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('themeToggleBtn');
  if (btn) renderThemeToggle(btn);
});

// ─────────────────────────────────────────────
// CADASTRO DE LIVRO (handleLivro)
// ─────────────────────────────────────────────

async function handleLivro() {
  const titulo = document.getElementById('titulo')?.value.trim();
  const url_imagem = document.getElementById('url_imagem')?.value.trim();
  const categoria = document.getElementById('categoria')?.value.trim();
  const autor = document.getElementById('autor')?.value.trim();
  const ano = document.getElementById('ano')?.value.trim();
  const paginas = document.getElementById('paginas')?.value.trim();
  const editora = document.getElementById('editora')?.value.trim();
  const isbn = document.getElementById('isbn')?.value.trim();
  const sinopse = document.getElementById('sinopse')?.value.trim();

  const alertEl = document.getElementById('alertMsg');
  const btn = document.getElementById('submitBtn');
  const txt = document.getElementById('btnText');
  const spin = document.getElementById('spinner');

  // Validação básica
  if (!titulo || !autor) {
    if (alertEl) {
      alertEl.textContent = 'Título e autor são obrigatórios.';
      alertEl.style.display = 'block';
    }
    return;
  }

  // Estado de carregamento
  if (btn) btn.disabled = true;
  if (txt) txt.textContent = 'Salvando...';
  if (spin) spin.style.display = 'inline-block';
  if (alertEl) alertEl.style.display = 'none';

  try {
    const resposta = await fetch('https://bookfly-wp02.onrender.com/livros', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Auth.getToken()}`,
      },
      body: JSON.stringify({ titulo, url_imagem, categoria, autor, ano, paginas, editora, isbn, sinopse }),
    });

    if (!resposta.ok) {
      throw new Error(`Erro ${resposta.status}`);
    }

    showToast('Livro cadastrado com sucesso!');
    // Redireciona ou limpa o formulário conforme necessário
    // window.location.href = 'home.html';
  } catch (err) {
    console.error('Erro ao cadastrar livro:', err);
    if (alertEl) {
      alertEl.textContent = 'Erro ao cadastrar o livro. Tente novamente.';
      alertEl.style.display = 'block';
    }
  } finally {
    if (btn) btn.disabled = false;
    if (txt) txt.textContent = 'Salvar';
    if (spin) spin.style.display = 'none';
  }
}