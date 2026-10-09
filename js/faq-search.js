// Preguntas frecuentes: buscador que filtra las preguntas mientras se escribe (sin servidor ni base de datos)
(() => {
    const box = document.querySelector('.faq-search');
    if (!box) return;

    const input = box.querySelector('input');
    const clear = box.querySelector('.faq-search-clear');
    const status = box.querySelector('.faq-search-status');
    const empty = box.querySelector('.faq-search-empty');
    const toolbar = document.querySelector('.legal-toolbar');
    const groups = [...document.querySelectorAll('.faq-group')];

    // Se compara sin mayúsculas ni tildes: "dominio", "Dominio" y "domínio" encuentran lo mismo
    const plain = (text) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const questions = groups.flatMap((group) => [...group.querySelectorAll('details')].map((item) => ({
        item,
        group,
        // Además del texto, palabras clave por pregunta (data-keywords): "reembolso" encuentra la de cancelar
        text: plain(`${item.textContent} ${item.dataset.keywords || ''}`),
    })));

    const filter = () => {
        const words = plain(input.value).split(/\s+/).filter(Boolean);
        const searching = words.length > 0;
        let found = 0;

        questions.forEach((question) => {
            const match = words.every((word) => question.text.includes(word));
            question.item.hidden = !match;
            if (match) found += 1;
        });
        groups.forEach((group) => {
            group.hidden = !questions.some((question) => question.group === group && !question.item.hidden);
        });

        clear.hidden = !searching;
        if (toolbar) toolbar.hidden = searching && found === 0;
        empty.hidden = !searching || found > 0;
        status.textContent = searching && found > 0
            ? (found === 1 ? status.dataset.one : status.dataset.many.replace('{n}', found))
            : '';
    };

    input.addEventListener('input', filter);
    // En el celular, "Buscar" del teclado no recarga la página
    input.form?.addEventListener('submit', (event) => event.preventDefault());
    clear.addEventListener('click', () => {
        input.value = '';
        filter();
        input.focus();
    });
    // Al imprimir se muestran todas las preguntas
    window.addEventListener('beforeprint', () => {
        input.value = '';
        filter();
    });
    filter();
})();
