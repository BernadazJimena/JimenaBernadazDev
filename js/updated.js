// Fecha de actualización de los precios y de la página de privacidad: se cambia solo acá.
// Mientras esté vacía, las líneas que la usan quedan ocultas.
(() => {
    const UPDATED = {
        es: 'noviembre de 2026',
        en: 'November 2026',
        pt: 'novembro de 2026',
    };
    const date = UPDATED[document.documentElement.lang.slice(0, 2)];
    if (!date) return;
    document.querySelectorAll('[data-updated]').forEach((element) => {
        element.textContent = element.dataset.updated.replace('{fecha}', date);
        element.hidden = false;
    });
})();
