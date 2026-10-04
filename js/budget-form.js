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
            let text = box.closest('label').textContent.trim();
            const extra = box.dataset.reveal && form.querySelector(`#${box.dataset.reveal} select, #${box.dataset.reveal} input`);
            if (extra?.value) text += ` (${extra.selectedOptions ? extra.selectedOptions[0].textContent.trim() : extra.value})`;
            return text;
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
        if (group && !boxes.length) return [t.errItems, group.querySelector('input')];
        for (const box of boxes) {
            const extra = box.dataset.reveal && form.querySelector(`#${box.dataset.reveal} select, #${box.dataset.reveal} input`);
            if (extra && !extra.value) return [extra.dataset.msg, extra];
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

    update();
})();
