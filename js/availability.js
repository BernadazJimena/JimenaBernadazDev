// Disponibilidad: "Disponible ahora / Fuera de horario" según la hora de Argentina
(() => {
    const statusDot = document.querySelector('.status-dot');

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
        const isOutsideHours = isWeekend || currentHour >= 17 || currentHour < 9;

        statusDot.classList.toggle('is-closed', isOutsideHours);

        // El estado también se muestra en texto, no solo con el color del punto
        const statusText = document.querySelector('.status-text');
        if (statusText) {
            // Antes de las 9 de un día hábil respondo ese mismo día; después de las 17 o el fin de semana, el próximo día hábil.
            // No contempla feriados.
            const isEarlyWeekday = !isWeekend && currentHour < 9;
            statusText.textContent = !isOutsideHours ? statusText.dataset.open
                : isEarlyWeekday && statusText.dataset.early ? statusText.dataset.early
                    : statusText.dataset.closed;
            statusText.closest('.availability-status')?.classList.toggle('is-closed', isOutsideHours);
        }
    };

    updateAvailabilityStatus();
    setInterval(updateAvailabilityStatus, 60 * 1000);
})();
