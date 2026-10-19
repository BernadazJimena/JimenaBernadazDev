// Portada: etiqueta que dice si estoy tomando proyectos nuevos.
//
// CÓMO CAMBIARLA: editar solo ESTADO (y, si querés, RESERVA_DESDE). Vale para los tres idiomas.
//   'abierto' → "Tomando proyectos nuevos" (punto verde)
//   'agenda'  → "Agenda completa este mes · Reservá tu lugar para {mes}" (punto amarillo, abre la agenda de Google)
//   'cerrado' → "Por ahora no tomo proyectos nuevos · Escribime y te aviso cuando haya lugar" (punto rojo, lleva al contacto)
(() => {
    const ESTADO = 'abierto';

    // Mes desde el que se puede reservar (en 'agenda'), con número del 1 al 12. Vacío = el mes que viene.
    const RESERVA_DESDE = '';

    // Página de reservas de Google Calendar ("Llamada de 20 min para hablar de tu web")
    const AGENDA_URL = 'https://calendar.app.google/3VxVXCLe7QQncUkg6';

    const lang = document.documentElement.lang.slice(0, 2);
    const monthNumber = RESERVA_DESDE
        ? Number(RESERVA_DESDE)
        : ((new Date().getMonth() + 1) % 12) + 1;
    const month = new Intl.DateTimeFormat(document.documentElement.lang, { month: 'long', timeZone: 'UTC' })
        .format(new Date(Date.UTC(2026, monthNumber - 1, 15)));

    const TEXTOS = {
        es: {
            abierto: { text: 'Tomando proyectos nuevos' },
            agenda: { text: 'Agenda completa este mes', link: `Reservá tu lugar para ${month}` },
            cerrado: { text: 'Por ahora no tomo proyectos nuevos', link: 'Escribime y te aviso cuando haya lugar' },
        },
        en: {
            abierto: { text: 'Taking on new projects' },
            agenda: { text: 'Fully booked this month', link: `Book your spot for ${month}` },
            cerrado: { text: 'Not taking on new projects right now', link: "Message me and I'll let you know when a spot opens" },
        },
        pt: {
            abierto: { text: 'Aceitando novos projetos' },
            agenda: { text: 'Agenda cheia este mês', link: `Reserve seu lugar para ${month}` },
            cerrado: { text: 'No momento não estou aceitando novos projetos', link: 'Me escreva e eu aviso quando houver vaga' },
        },
    };

    const badge = document.querySelector('.intake-status');
    const copy = (TEXTOS[lang] || TEXTOS.es)[ESTADO];
    if (!badge || !copy) return;

    const dot = document.createElement('span');
    dot.className = 'intake-dot';
    dot.setAttribute('aria-hidden', 'true');

    const text = document.createElement('span');
    text.textContent = copy.text;
    badge.replaceChildren(dot, text);

    if (copy.link) {
        const link = document.createElement('a');
        link.className = 'intake-link';
        // En 'agenda' el enlace abre la reserva en otra pestaña; en 'cerrado' baja al contacto
        const toBooking = ESTADO === 'agenda';
        link.href = toBooking ? AGENDA_URL : '#contacto';
        if (toBooking) {
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
        }
        link.innerHTML = `${copy.link} <span aria-hidden="true">${toBooking ? '↗' : '→'}</span>`;
        badge.append(link);
    }

    badge.dataset.state = ESTADO;
    badge.classList.add('is-ready');
})();
