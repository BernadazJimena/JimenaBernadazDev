// Pedido de presupuesto: muestra las opciones del plan elegido, arma el resumen y lo envía por mail o por WhatsApp.
// El envío por mail lo hace contact-form.js (el formulario también tiene la clase .contact-form).
(() => {
    const form = document.querySelector('.budget-form');
    if (!form) return;

    const groups = [...form.querySelectorAll('.budget-group')];
    const details = form.querySelector('.budget-details');
    const summary = form.querySelector('input[name="message"]');
    const status = form.querySelector('.contact-form-status');
    const whatsappButton = form.querySelector('.budget-whatsapp');
    const t = form.dataset;

    const topicInput = () => form.querySelector('input[name="plan"]:checked');
    const activeGroup = () => groups.find((g) => !g.disabled);
    const extraFields = (box) => (box.dataset.reveal ? [...form.querySelectorAll(`#${box.dataset.reveal} select, #${box.dataset.reveal} input`)] : []);

    // Muestra (y habilita) solo las opciones del plan elegido; las ocultas no se envían
    const syncGroups = () => {
        const topic = topicInput()?.value;
        groups.forEach((group) => {
            const active = group.dataset.for === topic;
            group.hidden = !active;
            group.disabled = !active;
        });
        // Campos extra que dependen de una opción (cantidad de productos o de páginas)
        form.querySelectorAll('[data-reveal]').forEach((option) => {
            const extra = form.querySelector(`#${option.dataset.reveal}`);
            extra.hidden = !option.checked;
        });
    };

    const chosenItems = () => {
        const group = activeGroup();
        if (!group) return [];
        return [...group.querySelectorAll('input[type="checkbox"]:checked')].map((box) => {
            const text = box.closest('label').textContent.trim();
            // Cantidades elegidas (productos, secciones, páginas): "(4 a 5)" o "(Secciones: 4 a 5; Páginas secundarias: 1 a 3)"
            const values = extraFields(box).filter((field) => field.value).map((field) => {
                const shown = field.selectedOptions ? field.selectedOptions[0].textContent.trim() : field.value;
                return field.dataset.short ? `${field.dataset.short}: ${shown}` : shown;
            });
            return values.length ? `${text} (${values.join('; ')})` : text;
        });
    };

    const buildSummary = (withName) => {
        const lines = [];
        const topic = topicInput();
        if (topic) lines.push(`${t.lTopic}: ${topic.closest('label').textContent.trim()}`);
        const items = chosenItems();
        if (items.length) lines.push(`${t.lItems}: ${items.join('; ')}`);
        if (details.value.trim()) lines.push(`${t.lDetails}: ${details.value.trim()}`);
        const name = form.querySelector('input[name="name"]').value.trim();
        if (withName && name) lines.push(`${t.lName}: ${name}`);
        return lines.join('\n');
    };

    // Devuelve el primer problema encontrado (o null si está todo bien)
    const validate = () => {
        const topic = topicInput()?.value;
        if (!topic) return [t.errTopic, form.querySelector('input[name="plan"]')];
        const group = activeGroup();
        const boxes = group ? [...group.querySelectorAll('input[type="checkbox"]:checked')] : [];
        // Al pedir un plan, los adicionales son opcionales; en una actualización hay que indicar qué se quiere cambiar
        if (topic === 'update' && !boxes.length) return [t.errItems, group.querySelector('input')];
        for (const box of boxes) {
            const missing = extraFields(box).find((field) => !field.value);
            if (missing) return [missing.dataset.msg, missing];
        }
        const needsDetails = topic === 'otro' || boxes.some((box) => box.dataset.other !== undefined);
        if (needsDetails && !details.value.trim()) return [t.errDetails, details];
        return null;
    };

    const showError = ([message, field]) => {
        status.className = 'contact-form-status is-error';
        status.textContent = message;
        field?.focus();
    };

    const update = () => {
        syncGroups();
        summary.value = buildSummary(false);
        if (status.classList.contains('is-error')) {
            status.className = 'contact-form-status';
            status.textContent = '';
        }
    };

    form.addEventListener('change', update);
    form.addEventListener('input', update);
    form.addEventListener('reset', () => setTimeout(update, 0));

    // Antes de que contact-form.js lo envíe por mail, se revisa que el pedido esté completo
    form.addEventListener('submit', (event) => {
        const problem = validate();
        summary.value = buildSummary(false);
        if (problem) {
            event.preventDefault();
            event.stopImmediatePropagation();
            showError(problem);
        }
    }, true);

    whatsappButton.addEventListener('click', () => {
        const problem = validate();
        if (problem) {
            showError(problem);
            return;
        }
        const text = `${t.waIntro}\n${buildSummary(true)}`;
        window.open(`https://wa.me/5491127663667?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    });

    // Si se llega desde "Consultar plan…" (por ejemplo /presupuesto/?plan=basico), ese plan ya viene elegido
    const wanted = new URLSearchParams(location.search).get('plan');
    const preset = wanted && [...form.querySelectorAll('input[name="plan"]')].find((input) => input.value === wanted);
    if (preset) preset.checked = true;

    update();
})();
