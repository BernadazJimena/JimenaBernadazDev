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
    // Cupón de descuento (se entrega al publicar un proyecto; sirve para pedir una actualización)
    const couponBox = form.querySelector('.budget-coupon');
    const couponInput = couponBox?.querySelector('input');
    const couponStatus = couponBox?.querySelector('.budget-coupon-status');
    let couponValid = false;

    const topicInput = () => form.querySelector('input[name="plan"]:checked');
    const activeGroup = () => groups.find((g) => !g.disabled);
    // Texto de una opción, sin el precio de referencia que tiene al lado
    const optionText = (input) => input.closest('label').querySelector('span').textContent.trim();
    const extraFields = (box) => (box.dataset.reveal ? [...form.querySelectorAll(`#${box.dataset.reveal} select, #${box.dataset.reveal} input`)] : []);

    // Muestra (y habilita) solo las opciones del plan elegido; las ocultas no se envían
    const syncGroups = () => {
        const topic = topicInput()?.value;
        groups.forEach((group) => {
            const active = group.dataset.for === topic;
            group.hidden = !active;
            group.disabled = !active;
        });
        // El cupón aparece solo al pedir una actualización (oculto, no se envía)
        if (couponBox) {
            couponBox.hidden = topic !== 'update';
            couponInput.disabled = couponBox.hidden;
        }
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
            const text = optionText(box);
            // Cantidades elegidas (productos, secciones, páginas): "(4 a 5)" o "(Secciones: 4 a 5; Páginas secundarias: 1 a 3)"
            const values = extraFields(box).filter((field) => field.value).map((field) => {
                let shown = field.selectedOptions ? (field.selectedOptions[0].dataset.label || field.selectedOptions[0].textContent.trim()) : field.value;
                if (field.type === 'date') shown = field.value.split('-').reverse().join('/');   // 2026-10-20 → 20/10/2026
                return field.dataset.short ? `${field.dataset.short}: ${shown}` : shown;
            });
            return values.length ? `${text} (${values.join('; ')})` : text;
        });
    };

    const buildSummary = (withName) => {
        const lines = [];
        const topic = topicInput();
        if (topic) lines.push(`${t.lTopic}: ${optionText(topic)}`);
        const items = chosenItems();
        if (items.length) lines.push(`${t.lItems}: ${items.join('; ')}`);
        if (details.value.trim()) lines.push(`${t.lDetails}: ${details.value.trim()}`);
        const country = form.querySelector('[name="pais"]');
        if (country && country.value) lines.push(`${country.closest('label').querySelector('span').textContent.trim()}: ${country.value}`);
        if (couponBox && !couponBox.hidden && couponValid) lines.push(`${couponInput.dataset.label}: ${couponInput.value.trim().toUpperCase()}`);
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
            const missing = extraFields(box).find((field) => !field.value || !field.checkValidity());
            if (missing) return [missing.dataset.msg, missing];
        }
        const needsDetails = topic === 'otro' || boxes.some((box) => box.dataset.other !== undefined);
        if (needsDetails && !details.value.trim()) return [t.errDetails, details];
        return null;
    };

    // El error se muestra abajo, junto a los botones, y también al lado del campo que hay que completar
    const clearFieldError = () => {
        form.querySelector('.budget-field-error')?.remove();
        form.querySelectorAll('[aria-invalid="true"]').forEach((input) => {
            if (input.closest('.contact-field') && input.type !== 'radio' && input.type !== 'checkbox') return;
            input.removeAttribute('aria-invalid');
            input.removeAttribute('aria-describedby');
        });
    };

    const showError = ([message, field]) => {
        status.className = 'contact-form-status is-error';
        status.textContent = message;
        clearFieldError();
        if (field) {
            const note = document.createElement('p');
            note.className = 'field-error budget-field-error';
            note.id = 'budget-field-error';
            note.textContent = message;
            const box = field.type === 'radio' || field.type === 'checkbox'
                ? field.closest('fieldset')
                : field.closest('label') || field.parentElement;
            box.appendChild(note);
            field.setAttribute('aria-invalid', 'true');
            field.setAttribute('aria-describedby', note.id);
        }
        field?.focus();
    };

    const update = () => {
        syncGroups();
        summary.value = buildSummary(false);
        if (status.classList.contains('is-error')) {
            status.className = 'contact-form-status';
            status.textContent = '';
            clearFieldError();
        }
    };

    // Entrega urgente: no se pueden elegir fechas pasadas (el calendario arranca en el día de hoy)
    const now = new Date();
    const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    form.querySelectorAll('input[type="date"]').forEach((field) => { field.min = today; });

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
    // Sin distinguir mayúsculas: ?plan=Basico también funciona
    const wanted = new URLSearchParams(location.search).get('plan')?.toLowerCase();
    const preset = wanted && [...form.querySelectorAll('input[name="plan"]')].find((input) => input.value === wanted);
    if (preset) preset.checked = true;

    // Valida el cupón mientras se escribe (sin cupón válido, el pedido se manda igual, sin descuento)
    if (couponInput) {
        let couponTimer;
        const checkCoupon = () => {
            const code = couponInput.value.trim().toUpperCase();
            couponValid = false;
            couponStatus.className = 'budget-coupon-status';
            couponStatus.textContent = '';
            if (code.length < 6) { update(); return; }
            fetch(`/api/cupon/${encodeURIComponent(code)}`, { cache: 'no-store' })
                .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
                .then((state) => {
                    if (couponInput.value.trim().toUpperCase() !== code) return;
                    couponValid = Boolean(state.valid);
                    const lang = document.documentElement.lang;
                    const date = state.expires ? new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${state.expires}T12:00:00Z`)) : '';
                    const d = couponInput.dataset;
                    couponStatus.classList.add(state.valid ? 'is-ok' : 'is-error');
                    couponStatus.textContent = state.valid ? d.ok.replace('{p}', state.percent)
                        : (state.reason === 'used' ? d.used : state.reason === 'expired' ? d.expired.replace('{date}', date) : d.unknown);
                    update();
                })
                .catch(() => { /* sin conexión: se manda igual y lo reviso a mano */ });
        };
        couponInput.addEventListener('input', () => { clearTimeout(couponTimer); couponTimer = setTimeout(checkCoupon, 500); });
        const presetCoupon = new URLSearchParams(location.search).get('cupon');
        if (presetCoupon && /^[A-Za-z0-9-]{4,30}$/.test(presetCoupon)) { couponInput.value = presetCoupon.toUpperCase(); }
        setTimeout(checkCoupon, 0);
    }

    update();

    // Desde el test se puede llegar con un adicional ya marcado (por ejemplo ?plan=emprendedor&extra=landing)
    const wantedExtra = new URLSearchParams(location.search).get('extra')?.toLowerCase();
    const extraBox = /^[a-z]+$/.test(wantedExtra || '') && activeGroup()?.querySelector(`input[data-key="${wantedExtra}"]`);
    if (extraBox) {
        extraBox.checked = true;
        update();
    }
})();
