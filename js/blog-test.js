// Blog: test de sí o no con puntaje ("¿Tu web cumple?"). Al responder todo muestra
// el resultado y qué conviene mejorar según las respuestas "No".
(() => {
    document.querySelectorAll('[data-blog-test]').forEach((test) => {
        const questions = [...test.querySelectorAll('.blog-test-q')];
        const result = test.querySelector('.blog-test-result');
        const progress = test.querySelector('[data-answered]');

        const render = () => {
            const answers = questions.map((q) => q.querySelector('input:checked')?.value ?? null);
            const answered = answers.filter(Boolean).length;
            progress.textContent = `${answered} de ${questions.length} respondidas`;
            if (answered < questions.length) { result.hidden = true; return; }

            const score = answers.filter((a) => a === 'si').length;
            result.querySelector('[data-score]').textContent = `${score} de ${questions.length}`;
            result.querySelectorAll('[data-range]').forEach((el) => {
                const [min, max] = el.dataset.range.split('-').map(Number);
                el.hidden = score < min || score > max;
            });

            const list = result.querySelector('.blog-test-tips ul');
            list.innerHTML = '';
            questions.forEach((q, i) => {
                if (answers[i] !== 'no') return;
                const li = document.createElement('li');
                li.textContent = q.dataset.tip;
                list.append(li);
            });
            result.querySelector('.blog-test-tips').hidden = list.children.length === 0;
            result.hidden = false;
        };

        test.addEventListener('change', render);
        test.querySelector('.blog-test-reset').addEventListener('click', () => {
            test.querySelectorAll('input:checked').forEach((input) => { input.checked = false; });
            render();
            questions[0].querySelector('input').focus();
        });
        render();
    });
})();
