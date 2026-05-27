if (Auth.isLogged()) {
  window.location.href = Auth.getLandingPage();
}

async function handleLogin() {

  const Username = document.getElementById('Username')?.value.trim();
  const senha = document.getElementById('senha')?.value;

  const alertEl = document.getElementById('alertMsg');
  const btn = document.getElementById('submitBtn');
  const txt = document.getElementById('btnText');
  const spin = document.getElementById('spinner');

  if (!Username || !senha) {
    alertEl.textContent = 'Preencha todos os campos.';
    alertEl.style.display = 'block';
    return;
  }

  alertEl.style.display = 'none';

  btn.disabled = true;
  txt.textContent = 'Entrando...';
  spin.style.display = 'block';

  try {

    const response = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        Username,
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
        'Erro ao entrar. Verifique seus dados.'
      );
    }

    const token =
      data.token ||
      data.accessToken ||
      data.access_token;
// pegar o usuário do response.
    const user =
      data.user ||
      data.usuario || {
        id: data.id || 1,

        username:
          data.username ||
          data.user?.username ||
          'Usuário',
      };

    if (!token) {
      throw new Error('Token não retornado pelo servidor.');
    }

    Auth.setToken(token);
    Auth.setUser(user);

    showToast('Login realizado com sucesso!');

    setTimeout(() => {
      window.location.href = Auth.getLandingPage();
    }, 800);

  } catch (err) {

    console.error(err);

    alertEl.textContent =
      err.message || 'Erro ao entrar.';

    alertEl.style.display = 'block';

  } finally {

    btn.disabled = false;
    txt.textContent = 'Entrar';
    spin.style.display = 'none';

  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    handleLogin();
  }
});