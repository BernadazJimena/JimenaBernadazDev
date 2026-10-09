// Formulario de contacto: validación en el idioma de la página y envío sin salir de la página
(() => {
    const contactForm = document.querySelector('.contact-form');
    if (!contactForm) return;

    // ---- Plan preseleccionado desde un enlace (por ejemplo /?plan=basico#contacto)
    // Solo marca la opción si el plan existe en este formulario; si no, no marca ninguna.
    const planInput = (key) => (/^[a-z]+$/.test(key || '')
        ? contactForm.querySelector(`input[name="plan"][data-plan="${key}"]`)
        : null);

    const presetPlan = planInput(new URLSearchParams(location.search).get('plan'));
    if (presetPlan) presetPlan.checked = true;

    // En la misma página, "Consultar plan…" marca el plan y baja al formulario sin recargar
    document.addEventListener('click', (event) => {
        const link = event.target.closest('a[href*="plan="]');
        if (!link) return;
        const url = new URL(link.href, location.href);
        if (url.pathname !== location.pathname || !url.hash) return;
        const target = document.getElementById(url.hash.slice(1));
        const input = planInput(url.searchParams.get('plan'));
        if (!target || !input || !target.contains(contactForm)) return;
        event.preventDefault();
        input.checked = true;
        history.pushState(null, '', url.pathname + url.search + url.hash);
        target.scrollIntoView();
    });

    // ---- Validación: el mensaje de error aparece junto a cada campo, en el idioma de la página
    contactForm.noValidate = true;

    const fields = () => [...contactForm.querySelectorAll('input[required], textarea[required]')]
        .filter((field) => field.type !== 'radio' && field.type !== 'checkbox' && !field.disabled && !field.closest('[hidden]'));

    const messageFor = (field) => {
        const { valueMissing, typeMismatch, patternMismatch } = field.validity;
        const isBadEmail = field.type === 'email' && !valueMissing && (typeMismatch || patternMismatch);
        if (isBadEmail) return field.dataset.msgInvalid || field.validationMessage;
        return field.dataset.msgRequired || field.validationMessage;
    };

    let errorCount = 0;
    const errorNote = (field) => {
        if (!field.id) {
            errorCount += 1;
            field.id = `campo-${field.name || 'dato'}-${errorCount}`;
        }
        const id = `${field.id}-error`;
        let note = document.getElementById(id);
        if (!note) {
            note = document.createElement('p');
            note.className = 'field-error';
            note.id = id;
            const label = field.closest('label');
            if (label) label.appendChild(note);
            else field.insertAdjacentElement('afterend', note);
        }
        return note;
    };

    const showFieldError = (field) => {
        const note = errorNote(field);
        note.textContent = messageFor(field);
        field.setAttribute('aria-invalid', 'true');
        field.setAttribute('aria-describedby', note.id);
    };

    const clearFieldError = (field) => {
        if (!field.hasAttribute('aria-invalid')) return;
        field.removeAttribute('aria-invalid');
        field.removeAttribute('aria-describedby');
        document.getElementById(`${field.id}-error`)?.remove();
    };

    // Al corregir el campo, el error desaparece
    contactForm.addEventListener('input', (event) => {
        const field = event.target;
        if (field.hasAttribute('aria-invalid') && field.checkValidity()) clearFieldError(field);
    });

    contactForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const status = contactForm.querySelector('.contact-form-status');
        const submitButton = contactForm.querySelector('button[type="submit"]');
        const { sending, success, error } = contactForm.dataset;

        const invalid = fields().filter((field) => !field.checkValidity());
        fields().forEach((field) => (invalid.includes(field) ? showFieldError(field) : clearFieldError(field)));
        if (invalid.length) {
            invalid[0].focus();
            return;
        }

        status.className = 'contact-form-status';
        status.textContent = sending;
        submitButton.disabled = true;

        try {
            const response = await fetch(contactForm.action, {
                method: 'POST',
                headers: { Accept: 'application/json' },
                body: new FormData(contactForm)
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message);

            // Solo con la confirmación de Web3Forms se muestra el éxito y se vacía el formulario
            contactForm.reset();
            status.classList.add('is-success');
            status.textContent = success;
        } catch (submitError) {
            // Si falla, lo escrito queda en el formulario para poder reintentar
            status.classList.add('is-error');
            status.textContent = error;
        } finally {
            submitButton.disabled = false;
        }
    });
})();
