// Cómo trabajo, solo en el celular: los pasos se encienden solos a medida que se baja por la página,
// cada uno con su color, y se pinta el tramo de línea que lo une con el anterior (process.css).
// En computadora y tablet los pasos se encienden al pasar el mouse.
(() => {
    const mobile = window.matchMedia('(max-width: 35rem)');

    document.querySelectorAll('.process-scroll').forEach((list) => {
        const steps = [...list.children];

        // Un paso se enciende cuando su parte de arriba pasa el 60 % de la pantalla; al volver a subir se apaga
        const update = () => {
            if (!mobile.matches) {
                steps.forEach((step) => step.classList.remove('is-reached'));
                return;
            }
            const line = window.innerHeight * 0.6;
            steps.forEach((step) => step.classList.toggle('is-reached', step.getBoundingClientRect().top < line));
        };

        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        update();
    });
})();
