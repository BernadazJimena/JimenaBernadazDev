// Disponibilidad: "Disponible ahora / Fuera de horario" según la hora de Argentina.
// Horario habitual: días hábiles de 9 a 17. Desde el panel se puede "Cerrar ahora" o "Abrir ahora":
// ese cambio dura hasta el próximo cambio del horario habitual (el cierre, hasta la próxima apertura)
// y lo guarda el sitio (/api/disponibilidad → horario), así que lo ve todo el mundo.
(() => {
    const statusDot = document.querySelector('.status-dot');
    // Feriados y días no laborables (js/holidays.js). Si no cargó, el cartel sigue funcionando sin ellos.
    const holidays = window.JNBHolidays;
    const OPEN_HOUR = 9;
    const CLOSE_HOUR = 17;
    const HOUR = 60 * 60 * 1000;

    // ¿Está abierto según el horario habitual en ese momento?
    const isOpenAt = (moment) => {
        const parts = new Intl.DateTimeFormat('en-US', {
            weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', hour12: false,
            timeZone: 'America/Argentina/Buenos_Aires'
        }).formatToParts(moment);
        const get = (type) => parts.find((p) => p.type === type).value;
        const hour = Number(get('hour')) % 24;
        const isWeekend = get('weekday') === 'Sat' || get('weekday') === 'Sun';
        const isHoliday = Boolean(holidays) && !isWeekend && !holidays.isBusinessDay(`${get('year')}-${get('month')}-${get('day')}`);
        return !isWeekend && !isHoliday && hour >= OPEN_HOUR && hour < CLOSE_HOUR;
    };

    // Próximo momento (en punto) en que el horario habitual pasa a abierto, o cambia de estado, después de "from".
    // Los cambios son siempre en punto y Argentina no tiene horario de verano, así que alcanza con mirar hora por hora.
    const nextChange = (from, wantOpen) => {
        const start = isOpenAt(from);
        let t = new Date(Math.floor(from.getTime() / HOUR) * HOUR + HOUR);
        for (let i = 0; i < 24 * 45; i += 1, t = new Date(t.getTime() + HOUR)) {
            const open = isOpenAt(t);
            if (wantOpen ? open && !isOpenAt(new Date(t.getTime() - HOUR)) : open !== start) return t;
        }
        return null;
    };

    // Mensajes de ausencia temporal (se eligen en el panel al cerrar durante el horario de atención).
    // "mismo": vuelvo hoy a una hora · "dia": vuelvo el próximo día hábil a una hora · "sin": sin hora de regreso.
    // {hora} = hora de regreso; {cuando} = "mañana" o, si el próximo día hábil no es mañana, "el lunes".
    const AWAY = {
        'mismo-1': { es: 'Ausente por el momento · Retomo la atención a las {hora}', en: 'Away for the moment · I’ll be back at {hora}', pt: 'Ausente no momento · Retomo o atendimento às {hora}' },
        'mismo-2': { es: 'Salí un momento · Vuelvo a atender a las {hora}', en: 'Stepped out for a moment · Back at {hora}', pt: 'Saí por um momento · Volto a atender às {hora}' },
        'mismo-3': { es: 'Atención pausada · Estaré de regreso a las {hora}', en: 'Paused for now · I’ll be back at {hora}', pt: 'Atendimento pausado · Estarei de volta às {hora}' },
        'dia-1': { es: 'Ausente por hoy · Retomo la atención {cuando} a las {hora}', en: 'Away for today · I’ll be back {cuando} at {hora}', pt: 'Ausente hoje · Retomo o atendimento {cuando} às {hora}' },
        'dia-2': { es: 'Hoy no estaré disponible · Vuelvo {cuando} desde las {hora}', en: 'Not available today · Back {cuando} from {hora}', pt: 'Hoje não estarei disponível · Volto {cuando} a partir das {hora}' },
        'dia-3': { es: 'Atención pausada por hoy · Retomo el próximo día hábil a las {hora}', en: 'Paused for today · I’ll be back on the next business day at {hora}', pt: 'Atendimento pausado hoje · Retomo no próximo dia útil às {hora}' },
        'sin-1': { es: 'Ausente por el momento · Gracias por tu paciencia', en: 'Away for the moment · Thanks for your patience', pt: 'Ausente no momento · Obrigada pela paciência' },
        'sin-2': { es: 'En este momento no estoy disponible · Responderé apenas regrese', en: 'Not available right now · I’ll reply as soon as I’m back', pt: 'No momento não estou disponível · Respondo assim que voltar' },
        'sin-3': { es: 'Atención temporalmente pausada · Gracias por esperar', en: 'Temporarily paused · Thanks for waiting', pt: 'Atendimento temporariamente pausado · Obrigada por esperar' },
    };
    const TOMORROW = { es: 'mañana', en: 'tomorrow', pt: 'amanhã' };
    const ON_DAY = { es: (d) => `el ${d}`, en: (d) => `on ${d}`, pt: (d) => `na ${d}` }; // días hábiles: en portugués todos llevan "na"
    const LOCALE = { es: 'es-AR', en: 'en-US', pt: 'pt-BR' };
    const dayInArgentina = (moment) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(moment);
    const addDay = (iso) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); };

    const awayText = (id, until, lang = 'es', from = new Date()) => {
        const key = ['en', 'pt'].includes(lang) ? lang : 'es';
        let message = AWAY[id] ? id : 'sin-1';
        // "Vuelvo el próximo día hábil": el mismo día del regreso ya no es "por hoy", pasa al mensaje de "vuelvo hoy"
        if (until && message.startsWith('dia-') && dayInArgentina(until) === dayInArgentina(from)) message = message.replace('dia-', 'mismo-');
        const template = AWAY[message][key];
        if (!until) return template;
        const parts = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hourCycle: 'h23', timeZone: 'America/Argentina/Buenos_Aires' }).formatToParts(until);
        const hora = `${Number(parts.find((p) => p.type === 'hour').value)}:${parts.find((p) => p.type === 'minute').value}`;
        const day = dayInArgentina(until);
        const cuando = day === addDay(dayInArgentina(from)) ? TOMORROW[key]
            : ON_DAY[key](new Intl.DateTimeFormat(LOCALE[key], { weekday: 'long', timeZone: 'America/Argentina/Buenos_Aires' }).format(until));
        return template.replace('{hora}', hora).replace('{cuando}', cuando);
    };

    // Lo usa el panel para calcular hasta cuándo dura "Cerrar ahora" / "Abrir ahora" y para los mensajes de ausencia
    window.JNBHours = {
        isOpenAt,
        // Cerrar ahora: hasta la próxima apertura habitual. Abrir ahora: hasta el próximo cambio del horario habitual.
        manualUntil: (mode, from = new Date()) => nextChange(from, mode === 'cerrado'),
        // Próximo día hábil después de hoy (fecha 'AAAA-MM-DD'), para "vuelvo mañana"
        nextBusinessDay: (from = new Date()) => (holidays ? holidays.nextBusinessDay(dayInArgentina(from)) : null),
        today: (from = new Date()) => dayInArgentina(from),
        AWAY,
        awayText,
    };

    // Estado manual guardado desde el panel ({ modo: 'abierto' | 'cerrado', hasta, mensaje?, regreso? })
    let manual = null;
    const manualNow = () => (manual && new Date(manual.hasta) > new Date() ? manual.modo : '');
    const loadManual = async () => {
        try {
            const res = await fetch('/api/disponibilidad', { cache: 'no-store' });
            if (!res.ok) return;
            const data = await res.json();
            manual = data.horario && data.horario.modo && data.horario.hasta ? data.horario : null;
            updateAvailabilityStatus();
        } catch (e) { /* sin conexión: queda el horario habitual */ }
    };

    // Día del mes como ordinal en inglés: 1st, 2nd, 3rd, 4th, 11th, 12th, 13th, 21st, 22nd, 23rd, 31st
    const ORDINAL_SUFFIXES = { one: 'st', two: 'nd', few: 'rd', other: 'th' };
    const englishOrdinal = (number) => number + ORDINAL_SUFFIXES[new Intl.PluralRules('en', { type: 'ordinal' }).select(number)];

    // Texto del cartel en un feriado, con el próximo día hábil: "…respondo el martes 13…"
    const holidayMessage = (statusText, today) => {
        const reason = holidays?.blockReason(today);
        if (!reason || reason === 'finde') return '';
        const isNationalHoliday = reason === 'inamovible' || reason === 'trasladable';
        const template = (!isNationalHoliday && statusText.dataset.nonworking) || statusText.dataset.holiday;
        const nextDay = holidays.nextBusinessDay(today);
        if (!template || !nextDay) return '';
        const weekday = new Intl.DateTimeFormat(document.documentElement.lang, { weekday: 'long', timeZone: 'UTC' })
            .format(new Date(`${nextDay}T12:00:00Z`));
        const dayNumber = Number(nextDay.slice(8));
        return template.replace('{dia}', weekday).replace('{numero}', dayNumber).replace('{ordinal}', englishOrdinal(dayNumber));
    };

    const updateAvailabilityStatus = () => {
        if (!statusDot) return;

        const argentinaTime = new Intl.DateTimeFormat('en-US', {
            weekday: 'short',
            hour: 'numeric',
            hour12: false,
            timeZone: 'America/Argentina/Buenos_Aires'
        }).formatToParts(new Date());
        const currentHour = Number(argentinaTime.find(({ type }) => type === 'hour').value);
        const currentDay = argentinaTime.find(({ type }) => type === 'weekday').value;
        const isWeekend = currentDay === 'Sat' || currentDay === 'Sun';
        const today = holidays?.now().date;
        const isHoliday = Boolean(holidays) && !isWeekend && !holidays.isBusinessDay(today);
        const isScheduledClosed = isWeekend || isHoliday || currentHour >= CLOSE_HOUR || currentHour < OPEN_HOUR;
        // Lo que se eligió en el panel manda mientras dure; si no, el horario habitual.
        // Una ausencia solo se ve dentro del horario de atención: fuera de horario siempre va el mensaje habitual.
        const forced = manualNow();
        const isAway = forced === 'cerrado' && !isScheduledClosed;
        const isOutsideHours = forced === 'abierto' ? false : isScheduledClosed || isAway;

        statusDot.classList.toggle('is-closed', isOutsideHours);

        // El estado también se muestra en texto, no solo con el color del punto
        const statusText = document.querySelector('.status-text');
        if (statusText) {
            // Antes de las 9 de un día hábil respondo ese mismo día; después de las 17, el fin de semana o un feriado, el próximo día hábil.
            const isEarlyWeekday = !isWeekend && !isHoliday && currentHour < OPEN_HOUR;
            statusText.textContent = !isOutsideHours ? statusText.dataset.open
                : isAway ? awayText(manual.mensaje, manual.regreso ? new Date(manual.hasta) : null, document.documentElement.lang.slice(0, 2))
                : isEarlyWeekday && statusText.dataset.early ? statusText.dataset.early
                    : (isHoliday && holidayMessage(statusText, today)) || statusText.dataset.closed;
            statusText.closest('.availability-status')?.classList.toggle('is-closed', isOutsideHours);
        }
    };

    if (!statusDot) return;
    updateAvailabilityStatus();
    loadManual();
    setInterval(updateAvailabilityStatus, 60 * 1000);
    setInterval(loadManual, 5 * 60 * 1000);
})();
