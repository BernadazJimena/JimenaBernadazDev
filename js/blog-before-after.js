// Blog: comparador "antes y después". Un control deslizable (también con teclado)
// muestra más o menos de la versión "antes" sobre la versión "después".
(() => {
    document.querySelectorAll('[data-blog-before-after]').forEach((box) => {
        const range = box.querySelector('input[type="range"]');
        const set = () => {
            box.style.setProperty('--pos', `${range.value}%`);
            range.setAttribute('aria-valuetext', `${range.value} % de la versión anterior`);
        };
        range.addEventListener('input', set);
        set();
    });
})();
