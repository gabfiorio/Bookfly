if (Auth.isLogged()) window.location.href = 'home.html';

async function handleCadastro() {
  const nome  = document.getElementById('nome').value.trim();
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;
  const alertEl = document.getElementById('alertMsg');
  const btn   = document.getElementById('submitBtn');
  const txt   = document.getElementById('btnText');
  const spin  = document.getElementById('spinner');

  if (!nome || !email || !senha) {
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

  btn.disabled = true; txt.textContent = 'Criando conta…';
  spin.style.display = 'block';

  try {
    await new Promise(r => setTimeout(r, 900));
    Auth.setToken('mock-token-123');
    Auth.setUser({ id: 1, nome, email });
    window.location.href = 'home.html';
  } catch (err) {
    alertEl.textContent = err.message || 'Erro ao criar conta.';
    alertEl.style.display = 'block';
  } finally {
    btn.disabled = false; txt.textContent = 'Criar conta';
    spin.style.display = 'none';
  }
}

document.addEventListener('keydown', e => { if (e.key === 'Enter') handleCadastro(); });
