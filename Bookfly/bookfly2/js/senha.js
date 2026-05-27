if (Auth.isLogged()) {
  window.location.href = Auth.getLandingPage();
}

let emailEnviado = '';

/* ---------- Etapa 1: enviar e-mail ---------- */

async function handleRecuperarSenha() {
  const email    = document.getElementById('emailInput')?.value.trim();
  const alertEl  = document.getElementById('alertMsg');
  const btn      = document.getElementById('submitBtn');
  const txt      = document.getElementById('btnText');
  const spin     = document.getElementById('spinner');

  // Validação básica
  if (!email) {
    alertEl.textContent = 'Informe seu e-mail.';
    alertEl.style.display = 'block';
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    alertEl.textContent = 'E-mail inválido.';
    alertEl.style.display = 'block';
    return;
  }

  alertEl.style.display = 'none';

  btn.disabled = true;
  txt.textContent = 'Enviando…';
  spin.style.display = 'block';

  try {
    const response = await apiFetch('/auth/recuperar-senha', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    if (!response) throw new Error('Servidor indisponível.');

    // Aceita 200 ou 404 como "ok" do ponto de vista do usuário
    // (não revelamos se o e-mail existe ou não — boa prática de segurança)
    if (!response.ok && response.status !== 404) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || data.erro || 'Não foi possível enviar o e-mail.');
    }

    emailEnviado = email;
    showStep('confirm');

  } catch (err) {
    console.error(err);
    alertEl.textContent = err.message || 'Erro ao enviar. Tente novamente.';
    alertEl.style.display = 'block';

  } finally {
    btn.disabled = false;
    txt.textContent = 'Enviar link';
    spin.style.display = 'none';
  }
}

/* ---------- Etapa 2: reenviar ---------- */

let reenviarCooldown = false;

async function handleReenviar() {
  if (reenviarCooldown || !emailEnviado) return;

  const btn  = document.getElementById('submitBtn') || document.querySelector('#stepConfirm .btn-full');
  const txt  = document.getElementById('reenviarText');
  const spin = document.getElementById('reenviarSpinner');

  txt.textContent = 'Reenviando…';
  spin.style.display = 'block';
  btn.classList.add('cooldown');
  reenviarCooldown = true;

  try {
    await apiFetch('/auth/recuperar-senha', {
      method: 'POST',
      body: JSON.stringify({ email: emailEnviado }),
    });

    showToast('E-mail reenviado!');

  } catch (err) {
    showToast('Erro ao reenviar. Tente mais tarde.', 'error');

  } finally {
    spin.style.display = 'none';

    // Cooldown de 30 s para evitar spam
    let segundos = 30;
    txt.textContent = `Reenviar (${segundos}s)`;

    const interval = setInterval(() => {
      segundos--;
      txt.textContent = `Reenviar (${segundos}s)`;
      if (segundos <= 0) {
        clearInterval(interval);
        txt.textContent = 'Reenviar e-mail';
        btn.classList.remove('cooldown');
        reenviarCooldown = false;
      }
    }, 1000);
  }
}

/* ---------- Helpers ---------- */

function showStep(step) {
  document.getElementById('stepRequest').style.display = step === 'request' ? '' : 'none';
  document.getElementById('stepConfirm').style.display = step === 'confirm'  ? '' : 'none';

  if (step === 'confirm') {
    document.getElementById('confirmEmail').textContent = emailEnviado;
  }
}

// Enter na etapa 1
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && document.getElementById('stepRequest').style.display !== 'none') {
    handleRecuperarSenha();
  }
});
