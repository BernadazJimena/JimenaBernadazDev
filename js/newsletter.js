// Newsletter del blog: deja el mail (con confirmación por mail) y muestra los avisos
// al volver desde los links del mail: suscripción confirmada, link vencido o darse de baja.
(() => {
    const box = document.getElementById('newsletter');
    if (!box) return;
    const form = box.querySelector('.blog-newsletter-form');
    const input = form.querySelector('input[name="email"]');
    const button = form.querySelector('button[type="submit"]');
    const status = form.querySelector('.blog-newsletter-status');
    const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

    const show = (text, kind) => {
        status.textContent = text;
        status.classList.toggle('is-success', kind === 'ok');
        status.classList.toggle('is-error', kind === 'error');
    };

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = input.value.trim();
        if (!EMAIL.test(email)) {
            input.setAttribute('aria-invalid', 'true');
            show('Revisá el mail: parece que le falta algo.', 'error');
            input.focus();
            return;
        }
        input.removeAttribute('aria-invalid');
        button.disabled = true;
        show('Enviando...', '');
        try {
            const res = await fetch('/api/newsletter', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ email, botcheck: form.elements.botcheck.checked ? 'on' : '' }),
            });
            if (res.ok) {
                form.reset();
                show('¡Listo! Te mandé un mail para confirmar la suscripción. Si no lo ves, revisá la carpeta de spam.', 'ok');
            } else if (res.status === 429) {
                show('Hay muchos pedidos en este momento. Probá de nuevo en un rato.', 'error');
            } else {
                show('No se pudo completar la suscripción. Probá de nuevo en un rato.', 'error');
            }
        } catch (error) {
            show('No se pudo conectar. Revisá tu conexión y probá de nuevo.', 'error');
        }
        button.disabled = false;
    });

    // Al volver desde los links del mail
    const params = new URLSearchParams(location.search);
    const result = params.get('suscripcion');
    const unsubToken = params.get('baja');
    if (!result && !unsubToken) return;
    // Se saca el dato de la dirección, para que no quede guardado ni se comparta por error
    history.replaceState(null, '', location.pathname + '#newsletter');

    if (result === 'confirmada') show('¡Suscripción confirmada! Te aviso por mail cada vez que publique un artículo.', 'ok');
    else if (result === 'vencida') show('Ese link ya no sirve. Dejá tu mail de nuevo y te mando uno nuevo.', 'error');
    else if (result === 'baja') show('Listo, ya no vas a recibir más mails del blog.', 'ok');

    if (unsubToken && /^[A-Za-z0-9]{24}$/.test(unsubToken)) {
        show('¿Querés dejar de recibir los artículos nuevos por mail?', '');
        const unsub = document.createElement('button');
        unsub.type = 'button';
        unsub.className = 'button button-ghost blog-newsletter-unsub';
        unsub.textContent = 'Sí, darme de baja';
        status.after(unsub);
        unsub.addEventListener('click', async () => {
            unsub.disabled = true;
            try {
                const res = await fetch(`/api/newsletter/baja?t=${unsubToken}`, { method: 'POST' });
                if (!res.ok) throw new Error(res.status);
                unsub.remove();
                show('Listo, ya no vas a recibir más mails del blog. Si cambiás de idea, podés volver a suscribirte acá.', 'ok');
            } catch (error) {
                unsub.disabled = false;
                show('No se pudo completar la baja. Probá de nuevo en un rato.', 'error');
            }
        });
    }
    box.scrollIntoView({ block: 'center' });
})();
