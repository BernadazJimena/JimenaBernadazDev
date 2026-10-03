// Pie de página: año actual
(() => {
    const year = document.querySelector('#year');
    if (year) year.textContent = new Date().getFullYear();
})();
