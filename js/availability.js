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

    // Lo usa el panel para calcular hasta cuándo dura "Cerrar ahora" / "Abrir ahora"
    window.JNBHours = {
        isOpenAt,
        // Cerrar ahora: hasta la próxima apertura habitual. Abrir ahora: hasta el próximo cambio del horario habitual.
        manualUntil: (mode, from = new Date()) => nextChange(from, mode === 'cerrado'),
    };

    // Estado manual guardado desde el panel ({ modo: 'abierto' | 'cerrado', hasta: fecha })
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
        // Lo que se eligió en el panel manda mientras dure; si no, el horario habitual
        const forced = manualNow();
        const isOutsideHours = forced ? forced === 'cerrado' : isScheduledClosed;

        statusDot.classList.toggle('is-closed', isOutsideHours);

        // El estado también se muestra en texto, no solo con el color del punto
        const statusText = document.querySelector('.status-text');
        if (statusText) {
            // Antes de las 9 de un día hábil respondo ese mismo día; después de las 17, el fin de semana o un feriado, el próximo día hábil.
            const isEarlyWeekday = !isWeekend && !isHoliday && currentHour < OPEN_HOUR;
            statusText.textContent = !isOutsideHours ? statusText.dataset.open
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
