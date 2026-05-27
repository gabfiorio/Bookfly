if (Auth.isLogged()) {
  window.location.href = Auth.getLandingPage();
}

async function handleLogin() {

  const identificador =
    document.getElementById('username')?.value.trim();

  const senha =
    document.getElementById('senha')?.value;

  const alertEl =
    document.getElementById('alertMsg');

  const btn =
    document.getElementById('submitBtn');

  const txt =
    document.getElementById('btnText');

  const spin =
    document.getElementById('spinner');

  if (!identificador || !senha) {

    alertEl.textContent =
      'Preencha todos os campos.';

    alertEl.style.display = 'block';

    return;
  }

  alertEl.style.display = 'none';

  btn.disabled = true;

  txt.textContent = 'Entrando...';

  spin.style.display = 'block';

  try {

    const login = identificador.includes('@')
      ? { email: identificador, senha }
      : { username: identificador, senha };

    const response = await apiFetch('/auth/login', {
      method: 'POST',

      body: JSON.stringify(login),
    });

    if (!response) {
      throw new Error(
        'Servidor indisponível.'
      );
    }

    const data =
      await response.json()
        .catch(() => ({}));

    if (!response.ok) {

      throw new Error(
        data.message ||
        data.erro ||
        'Usuário ou senha inválidos.'
      );
    }

    const token =
      data.token ||
      data.accessToken ||
      data.access_token;

    const user =
      data.user ||
      data.usuario || {
        username: identificador
      };

    if (!token) {
      throw new Error(
        'Token não retornado pelo servidor.'
      );
    }

    Auth.setToken(token);
    Auth.setUser(user);

    showToast(
      'Login realizado com sucesso!'
    );

    setTimeout(() => {

      window.location.href =
        Auth.getLandingPage();

    }, 800);

  } catch (err) {

    console.error(err);

    alertEl.textContent =
      err.message ||
      'Erro ao entrar.';

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