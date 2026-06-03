
requireAuth();

const AVATAR_COLORS = ['#8681BD','#F7A8B8','#F2956A','#A8D5BA','#F5D97E','#b0acda'];

let BOOKS = [];
let USERS = [];
const currentUser = Auth.getUser();

let activeTab = 'livros';

function getPopularBooks() {
  return [...BOOKS]
    .sort((a, b) => (b.nota || 0) - (a.nota || 0))
    .slice(0, 10);
}

async function loadBooksFromApi() {
  try {
    const apiBooks = await fetchBooksCatalog();
    if (Array.isArray(apiBooks) && apiBooks.length) {
      BOOKS = apiBooks;
      return;
    }
  } catch (err) {
    console.warn('Busca: catálogo indisponível.', err);
  }

  BOOKS = [];
}

function normalizeUserFromApi(raw, index = 0) {
  const nome = String(firstDefined(raw.username, raw.nome, raw.name, raw.email, 'Leitor'));

  return {
    id: firstDefined(raw.id, raw.userId, raw.usuarioId, index + 1),
    nome,
    livros: raw.livros || raw.totalLivros || 0,
    seguidores: raw.seguidores || raw.totalSeguidores || 0,
    cor: AVATAR_COLORS[index % AVATAR_COLORS.length],
    bio: firstDefined(raw.biografia, raw.bio, raw.descricao, raw.email, ''),
    urlImagem: firstDefined(raw.urlImagem, raw.url_imagem, raw.avatar, ''),
    isFollowing: false,
  };
}

async function getFollowingIds() {
  if (!currentUser?.id) return new Set();

  try {
    const response = await apiFetch(`/seguidorUsuario/api/seguindo?usuarioId=${currentUser.id}`);
    if (!response || response.status === 204) return new Set();
    if (!response.ok) throw new Error('Falha ao carregar seguindo.');

    const payload = await response.json().catch(() => []);
    const list = extractArrayPayload(payload);
    return new Set(list.map((item) => Number(firstDefined(item.seguidoID, item.SeguidoID, item.seguidoId))));
  } catch (err) {
    console.warn('Busca: seguindo indisponível.', err);
    return new Set();
  }
}

async function getFollowersCount(userId) {
  try {
    const response = await apiFetch(`/seguidorUsuario/api/seguidores?usuarioId=${userId}`);
    if (!response || response.status === 204) return 0;
    if (!response.ok) throw new Error('Falha ao carregar seguidores.');

    const payload = await response.json().catch(() => []);
    return extractArrayPayload(payload).length;
  } catch {
    return 0;
  }
}

async function loadUsersFromApi() {
  try {
    const response = await apiFetch('/usuarios');
    if (!response || response.status === 204) {
      USERS = [];
      return;
    }

    if (!response.ok) {
      throw new Error('Falha ao carregar usuários.');
    }

    const payload = await response.json().catch(() => []);
    const list = extractArrayPayload(payload);
    const followingIds = await getFollowingIds();
    const users = list
      .map(normalizeUserFromApi)
      .filter((u) => Number(u.id) !== Number(currentUser?.id))
      .map((u) => ({ ...u, isFollowing: followingIds.has(Number(u.id)) }));
    USERS = await Promise.all(users.map(async (u) => ({
      ...u,
      seguidores: await getFollowersCount(u.id),
    })));
  } catch (err) {
    console.warn('Busca: usuários indisponíveis.', err);
    USERS = [];
  }
}

// Render popular books on load
function renderPopular() {
  const popularBooks = getPopularBooks();

  document.getElementById('popularList').innerHTML = popularBooks.map((b, i) => {
    const coverUrl = b.urlImagem || b.url_imagem || '';
    const fallbackCover = b.emoji || '📚';
    return `
      <a class="book-result-card" href="livro.html?id=${b.id}" style="animation-delay:${i*0.05}s">
        <div class="brc-cover" id="pop-${b.id}">
          ${coverHtml(coverUrl, fallbackCover, { width: 52, height: 74, radius: 6, fontSize: 28 })}
        </div>
        <div class="brc-info">
          <div class="brc-title">${escapeHtml(b.titulo)}</div>
          <div class="brc-author">${escapeHtml(b.autor)} · ${b.ano}</div>
          <div class="brc-meta">
            <span class="brc-genre">${b.genero}</span>
            <span class="brc-rating">★ ${b.nota}</span>
          </div>
        </div>
      </a>`;
  }).join('');

  popularBooks
    .filter((b) => !(b.urlImagem || b.url_imagem))
    .forEach(b => applyCover(
      document.getElementById(`pop-${b.id}`),
      b.titulo, b.autor, b.emoji || '📚',
      { width: 52, height: 74, radius: 6, fontSize: 28 }
    ));
}

const doSearch = debounce(function(q) {
  const hasQuery = !!q;
  const books = hasQuery
    ? BOOKS.filter((b) => b.titulo.toLowerCase().includes(q) || b.autor.toLowerCase().includes(q))
    : BOOKS;
  const users = hasQuery
    ? USERS.filter((u) => u.nome.toLowerCase().includes(q))
    : USERS;

  document.getElementById('defaultView').style.display  = 'none';
  document.getElementById('resultsView').style.display  = 'block';
  document.getElementById('searchTabs').style.display   = 'flex';
  document.getElementById('clearBtn').style.display     = 'block';

  document.getElementById('livrosResults').innerHTML = books.length
    ? books.map((b, i) => {
        const coverUrl = b.urlImagem || b.url_imagem || '';
        const fallbackCover = b.emoji || '📚';
        return `
        <a class="book-result-card" href="livro.html?id=${b.id}" style="animation-delay:${i*0.05}s">
          <div class="brc-cover" id="brc-${b.id}">
            ${coverHtml(coverUrl, fallbackCover, { width: 52, height: 74, radius: 6, fontSize: 28 })}
          </div>
          <div class="brc-info">
            <div class="brc-title">${escapeHtml(b.titulo)}</div>
            <div class="brc-author">${escapeHtml(b.autor)} · ${b.ano}</div>
            <div class="brc-meta">
              <span class="brc-genre">${b.genero}</span>
              <span class="brc-rating">★ ${b.nota}</span>
            </div>
          </div>
          <div class="brc-pages">${b.paginas} pág.</div>
        </a>`;
      }).join('')
    : '<div class="no-results">Nenhum livro encontrado.</div>';

  // Capas assíncronas nos resultados
  books
    .filter((b) => !(b.urlImagem || b.url_imagem))
    .forEach(b => applyCover(
      document.getElementById(`brc-${b.id}`),
      b.titulo, b.autor, b.emoji || '📚',
      { width: 52, height: 74, radius: 6, fontSize: 28 }
    ));

  document.getElementById('leitoresResults').innerHTML = users.length
    ? users.map((u, i) => `
        <div class="user-result-card" style="animation-delay:${i*0.05}s">
          <a class="urc-avatar" href="perfil.html?id=${u.id}" style="background:${u.cor};text-decoration:none">
            ${u.urlImagem
              ? `<img src="${escapeHtml(u.urlImagem)}" alt="${escapeHtml(u.nome)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`
              : initials(u.nome)}
          </a>
          <div class="urc-info">
            <a class="urc-name" href="perfil.html?id=${u.id}" style="text-decoration:none;color:inherit">${escapeHtml(u.nome)}</a>
            <div class="urc-bio">${escapeHtml(u.bio || 'Sem biografia.')}</div>
            <div class="urc-stats" id="user-stats-${u.id}">${u.livros} livros · ${u.seguidores} seguidores</div>
          </div>
          <button
            class="sug-follow ${u.isFollowing ? 'following' : ''}"
            id="uf-${u.id}"
            onclick="toggleFollow(${u.id}, this)"
          >${u.isFollowing ? 'Seguindo' : 'Seguir'}</button>
        </div>`).join('')
    : '<div class="no-results">Nenhum leitor encontrado.</div>';
}, 280);

function handleSearch() {
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  doSearch(q);
}

function showDefault() {
  document.getElementById('defaultView').style.display  = 'block';
  document.getElementById('resultsView').style.display  = 'none';
  document.getElementById('searchTabs').style.display   = 'none';
  document.getElementById('clearBtn').style.display     = 'none';
}

function clearSearch() {
  document.getElementById('searchInput').value = '';
  showDefault();
  document.getElementById('searchInput').focus();
}

function switchSearchTab(tab, btn) {
  activeTab = tab;
  document.querySelectorAll('.stab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.stab-pane').forEach(p => p.classList.remove('active'));
  document.getElementById(`${tab}Results`).classList.add('active');
}

async function toggleFollow(id, btn) {
  if (!currentUser?.id) {
    showToast('Faça login novamente para seguir leitores.', 'error');
    return;
  }

  const isFollowing = btn.classList.contains('following');
  btn.disabled = true;

  try {
    const path = `/seguidorUsuario/api/${isFollowing ? 'unfollow' : 'follow'}?seguidorId=${currentUser.id}&seguidoId=${id}`;
    const response = await apiFetch(path, { method: isFollowing ? 'DELETE' : 'POST' });

    if (!response || !response.ok) {
      throw new Error('Falha ao atualizar seguidor.');
    }

    const nextFollowing = !isFollowing;
    btn.classList.toggle('following', nextFollowing);
    btn.textContent = nextFollowing ? 'Seguindo' : 'Seguir';

    USERS = USERS.map((u) => {
      if (Number(u.id) !== Number(id)) return u;
      return {
        ...u,
        isFollowing: nextFollowing,
        seguidores: Math.max(0, (u.seguidores || 0) + (nextFollowing ? 1 : -1)),
      };
    });

    const updatedUser = USERS.find((u) => Number(u.id) === Number(id));
    const statsEl = document.getElementById(`user-stats-${id}`);
    if (updatedUser && statsEl) {
      statsEl.textContent = `${updatedUser.livros} livros · ${updatedUser.seguidores} seguidores`;
    }

    showToast(nextFollowing ? 'Seguindo!' : 'Você deixou de seguir.');
  } catch (err) {
    console.error(err);
    showToast('Não foi possível atualizar seguidor.', 'error');
  } finally {
    btn.disabled = false;
  }
}

async function initSearchPage() {
  await Promise.all([
    loadBooksFromApi(),
    loadUsersFromApi(),
  ]);
  renderPopular();

  const urlQ = new URLSearchParams(window.location.search).get('q');
  if (urlQ) {
    document.getElementById('searchInput').value = urlQ;
    doSearch(urlQ.toLowerCase());
  }
}

initSearchPage();

// Init theme toggle icon
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('themeToggleBtn');
  if (btn) renderThemeToggle(btn);
});
