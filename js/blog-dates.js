// Blog: el día de la publicación la fecha dice "Publicado hoy a las 9:00";
// desde el día siguiente, "Publicado el 9 de noviembre de 2026" (lo que ya viene escrito en la página).
// Se compara con la fecha de hoy en Argentina, sin importar desde dónde se mire.
(() => {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());

    document.querySelectorAll('.blog-published time[datetime]').forEach((time) => {
        const [, day, h = '09', m = '00'] = time.dateTime.match(/^(\d{4}-\d{2}-\d{2})(?:T(\d{2}):(\d{2}))?/) || [];
        if (day !== today) return;
        const wrapper = time.parentElement;
        time.textContent = `hoy a las ${Number(h)}:${m}`;
        wrapper.replaceChildren('Publicado ', time);
    });
})();
