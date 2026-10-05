// Test "¿No sabés cuál elegir?" (página Comparar planes): unas preguntas y recomienda un plan
(() => {
    const quiz = document.querySelector('.plan-quiz');
    if (!quiz) return;

    const form = quiz.querySelector('.plan-quiz-form');
    const steps = [...quiz.querySelectorAll('.plan-quiz-step')];
    const label = quiz.querySelector('.plan-quiz-step-label');
    const bar = quiz.querySelector('.plan-quiz-progress span');
    const back = quiz.querySelector('.plan-quiz-back');
    const next = quiz.querySelector('.plan-quiz-next');
    const result = quiz.querySelector('.plan-quiz-result');
    const loginNote = quiz.querySelector('.plan-quiz-login-note');
    const extrasNote = quiz.querySelector('.plan-quiz-extras-note');
    const landingNote = quiz.querySelector('.plan-quiz-landing-note');
    const whatsapp = quiz.querySelector('.plan-quiz-wa');
    const restart = quiz.querySelector('.plan-quiz-restart');
    // Envío por mail: lo hace contact-form.js (el formulario también tiene la clase .contact-form)
    const mailToggle = quiz.querySelector('.plan-quiz-mail-toggle');
    const mailForm = quiz.querySelector('.plan-quiz-mail');
    const mailMessage = mailForm.querySelector('input[name="message"]');
    let resultMessage = '';

    let path = [];          // preguntas ya respondidas, en orden
    let current = 'goal';   // pregunta que se está mostrando

    const step = (name) => steps.find((s) => s.dataset.step === name);
    const checked = (name) => [...form.querySelectorAll(`input[name="${name}"]:checked`)];
    const value = (name) => checked(name)[0]?.value ?? null;
    const answerTexts = (name) => checked(name).map((input) => input.closest('label').textContent.trim());

    // Vender productos → se pregunta por la landing que complementa la tienda. Mostrar el trabajo → tres preguntas más.
    // "Las dos cosas" ya tiene su resultado con la primera pregunta.
    const nextStep = (name) => {
        if (name === 'goal') return { store: 'landing', show: 'size' }[value('goal')] ?? null;
        if (name === 'size') return 'extras';
        if (name === 'extras') return 'login';
        return null;
    };
    const total = () => ({ store: 2, both: 1 }[value('goal')] ?? 4);

    const render = () => {
        steps.forEach((s) => { s.hidden = s.dataset.step !== current; });
        const number = path.length + 1;
        label.textContent = quiz.dataset.stepLabel.replace('{n}', number).replace('{total}', total());
        bar.style.width = `${((number - 1) / total()) * 100}%`;
        back.hidden = path.length === 0;
        next.disabled = checked(current).length === 0;
        next.textContent = nextStep(current) ? quiz.dataset.next : quiz.dataset.finish;
    };

    const recommend = () => {
        const goal = value('goal');
        if (goal === 'store') return 'emprendedor';
        if (goal === 'both') return 'ambos';
        // Una sola página → Básico (los extras elegidos se cotizan aparte); varias páginas → Premium
        return value('size') === 'several' ? 'premium' : 'basico';
    };

    const showResult = () => {
        const plan = recommend();
        const card = result.querySelector(`[data-result="${plan}"]`);
        result.querySelectorAll('[data-result]').forEach((c) => { c.hidden = c !== card; });
        loginNote.hidden = !(value('goal') === 'show' && value('login') === 'yes');

        // Plan Básico con funciones extra: se avisa que se cotizan aparte
        const extras = checked('extras').filter((input) => input.value !== 'none').map((input) => input.closest('label').textContent.trim());
        extrasNote.hidden = !(plan === 'basico' && extras.length);
        extrasNote.querySelector('.plan-quiz-extras-text').textContent = extrasNote.dataset.template.replace('{extras}', extras.join('; '));

        // Tienda con landing page: la landing es un adicional del Plan Emprendedor
        landingNote.hidden = !(plan === 'emprendedor' && value('landing') === 'yes');

        // Mensaje ya escrito, con el plan y las respuestas (para WhatsApp o para el mail)
        let message = quiz.dataset.waBoth;
        if (plan !== 'ambos') {
            const answers = [...path, current].flatMap(answerTexts).join('; ');
            message = `${quiz.dataset.waPlan.replace('{plan}', card.dataset.planName)} ${quiz.dataset.waAnswers} ${answers}.`;
        }
        whatsapp.href = `https://wa.me/5491127663667?text=${encodeURIComponent(message)}`;
        resultMessage = message;
        mailMessage.value = message;

        bar.style.width = '100%';
        form.hidden = true;
        label.hidden = true;
        result.hidden = false;
        result.focus();
    };

    // "Ninguno" no se combina con los demás extras
    form.addEventListener('change', (event) => {
        const input = event.target;
        if (input.name === 'extras' && input.checked) {
            checked('extras').forEach((other) => {
                if (other !== input && (input.value === 'none' || other.value === 'none')) other.checked = false;
            });
        }
        render();
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        next.click();
    });

    next.addEventListener('click', () => {
        if (!checked(current).length) return;
        const following = nextStep(current);
        if (!following) {
            showResult();
            return;
        }
        path.push(current);
        current = following;
        render();
        step(current).focus();
    });

    back.addEventListener('click', () => {
        current = path.pop();
        render();
        step(current).focus();
    });

    mailToggle.addEventListener('click', () => {
        mailForm.hidden = false;
        mailToggle.setAttribute('aria-expanded', 'true');
        mailForm.querySelector('input[name="name"]').focus();
    });

    // Antes de enviar se vuelve a cargar el resumen (contact-form.js limpia el formulario después de cada envío)
    mailForm.addEventListener('submit', () => { mailMessage.value = resultMessage; }, true);

    restart.addEventListener('click', () => {
        form.reset();
        mailForm.reset();
        mailForm.hidden = true;
        mailToggle.setAttribute('aria-expanded', 'false');
        const mailStatus = mailForm.querySelector('.contact-form-status');
        mailStatus.className = 'contact-form-status';
        mailStatus.textContent = '';
        path = [];
        current = 'goal';
        form.hidden = false;
        label.hidden = false;
        result.hidden = true;
        render();
        step(current).focus();
    });

    // Sin JavaScript el test queda oculto; con JavaScript se muestra
    quiz.hidden = false;
    render();
})();
