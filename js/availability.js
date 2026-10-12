// Disponibilidad: "Disponible ahora / Fuera de horario" según la hora de Argentina
(() => {
    const statusDot = document.querySelector('.status-dot');
    // Feriados y días no laborables (js/holidays.js). Si no cargó, el cartel sigue funcionando sin ellos.
    const holidays = window.JNBHolidays;

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
        const isOutsideHours = isWeekend || isHoliday || currentHour >= 17 || currentHour < 9;

        statusDot.classList.toggle('is-closed', isOutsideHours);

        // El estado también se muestra en texto, no solo con el color del punto
        const statusText = document.querySelector('.status-text');
        if (statusText) {
            // Antes de las 9 de un día hábil respondo ese mismo día; después de las 17, el fin de semana o un feriado, el próximo día hábil.
            const isEarlyWeekday = !isWeekend && !isHoliday && currentHour < 9;
            statusText.textContent = !isOutsideHours ? statusText.dataset.open
                : isEarlyWeekday && statusText.dataset.early ? statusText.dataset.early
                    : (isHoliday && holidayMessage(statusText, today)) || statusText.dataset.closed;
            statusText.closest('.availability-status')?.classList.toggle('is-closed', isOutsideHours);
        }
    };

    updateAvailabilityStatus();
    setInterval(updateAvailabilityStatus, 60 * 1000);
})();
