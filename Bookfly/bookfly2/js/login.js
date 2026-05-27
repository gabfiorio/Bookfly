

if (Auth.isLogged()) window.location.href = Auth.getLandingPage();

async function handleLogin() {
  const email  = document.getElementById('email').value.trim();
  const senha  = document.getElementById('senha').value;
  const alert  = document.getElementById('alertMsg');
  const btn    = document.getElementById('submitBtn');
  const txt    = document.getElementById('btnText');
  const spin   = document.getElementById('spinner');

  if (!email || !senha) {
    alert.textContent = 'Preencha todos os campos.';
    alert.style.display = 'block';
    return;
  }
  alert.style.display = 'none';

  btn.disabled = true; txt.textContent = 'Entrando…';
  spin.style.display = 'block';

  try {
    const response = await apiFetch(API_ENDPOINTS.login, {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    });

    if (!response || !response.ok) {
      throw new Error('Erro ao entrar. Verifique seus dados e tente novamente.');
    }

    const data = await response.json().catch(() => ({}));
    const token = data.token || data.accessToken || data.access_token || 'mock-token-123';
    const user = data.user || data.usuario || { id: data.id || 1, nome: data.nome || data.name || 'Leitor Exemplo', email };

    Auth.setToken(token);
    Auth.setUser(user);
    window.location.href = Auth.getLandingPage();
  } catch (err) {
    alert.textContent = err.message || 'Erro ao entrar. Tente novamente.';
    alert.style.display = 'block';
  } finally {
    btn.disabled = false; txt.textContent = 'Entrar';
    spin.style.display = 'none';
  }
}

document.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
