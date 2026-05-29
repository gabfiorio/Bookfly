document.addEventListener('DOMContentLoaded', function () {
    if (!Auth.isLogged()) {
        window.location.href = 'login.html';
        return;
    }

    // Ajuste apenas a base/rotas em js/utils.js; aqui usamos o endpoint do formulário.
    const API_ENDPOINT = API_ENDPOINTS.onboarding;

    // Marca visualmente labels cujos inputs estão selecionados
    function syncOptions(container) {
        const options = container.querySelectorAll('.option');
        options.forEach(label => {
            const input = label.querySelector('input');
            if (!input) return;
            label.classList.toggle('selected', input.checked);
        });
    }

    const form = document.querySelector('.reading-form');
    if (!form) return;

    const skipBtn = document.querySelector('.skip-btn');
    const success = document.getElementById('prefs-success');

    function finishOnboarding() {
        Auth.setOnboarded(true);
        window.location.href = 'home.html';
    }

    if (skipBtn) {
        skipBtn.addEventListener('click', () => {
            if (success) success.classList.add('bf-visible');
            setTimeout(finishOnboarding, 500);
        });
    }

    // Sincronia inicial
    syncOptions(form);

    // Ouvir mudanças em todo o form
    form.addEventListener('change', (e) => {
        // Para radios, atualizar todo o grupo
        if (e.target.type === 'radio') {
            const group = form.querySelectorAll(`input[name="${e.target.name}"]`);
            group.forEach(i => {
                const lbl = i.closest('.option');
                if (lbl) lbl.classList.toggle('selected', i.checked);
            });
            return;
        }

        // Para checkbox, atualizar somente o label afetado
        const lbl = e.target.closest('.option');
        if (lbl) lbl.classList.toggle('selected', e.target.checked);
    });

    // Navegação entre passos (Continuar / Voltar)
    function showStep(el) {
        document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
        if (el) el.classList.add('active');
    }

    function validateStep(stepEl) {
        if (!stepEl) return true;
        // se houver checkboxes, requer pelo menos um selecionado
        const checkboxes = stepEl.querySelectorAll('input[type="checkbox"]');
        if (checkboxes.length) {
            const anyChecked = Array.from(checkboxes).some(i => i.checked);
            if (!anyChecked) {
                alert('Por favor, selecione ao menos um gênero para continuar.');
                return false;
            }
        }
        // campos required (selects/inputs)
        const required = stepEl.querySelectorAll('[required]');
        for (const r of required) {
            if (!r.value) {
                alert('Por favor, preencha os campos obrigatórios antes de continuar.');
                return false;
            }
        }
        return true;
    }

    form.querySelectorAll('.next-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const current = btn.closest('.form-step');
            const next = current && current.nextElementSibling;
            if (!next) return;
            if (!validateStep(current)) return;
            showStep(next);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    form.querySelectorAll('.prev-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const current = btn.closest('.form-step');
            const prev = current && current.previousElementSibling;
            if (!prev) return;
            showStep(prev);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    // Enviar dados para o Back-end e redirecionar após submit
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Captura todos os dados do formulário
        const formData = new FormData(form);
        const selectedGenres = formData.getAll('genres');

        const payload = {
            genres: selectedGenres,
            reading_goal: formData.get('reading_goal'),
            frequency: formData.get('frequency'),
            books_per_year: formData.get('books_per_year'),
            book_length: formData.get('book_length'),
            format: formData.get('format')
        };

        try {
            const response = await apiFetch(API_ENDPOINT, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (!response || !response.ok) throw new Error('Erro ao salvar as preferências no servidor.');

            if (success) success.classList.add('bf-visible');
            setTimeout(finishOnboarding, 900);

        } catch (error) {
            console.error('Erro na requisição:', error);
            alert('Ops! Ocorreu um erro ao salvar suas preferências. Tente novamente.');
        }
    });
});
