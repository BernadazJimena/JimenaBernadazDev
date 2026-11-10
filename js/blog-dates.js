// Blog: la fecha de publicación cambia según cuándo se lea.
//   - el mismo día:      "Publicado hoy a las 09:00"
//   - al día siguiente:  "Publicado ayer a las 09:00"
//   - después:           "Publicado el 9 de noviembre de 2026 a las 09:00"
// Se compara con la fecha de hoy en Argentina, sin importar desde dónde se mire.
(() => {
    const dayInArgentina = (date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(date);
    const now = new Date();
    const today = dayInArgentina(now);
    const yesterday = dayInArgentina(new Date(now.getTime() - 24 * 60 * 60 * 1000));

    document.querySelectorAll('.blog-published time[datetime]').forEach((time) => {
        const [, day, h = '09', m = '00'] = time.dateTime.match(/^(\d{4}-\d{2}-\d{2})(?:T(\d{2}):(\d{2}))?/) || [];
        if (!day) return;
        const wrapper = time.parentElement;
        const hour = `a las ${h}:${m}`;

        if (day === today || day === yesterday) {
            time.textContent = `${day === today ? 'hoy' : 'ayer'} ${hour}`;
            wrapper.replaceChildren('Publicado ', time);
        } else if (!time.textContent.includes(' a las ')) {
            // La fecha ya viene escrita en la página ("9 de noviembre de 2026"); se le suma la hora.
            time.textContent = `${time.textContent.trim()} ${hour}`;
        }
    });
})();
