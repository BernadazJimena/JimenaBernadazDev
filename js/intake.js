// Portada: etiqueta que dice si estoy tomando proyectos nuevos.
//
// CÓMO CAMBIARLA: desde el panel (/api/admin → Disponibilidad) y "Guardar". La página la pide a /api/disponibilidad.
// ESTADO y RESERVA_DESDE de acá abajo solo se usan si el sitio no responde. Vale para los tres idiomas.
//   'abierto' → "Disponible para nuevos proyectos" (punto verde)
//   'agenda'  → "Agenda completa este mes · Reservá tu lugar para {mes}" (punto amarillo, abre la agenda de Google;
//               en inglés y portugués lleva al contacto, porque las llamadas son solo en español)
//   'cerrado' → "Por ahora no tomo proyectos nuevos · Escribime y te aviso cuando haya lugar" (punto rojo, lleva al contacto)
(() => {
    // Respaldo si /api/disponibilidad no responde
    const ESTADO_RESPALDO = 'abierto';

    // Mes desde el que se puede reservar (en 'agenda'), con número del 1 al 12. Vacío = el mes que viene.
    const RESERVA_DESDE_RESPALDO = '';

    // Página de reservas de Google Calendar ("Llamada de 20 min para hablar de tu web")
    const AGENDA_URL = 'https://calendar.app.google/3VxVXCLe7QQncUkg6';

    const lang = document.documentElement.lang.slice(0, 2);
    const badge = document.querySelector('.intake-status');
    if (!badge) return;

    const show = (ESTADO, RESERVA_DESDE) => {
    const monthNumber = RESERVA_DESDE
        ? Number(RESERVA_DESDE)
        : ((new Date().getMonth() + 1) % 12) + 1;
    const month = new Intl.DateTimeFormat(document.documentElement.lang, { month: 'long', timeZone: 'UTC' })
        .format(new Date(Date.UTC(2026, monthNumber - 1, 15)));

    const TEXTOS = {
        es: {
            abierto: { text: 'Disponible para nuevos proyectos' },
            agenda: { text: 'Agenda completa este mes', link: `Reservá tu lugar para ${month}` },
            cerrado: { text: 'Por ahora no tomo proyectos nuevos', link: 'Escribime y te aviso cuando haya lugar' },
        },
        en: {
            abierto: { text: 'Available for new projects' },
            agenda: { text: 'Fully booked this month', link: `Book your spot for ${month}` },
            cerrado: { text: 'Not taking on new projects right now', link: "Message me and I'll let you know when a spot opens" },
        },
        pt: {
            abierto: { text: 'Disponível para novos projetos' },
            agenda: { text: 'Agenda cheia este mês', link: `Reserve seu lugar para ${month}` },
            cerrado: { text: 'No momento não estou aceitando novos projetos', link: 'Me escreva e eu aviso quando houver vaga' },
        },
    };

    const copy = (TEXTOS[lang] || TEXTOS.es)[ESTADO];
    if (!copy) return;

    const dot = document.createElement('span');
    dot.className = 'intake-dot';
    dot.setAttribute('aria-hidden', 'true');

    const text = document.createElement('span');
    text.textContent = copy.text;
    badge.replaceChildren(dot, text);

    if (copy.link) {
        const link = document.createElement('a');
        link.className = 'intake-link';
        // En 'agenda' el enlace abre la reserva en otra pestaña; en 'cerrado' baja al contacto.
        // Las llamadas son solo en español: en inglés y portugués, 'agenda' también baja al contacto (por escrito)
        const toBooking = ESTADO === 'agenda' && lang === 'es';
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
    };

    // El estado lo elige Jimena desde el panel; si el sitio tarda o no responde, se usa el respaldo
    let shown = false;
    const fallback = setTimeout(() => { shown = true; show(ESTADO_RESPALDO, RESERVA_DESDE_RESPALDO); }, 2500);
    fetch('/api/disponibilidad', { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
        .then(({ estado, reservaDesde }) => {
            clearTimeout(fallback);
            if (!['abierto', 'agenda', 'cerrado'].includes(estado)) throw new Error('estado');
            shown = true;
            show(estado, reservaDesde || '');
        })
        .catch(() => {
            clearTimeout(fallback);
            if (!shown) show(ESTADO_RESPALDO, RESERVA_DESDE_RESPALDO);
        });
})();
