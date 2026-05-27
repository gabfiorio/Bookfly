if (Auth.isLogged()) {
  window.location.href = Auth.getLandingPage();
}

async function handleCadastro() {
  const username = document.getElementById('username')?.value.trim();
  const email = document.getElementById('email')?.value.trim();
  const senha = document.getElementById('senha')?.value;

  const alertEl = document.getElementById('alertMsg');
  const btn = document.getElementById('submitBtn');
  const txt = document.getElementById('btnText');
  const spin = document.getElementById('spinner');

  if (!username || !email || !senha) {
    alertEl.textContent = 'Preencha todos os campos.';
    alertEl.style.display = 'block';
    return;
  }

  if (senha.length < 6) {
    alertEl.textContent = 'A senha precisa ter pelo menos 6 caracteres.';
    alertEl.style.display = 'block';
    return;
  }

  alertEl.style.display = 'none';

  btn.disabled = true;
  txt.textContent = 'Criando conta…';
  spin.style.display = 'block';

  try {

    const response = await apiFetch('/usuarios', {
      method: 'POST',
      body: JSON.stringify({
        username,
        email,
        senha
      }),
    });

    if (!response) {
      throw new Error('Servidor indisponível.');
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.message ||
        data.erro ||
        'Erro ao criar conta. Verifique os dados.'
      );
    }

    const token =
      data.token ||
      data.accessToken ||
      data.access_token ||
      'mock-token-123';

    const user =
      data.user ||
      data.usuario || {
        id: data.id || 1,
        username,
        email
      };

    Auth.setToken(token);
    Auth.setUser(user);

    showToast('Conta criada com sucesso!');

    setTimeout(() => {
      window.location.href = Auth.getLandingPage();
    }, 800);

  } catch (err) {

    console.error(err);

    alertEl.textContent =
      err.message || 'Erro ao criar conta.';

    alertEl.style.display = 'block';

  } finally {

    btn.disabled = false;
    txt.textContent = 'Criar conta';
    spin.style.display = 'none';

  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    handleCadastro();
  }
});