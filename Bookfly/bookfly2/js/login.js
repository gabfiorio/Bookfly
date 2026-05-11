if (Auth.isLogged()) window.location.href = 'home.html';

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
    await new Promise(r => setTimeout(r, 800));
    Auth.setToken('mock-token-123');
    Auth.setUser({ id: 1, nome: 'Leitor Exemplo', email });
    window.location.href = 'home.html';
  } catch (err) {
    alert.textContent = err.message || 'Erro ao entrar. Tente novamente.';
    alert.style.display = 'block';
  } finally {
    btn.disabled = false; txt.textContent = 'Entrar';
    spin.style.display = 'none';
  }
}

document.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
