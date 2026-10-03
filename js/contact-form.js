// Formulario de contacto: validación en el idioma de la página y envío sin salir de la página
(() => {
    const contactForm = document.querySelector('.contact-form');

    // Mensajes de validación en el idioma de la página (no en el del navegador)
    contactForm?.querySelectorAll('input[required], textarea[required]').forEach((field) => {
        field.addEventListener('invalid', () => {
            const { valueMissing, typeMismatch, patternMismatch } = field.validity;
            const isBadEmail = field.type === 'email' && (typeMismatch || patternMismatch);
            const message = isBadEmail ? field.dataset.msgInvalid : field.dataset.msgRequired;
            field.setCustomValidity(valueMissing || isBadEmail || patternMismatch ? message || '' : '');
        });
        field.addEventListener('input', () => field.setCustomValidity(''));
    });

    contactForm?.addEventListener('submit', async (event) => {
        event.preventDefault();

        const status = contactForm.querySelector('.contact-form-status');
        const submitButton = contactForm.querySelector('button[type="submit"]');
        const { sending, success, error } = contactForm.dataset;

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

            contactForm.reset();
            status.classList.add('is-success');
            status.textContent = success;
        } catch (submitError) {
            status.classList.add('is-error');
            status.textContent = error;
        } finally {
            submitButton.disabled = false;
        }
    });
})();
