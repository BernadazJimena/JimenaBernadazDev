// Panel privado de Jimena (/api/admin). La página se carga sin datos; los datos llegan solo con la clave ADMIN_CLAVE,
// que se escribe una vez y queda guardada en esta pestaña (sessionStorage) hasta cerrarla.

export const adminPage = () => `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Panel | JNB Creative Studio</title>
<link rel="icon" href="/assets/images/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/css/pages/admin-tareas.css">
<link rel="stylesheet" href="/css/pages/admin-sorteos.css">
<link rel="stylesheet" href="/css/pages/admin-agenda.css">
<style>
  :root { color-scheme: light; --bg: #f3ebf6; --card: #ecdff4; --soft: #e2d0f0; --text: #211632; --muted: #625970; --line: #d9c6e8;
    --accent: #7543d6; --accent-ink: #5d31b8; --on-accent: #f3ebf6; --ok: #1f7a4d; --warn: #9a5b00; }
  @media (prefers-color-scheme: dark) { :root { color-scheme: dark; --bg: #100b1d; --card: #211938; --soft: #2a2047; --text: #f4f0ff;
    --muted: #b6aecf; --line: #2f2549; --accent: #9b6dff; --accent-ink: #b9a0ff; --on-accent: #100b1d; --ok: #6fd3a0; --warn: #f2b45c; } }
  * { box-sizing: border-box; }
  body { background: var(--bg); color: var(--text); font: 15px/1.5 Manrope, system-ui, sans-serif; margin: 0; }
  .wrap { margin: 0 auto; max-width: 78rem; padding: 1.25rem 1rem 4rem; }
  header { align-items: center; display: flex; flex-wrap: wrap; gap: .75rem; justify-content: space-between; margin-bottom: 1rem; }
  .brand { align-items: center; display: flex; font-weight: 800; gap: .5rem; }
  .mark { background: #24185a; border-radius: .5rem; color: #f3ebf6; font-size: .8rem; padding: .35rem .45rem; }
  h1 { font-size: 1.35rem; margin: 0; } h2 { font-size: 1.1rem; margin: 0 0 .75rem; } h3 { font-size: 1rem; margin: 0; }
  p { margin: 0 0 .5rem; } .muted { color: var(--muted); } .small { font-size: .85rem; }
  nav { display: flex; flex-wrap: wrap; gap: .4rem; margin: 0 0 1.25rem; }
  button, .btn { background: var(--card); border: 1px solid var(--line); border-radius: 999px; color: var(--text); cursor: pointer;
    font: inherit; font-size: .875rem; font-weight: 700; padding: .45rem .9rem; text-decoration: none; }
  button:hover, .btn:hover { border-color: var(--accent); color: var(--accent-ink); }
  button.primary { background: var(--accent); border-color: var(--accent); color: var(--on-accent); }
  nav button[aria-pressed="true"] { background: var(--accent); border-color: var(--accent); color: var(--on-accent); }
  .badge { background: var(--soft); border-radius: 999px; font-size: .75rem; font-weight: 800; margin-left: .3rem; padding: .05rem .5rem; }
  .card { background: var(--card); border: 1px solid var(--line); border-radius: 1rem; margin-bottom: .75rem; padding: 1rem 1.1rem; }
  .row { align-items: center; display: flex; flex-wrap: wrap; gap: .5rem .75rem; }
  .row.space { justify-content: space-between; }
  .chip { background: var(--soft); border-radius: 999px; font-size: .75rem; font-weight: 800; padding: .15rem .6rem; }
  .chip.ok { color: var(--ok); } .chip.warn { color: var(--warn); }
  .code { color: var(--accent-ink); font-weight: 800; letter-spacing: .03em; }
  .message { border-left: 3px solid var(--line); margin: .6rem 0; padding-left: .75rem; white-space: pre-wrap; }
  label { display: grid; font-size: .85rem; font-weight: 700; gap: .25rem; }
  input, select, textarea { background: var(--bg); border: 1px solid var(--line); border-radius: .6rem; color: var(--text); font: inherit; padding: .5rem .65rem; width: 100%; }
  textarea { min-height: 5rem; resize: vertical; }
  .grid { display: grid; gap: .75rem; grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr)); margin: .75rem 0; }
  details > summary { cursor: pointer; font-weight: 700; margin-top: .5rem; }
  table { border-collapse: collapse; width: 100%; } th, td { border-bottom: 1px solid var(--line); padding: .45rem .4rem; text-align: left; }
  td.n, th.n { text-align: right; }
  .linkbox { background: var(--soft); border-radius: .6rem; font-size: .85rem; margin: .6rem 0; overflow-wrap: anywhere; padding: .55rem .75rem; }
  .empty { color: var(--muted); padding: 1rem 0; }
  .login { margin: 15vh auto 0; max-width: 22rem; }
  .stepper { display: grid; gap: .4rem; grid-template-columns: repeat(5, minmax(0, 1fr)); margin-bottom: .25rem; }
  .step { align-items: center; border-radius: .8rem; display: flex; flex-direction: column; gap: .3rem; padding: .6rem .35rem; text-align: center; }
  .step-num { align-items: center; background: var(--bg); border: 1px solid var(--line); border-radius: 50%; display: flex; font-size: .8rem;
    height: 1.7rem; justify-content: center; width: 1.7rem; }
  .step-name { font-size: .75rem; line-height: 1.25; }
  .step.is-done { color: var(--muted); }
  .step.is-done .step-num { background: var(--accent); border-color: var(--accent); color: var(--on-accent); }
  .step[aria-pressed="true"] { background: var(--accent); border-color: var(--accent); color: var(--on-accent); }
  .step[aria-pressed="true"] .step-num { background: var(--on-accent); border-color: var(--on-accent); color: var(--accent); }
  .step:disabled { cursor: progress; opacity: .7; }
  @media (max-width: 560px) { .stepper { grid-template-columns: 1fr; } .step { flex-direction: row; justify-content: flex-start; padding: .45rem .7rem; text-align: left; } .step-name { font-size: .85rem; } }
  .toast { background: var(--accent); border-radius: 999px; bottom: 1.25rem; color: var(--on-accent); font-weight: 800; left: 50%;
    padding: .55rem 1.1rem; position: fixed; transform: translateX(-50%); }
  dialog.brief-view { background: var(--bg); border: 1px solid var(--line); border-radius: 1rem; color: var(--text); max-height: 90vh; max-width: 46rem; padding: 0; width: calc(100% - 2rem); }
  dialog.brief-view::backdrop { background: rgba(16, 11, 29, .55); }
  .brief-view-head { align-items: center; background: var(--card); border-bottom: 1px solid var(--line); display: flex; gap: .75rem; justify-content: space-between; padding: .9rem 1.1rem; position: sticky; top: 0; }
  .brief-view-body { padding: 1rem 1.1rem 1.5rem; }
  .bv-top { align-items: center; background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 22%, var(--card)), var(--card)); border: 1px solid var(--line); border-radius: .9rem; display: flex; flex-wrap: wrap; gap: .6rem; justify-content: space-between; margin-bottom: .9rem; padding: .9rem 1rem; }
  .bv-client { font-size: 1.15rem; font-weight: 800; margin: 0; }
  .bv-card { background: var(--card); border: 1px solid var(--line); border-left: 4px solid var(--bv); border-radius: .9rem; margin: 0 0 .9rem; padding: .3rem 1rem .8rem; }
  .bv-head { align-items: center; color: var(--bv); display: flex; font-size: .8rem; gap: .5rem; letter-spacing: .08em; margin: .6rem 0 .3rem; text-transform: uppercase; }
  .bv-icon { align-items: center; background: color-mix(in srgb, var(--bv) 16%, transparent); border-radius: .6rem; display: inline-flex; font-size: 1rem; height: 1.9rem; justify-content: center; width: 1.9rem; }
  .bv-row { border-top: 1px solid var(--line); padding: .55rem 0 .2rem; }
  .bv-row:first-of-type { border-top: 0; }
  .bv-row .brief-view-q { color: var(--muted); font-size: .8rem; margin: 0 0 .2rem; }
  .bv-row.is-changed { background: color-mix(in srgb, #f2b45c 10%, transparent); border-radius: .5rem; margin: 0 -.5rem; padding-left: .5rem; padding-right: .5rem; }
  .ans-chip { border-radius: 999px; display: inline-block; font-size: .8rem; font-weight: 800; padding: .15rem .6rem; }
  .ans-yes { background: color-mix(in srgb, #2fa36b 18%, transparent); color: #1f7a4d; }
  .ans-no { background: color-mix(in srgb, var(--muted) 18%, transparent); color: var(--muted); }
  @media (prefers-color-scheme: dark) { .ans-yes { color: #6fd3a0; } }
  .bv-file-icon { font-size: 1.1rem; }
  .brief-view-section { color: var(--accent-ink); font-size: .75rem; font-weight: 800; letter-spacing: .08em; margin: 1.4rem 0 .5rem; text-transform: uppercase; }
  .brief-view-q { font-size: .85rem; font-weight: 800; margin: .8rem 0 .15rem; }
  .brief-view-a { margin: 0; white-space: pre-line; }
  .brief-files-list { display: grid; gap: .4rem; list-style: none; margin: .5rem 0 0; padding: 0; }
  .brief-files-list li { align-items: center; background: var(--card); border: 1px solid var(--line); border-radius: .6rem; display: flex; gap: .6rem; padding: .45rem .7rem; }
  .brief-files-list span { flex: 1; overflow-wrap: anywhere; }
  .alert { background: #fff1d6; border: 1px solid #f2b45c; border-radius: .8rem; color: #5c3a00; font-weight: 700; margin-bottom: .9rem; padding: .7rem .9rem; }
  @media (prefers-color-scheme: dark) { .alert { background: #3a2a10; border-color: #9a6a1f; color: #ffd99a; } }
  .chip.alert-chip { background: #f2b45c; color: #3a2400; }
  .brief-view-a.is-changed { background: color-mix(in srgb, #f2b45c 22%, transparent); border-radius: .4rem; padding: .2rem .4rem; }
  .brief-view-prev { color: var(--muted); font-size: .85rem; margin: .2rem 0 0; text-decoration: line-through; white-space: pre-line; }
  .tag-edit { background: #f2b45c; border-radius: 999px; color: #3a2400; font-size: .7rem; font-weight: 800; margin-left: .35rem; padding: .05rem .45rem; vertical-align: .1em; }
  .away-box { margin-top: .75rem; } .away-box summary { display: inline-flex; list-style: none; } .away-box summary::-webkit-details-marker { display: none; } .away-box[open] summary { margin-bottom: .5rem; }
  .avail-options { display: grid; gap: .5rem; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); margin: .75rem 0; }
  .avail-option { align-items: flex-start; background: var(--bg); border: 1px solid var(--line); border-radius: .8rem; cursor: pointer; display: flex; font-weight: 700; gap: .55rem; padding: .7rem .8rem; }
  .avail-option:has(input:checked) { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }
  .avail-option input { accent-color: var(--accent); margin-top: .2rem; width: auto; }
  .avail-dot { border-radius: 50%; display: inline-block; flex-shrink: 0; height: .65rem; margin-top: .4rem; width: .65rem; }
  .avail-preview { background: var(--bg); border: 1px dashed var(--line); border-radius: .8rem; margin: .5rem 0 .75rem; padding: .6rem .8rem; }
  .client-group-title { color: var(--muted); font-size: .75rem; font-weight: 800; letter-spacing: .08em; margin: 1rem 0 .4rem; text-transform: uppercase; }
  .client-list { display: grid; gap: .5rem; }
  .client-row { align-items: center; background: var(--card); border: 1px solid var(--line); border-radius: .9rem; display: grid; gap: .5rem .9rem; grid-template-columns: minmax(10rem, 1fr) auto 1rem; padding: .75rem 1rem; text-align: left; width: 100%; }
  .client-row:hover { border-color: var(--accent); }
  .client-row-main { display: flex; flex-direction: column; gap: .1rem; }
  .client-row-main strong { font-size: 1rem; }
  .client-row-tags { display: flex; flex-wrap: wrap; gap: .3rem; justify-content: flex-end; }
  .client-row-go { color: var(--accent-ink); font-size: 1.4rem; font-weight: 800; }
  @media (max-width: 640px) { .client-row { grid-template-columns: 1fr 1rem; } .client-row-tags { grid-column: 1; justify-content: flex-start; grid-row: 2; } .client-row-go { grid-row: 1 / span 2; grid-column: 2; } }
  .subtabs { border-bottom: 1px solid var(--line); display: flex; gap: .3rem; margin: .5rem 0 1rem; overflow-x: auto; padding-bottom: .5rem; }
  .subtabs button { flex-shrink: 0; }
  .subtabs button[aria-pressed="true"] { background: var(--accent); border-color: var(--accent); color: var(--on-accent); }
  .timeline { list-style: none; margin: 0; padding: 0; position: relative; }
  .timeline li { display: grid; gap: .75rem; grid-template-columns: 2.2rem 1fr; padding-bottom: 1rem; position: relative; }
  .timeline li:not(:last-child)::before { background: var(--line); bottom: 0; content: ""; left: 1.05rem; position: absolute; top: 2.3rem; width: 2px; }
  .tl-icon { align-items: center; background: var(--card); border: 1px solid var(--line); border-radius: 50%; display: flex; height: 2.2rem; justify-content: center; width: 2.2rem; }
  .tl-text { font-weight: 700; margin: .35rem 0 .1rem; }
  .coupon-code { border: 2px dashed var(--accent); border-radius: .8rem; font-size: 1.4rem; font-weight: 800; letter-spacing: .1em; margin: .3rem 0 .6rem; padding: .5rem; text-align: center; }
  .check-line { align-items: center; display: flex; font-size: .9rem; gap: .5rem; margin: .75rem 0; }
  .check-line input { accent-color: var(--accent); width: auto; }
  .price-row { display: grid; gap: .5rem; grid-template-columns: 7.5rem 1fr; }
  /* Menú lateral: fijo a la izquierda, con su propio desplazamiento; se puede contraer (solo íconos) */
  :root { --side-w: 14.25rem; --side-bg: color-mix(in srgb, var(--card) 62%, var(--bg)); }
  html.side-collapsed { --side-w: 4.5rem; }
  .wrap:has(#app:not([hidden])) { margin: 0; max-width: none; padding: 1.25rem 2rem 4rem calc(var(--side-w) + 2rem); transition: padding-left .22s ease; }
  #app main { margin: 0 auto; max-width: 66rem; }
  .side { background: var(--side-bg); border-right: 1px solid var(--line); bottom: 0; display: flex; flex-direction: column; left: 0; margin: 0; position: fixed; top: 0; transition: width .22s ease, transform .22s ease; width: var(--side-w); z-index: 30; }
  .side-head { align-items: center; display: flex; gap: .6rem; min-height: 4rem; overflow: hidden; padding: 1rem 1rem .75rem; white-space: nowrap; }
  .side-head .mark { flex-shrink: 0; }
  .side-title { display: flex; flex-direction: column; line-height: 1.2; transition: opacity .15s ease; }
  .side-title strong { font-size: .92rem; }
  .side-title span { color: var(--muted); font-size: .72rem; font-weight: 600; }
  .side-scroll { display: block; flex: 1; margin: 0; overflow-x: hidden; overflow-y: auto; padding: .25rem .5rem 1rem; scrollbar-color: var(--line) transparent; scrollbar-width: thin; }
  .side-group { color: var(--muted); font-size: .66rem; font-weight: 800; letter-spacing: .11em; margin: 1.1rem .7rem .35rem; opacity: .75; overflow: hidden; text-transform: uppercase; white-space: nowrap; }
  .side-group:first-child { margin-top: .25rem; }
  .side a { align-items: center; border-radius: .6rem; color: var(--muted); display: flex; font-size: .875rem; font-weight: 600; gap: .65rem; margin: .1rem 0; overflow: hidden; padding: .5rem .6rem; position: relative; text-decoration: none; transition: background .15s ease, color .15s ease; white-space: nowrap; }
  .side a:hover { background: color-mix(in srgb, var(--accent) 9%, transparent); color: var(--text); }
  .side a:focus-visible, .side-foot button:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
  .side a[aria-current="page"] { background: color-mix(in srgb, var(--accent) 20%, transparent); color: var(--text); }
  .side a[aria-current="page"] .ico { color: var(--accent-ink); }
  .ico { fill: none; flex-shrink: 0; height: 1.15rem; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.8; width: 1.15rem; }
  .side-label { flex: 1; overflow: hidden; text-overflow: ellipsis; transition: opacity .15s ease; }
  .side .badge { background: color-mix(in srgb, var(--accent) 22%, transparent); color: var(--accent-ink); font-size: .66rem; line-height: 1.5; margin: 0; min-width: 1.2rem; padding: 0 .4rem; text-align: center; }
  .side .badge:empty { display: none; }
  .side-foot { border-top: 1px solid var(--line); padding: .6rem; }
  .side-foot button { align-items: center; background: none; border: 0; border-radius: .6rem; color: var(--muted); display: flex; font-size: .85rem; font-weight: 600; gap: .7rem; overflow: hidden; padding: .5rem .65rem; white-space: nowrap; width: 100%; }
  .side-foot button:hover { background: color-mix(in srgb, var(--accent) 9%, transparent); color: var(--text); }
  html.side-collapsed .side-foot .ico { transform: scaleX(-1); }
  .side-close { display: none; }
  /* Contraída: solo íconos; las categorías pasan a ser una línea fina y los contadores, un número chico sobre el ícono */
  html.side-collapsed .side-title, html.side-collapsed .side-label { opacity: 0; }
  html.side-collapsed .side-head { justify-content: center; padding-left: 0; padding-right: 0; }
  html.side-collapsed .side-title { width: 0; }
  html.side-collapsed .side-group { background: var(--line); height: 1px; margin: .7rem .55rem; opacity: 1; padding: 0; text-indent: -999px; }
  html.side-collapsed .side a, html.side-collapsed .side-foot button { gap: 0; justify-content: center; padding: .55rem 0; }
  html.side-collapsed .side a .side-label, html.side-collapsed .side-foot .side-label { flex: 0; width: 0; }
  html.side-collapsed .side .badge { font-size: .58rem; left: 50%; line-height: 1.35; min-width: 1rem; padding: 0 .25rem; position: absolute; top: .1rem; }
  .side-tip { background: var(--text); border-radius: .45rem; color: var(--bg); font-size: .8rem; font-weight: 700; padding: .3rem .6rem; pointer-events: none; position: fixed; transform: translateY(-50%); white-space: nowrap; z-index: 40; }
  .menu-toggle { align-items: center; display: none; gap: .4rem; }
  .menu-toggle .ico { height: 1rem; width: 1rem; }
  .top-brand { display: none; }
  .side-backdrop { display: none; }
  /* Celular: la barra es un panel que se abre con el botón Menú y se cierra al elegir una sección */
  @media (max-width: 767px) {
    html, html.side-collapsed { --side-w: 0px; }
    .wrap:has(#app:not([hidden])) { padding: 1rem 1rem 4rem; }
    .side { box-shadow: 0 0 2rem rgba(16, 11, 29, .45); transform: translateX(-105%); width: min(17rem, 85vw); }
    .side.is-open { transform: none; }
    html.side-collapsed .side-title, html.side-collapsed .side-label { opacity: 1; }
    html.side-collapsed .side-title { width: auto; }
    html.side-collapsed .side-head { justify-content: flex-start; padding: 1rem 1rem .75rem; }
    html.side-collapsed .side-group { background: none; height: auto; margin: 1.1rem .7rem .35rem; opacity: .75; text-indent: 0; }
    html.side-collapsed .side a { gap: .7rem; justify-content: flex-start; padding: .5rem .65rem; }
    html.side-collapsed .side a .side-label { flex: 1; width: auto; }
    html.side-collapsed .side .badge { font-size: .66rem; position: static; }
    .side-foot { display: none; }
    .side-close { background: none; border: 0; color: var(--muted); display: inline-flex; margin-left: auto; padding: .35rem; }
    .side.is-open + .side-backdrop { background: rgba(16, 11, 29, .5); display: block; inset: 0; position: fixed; z-index: 25; }
    .menu-toggle { display: inline-flex; }
    .top-brand { display: flex; }
  }
  @media (prefers-reduced-motion: reduce) { .side, .wrap { transition: none !important; } }
  .module-intro { color: var(--muted); margin: -.4rem 0 1rem; }
  .quote-card.is-min > :not(:first-child):not(.q-who) { display: none; }
  .quote-card.is-min .q-who { margin-bottom: 0; }
  .min-btn { margin-left: .3rem; min-width: 2rem; padding: .1rem .5rem; }
  .stats { display: grid; gap: .75rem; grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr)); margin-bottom: 1.25rem; }
  .stat { background: var(--card); border: 1px solid var(--line); border-radius: 1rem; color: var(--text); display: block; padding: .9rem 1rem; text-decoration: none; }
  @media (max-width: 640px) { .stats { gap: .5rem; grid-template-columns: repeat(2, minmax(0, 1fr)); } .stat { padding: .65rem .75rem; } }
  .stat:hover { border-color: var(--accent); }
  .stat-n { color: var(--accent-ink); display: block; font-size: 1.8rem; font-weight: 800; line-height: 1.1; }
  .stat-l { color: var(--muted); display: block; font-size: .85rem; font-weight: 700; }
  .filters { display: grid; gap: .5rem; grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr)); margin: .75rem 0 1rem; }
  .filters label { font-size: .75rem; }
  .pager { align-items: center; display: flex; flex-wrap: wrap; gap: .5rem; justify-content: center; margin: 1rem 0; }
  .pager button:disabled { cursor: default; opacity: .45; }
  .client-card { margin: 0; }
  .client-card > summary { list-style: none; margin: 0; }
  .client-card > summary::-webkit-details-marker { display: none; }
  .client-card[open] > summary { border-bottom-left-radius: 0; border-bottom-right-radius: 0; border-color: var(--accent); }
  .client-card[open] .client-row-go { transform: rotate(90deg); }
  .client-card-body { background: var(--card); border: 1px solid var(--accent); border-radius: 0 0 .9rem .9rem; border-top: 0; padding: .25rem 1rem 1rem; }
  .client-code { color: var(--accent-ink); font-weight: 800; letter-spacing: .03em; }
  .chip.new { background: var(--accent); color: var(--on-accent); }
  .link-btn { background: none; border: 0; border-radius: 0; color: var(--accent-ink); padding: 0; text-decoration: underline; }
  .feed { list-style: none; margin: 0; padding: 0; }
  .feed li { align-items: flex-start; border-bottom: 1px solid var(--line); display: grid; gap: .6rem; grid-template-columns: 2rem 1fr; padding: .55rem 0; }
  .feed li:last-child { border-bottom: 0; }
  .money-ok { color: var(--ok); font-weight: 800; } .money-warn { color: var(--warn); font-weight: 800; }
  .table-wrap { overflow-x: auto; }
  [hidden] { display: none !important; }
</style></head>
<body><svg width="0" height="0" style="position:absolute" aria-hidden="true"><symbol id="i-kanban" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 7v7"/><path d="M12 7v4"/><path d="M16 7v9"/></symbol><symbol id="i-dashboard" viewBox="0 0 24 24"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></symbol><symbol id="i-users" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></symbol><symbol id="i-folder" viewBox="0 0 24 24"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></symbol><symbol id="i-mail" viewBox="0 0 24 24"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></symbol><symbol id="i-file" viewBox="0 0 24 24"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></symbol><symbol id="i-card" viewBox="0 0 24 24"><rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/></symbol><symbol id="i-star" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></symbol><symbol id="i-ticket" viewBox="0 0 24 24"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></symbol><symbol id="i-megaphone" viewBox="0 0 24 24"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></symbol><symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></symbol><symbol id="i-help" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></symbol><symbol id="i-news" viewBox="0 0 24 24"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></symbol><symbol id="i-settings" viewBox="0 0 24 24"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></symbol><symbol id="i-gift" viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5"/></symbol><symbol id="i-panel" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="m16 15-3-3 3-3"/></symbol><symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></symbol><symbol id="i-x" viewBox="0 0 24 24"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></symbol></svg>
<div class="wrap">
  <form class="card login" id="login" hidden>
    <div class="brand" style="margin-bottom:.75rem"><span class="mark">JNB</span> Panel</div>
    <label>Clave del panel<input type="password" id="key" autocomplete="current-password" required></label>
    <p class="small muted" id="login-error" style="margin-top:.5rem" hidden>La clave no es correcta.</p>
    <button class="primary" style="margin-top:.75rem">Entrar</button>
  </form>

  <div id="app" hidden>
    <header>
      <div class="row"><button type="button" class="menu-toggle" id="menu-toggle" aria-expanded="false" aria-controls="side"><svg class="ico" aria-hidden="true"><use href="#i-menu"/></svg>Menú</button><div class="brand top-brand"><span class="mark">JNB</span><h1>Panel</h1></div></div>
      <div class="row"><a class="btn" href="/" target="_blank">Ver el sitio ↗</a><button id="logout">Salir</button></div>
    </header>
    <div class="layout">
      <aside class="side" id="side">
        <div class="side-head"><span class="mark">JNB</span><span class="side-title"><strong>JNB Creative Studio</strong><span>Panel de administración</span></span><button type="button" class="side-close" id="side-close" aria-label="Cerrar el menú"><svg class="ico" aria-hidden="true"><use href="#i-x"/></svg></button></div>
        <nav class="side-scroll" aria-label="Secciones del panel">
          <p class="side-group">General</p>
          <a href="#dashboard" data-mod="dashboard"><svg class="ico" aria-hidden="true"><use href="#i-dashboard"/></svg><span class="side-label">Dashboard</span></a>
          <a href="#tareas" data-mod="tareas"><svg class="ico" aria-hidden="true"><use href="#i-kanban"/></svg><span class="side-label">Gestor de tareas</span><span class="badge" id="n-tareas" title=""></span></a>
          <p class="side-group">Comercial</p>
          <a href="#clientes" data-mod="clientes"><svg class="ico" aria-hidden="true"><use href="#i-users"/></svg><span class="side-label">Clientes</span><span class="badge" id="n-clientes"></span></a>
          <a href="#proyectos" data-mod="proyectos"><svg class="ico" aria-hidden="true"><use href="#i-folder"/></svg><span class="side-label">Proyectos</span><span class="badge" id="n-proyectos"></span></a>
          <a href="#consultas" data-mod="consultas"><svg class="ico" aria-hidden="true"><use href="#i-mail"/></svg><span class="side-label">Consultas</span><span class="badge" id="n-consultas"></span></a>
          <a href="#presupuestos" data-mod="presupuestos"><svg class="ico" aria-hidden="true"><use href="#i-file"/></svg><span class="side-label">Presupuestos</span><span class="badge" id="n-presupuestos"></span></a>
          <a href="#pagos" data-mod="pagos"><svg class="ico" aria-hidden="true"><use href="#i-card"/></svg><span class="side-label">Pagos</span><span class="badge" id="n-pagos"></span></a>
          <p class="side-group">Postventa</p>
          <a href="#resenas" data-mod="resenas"><svg class="ico" aria-hidden="true"><use href="#i-star"/></svg><span class="side-label">Reseñas</span><span class="badge" id="n-resenas"></span></a>
          <a href="#cupones" data-mod="cupones"><svg class="ico" aria-hidden="true"><use href="#i-ticket"/></svg><span class="side-label">Cupones</span><span class="badge" id="n-cupones"></span></a>
          <a href="#sorteos" data-mod="sorteos"><svg class="ico" aria-hidden="true"><use href="#i-gift"/></svg><span class="side-label">Sorteos</span><span class="badge" id="n-sorteos"></span></a>
          <a href="#brief" data-mod="brief"><svg class="ico" aria-hidden="true"><use href="#i-file"/></svg><span class="side-label">Brief</span></a>
          <a href="#agenda" data-mod="agenda"><svg class="ico" aria-hidden="true"><use href="#i-clock"/></svg><span class="side-label">Plazos y vencimientos</span><span class="badge" id="n-agenda"></span></a>
          <a href="#numeros" data-mod="numeros"><svg class="ico" aria-hidden="true"><use href="#i-dashboard"/></svg><span class="side-label">Ingresos y origen</span></a>
          <a href="#cotizador" data-mod="cotizador"><svg class="ico" aria-hidden="true"><use href="#i-card"/></svg><span class="side-label">Funcionalidades y cotizador</span></a>
          <p class="side-group">Sitio web</p>
          <a href="#cartel" data-mod="cartel"><svg class="ico" aria-hidden="true"><use href="#i-megaphone"/></svg><span class="side-label">Cartel del inicio</span></a>
          <a href="#horario" data-mod="horario"><svg class="ico" aria-hidden="true"><use href="#i-clock"/></svg><span class="side-label">Horario de atención</span></a>
          <a href="#faq" data-mod="faq"><svg class="ico" aria-hidden="true"><use href="#i-help"/></svg><span class="side-label">Preguntas frecuentes</span></a>
          <a href="#newsletter" data-mod="newsletter"><svg class="ico" aria-hidden="true"><use href="#i-news"/></svg><span class="side-label">Newsletter</span><span class="badge" id="n-newsletter"></span></a>
          <p class="side-group">Configuración</p>
          <a href="#config" data-mod="config"><svg class="ico" aria-hidden="true"><use href="#i-settings"/></svg><span class="side-label">Configuración</span><span class="badge" id="n-config"></span></a>
        </nav>
        <div class="side-foot"><button type="button" id="side-collapse" aria-expanded="true"><svg class="ico" aria-hidden="true"><use href="#i-panel"/></svg><span class="side-label">Contraer menú</span></button></div>
      </aside>
      <div class="side-backdrop" id="side-backdrop"></div>
      <div class="side-tip" id="side-tip" role="tooltip" hidden></div>
      <main>
        <section class="module" id="m-dashboard"></section>
        <section class="module" id="m-tareas" hidden></section>
        <section class="module" id="m-clientes" hidden></section>
        <section class="module" id="m-proyectos" hidden><div id="tab-proyectos"></div></section>
        <section class="module" id="m-consultas" hidden></section>
        <section class="module" id="m-presupuestos" hidden></section>
        <section class="module" id="m-pagos" hidden></section>
        <section class="module" id="m-resenas" hidden><div id="tab-resenas"></div></section>
        <section class="module" id="m-cupones" hidden><div id="tab-cupones"></div></section>
        <section class="module" id="m-sorteos" hidden></section>
        <section class="module" id="m-brief" hidden></section>
        <section class="module" id="m-agenda" hidden></section>
        <section class="module" id="m-numeros" hidden></section>
        <section class="module" id="m-cotizador" hidden></section>
        <section class="module" id="m-cartel" hidden><div id="availability"></div></section>
        <section class="module" id="m-horario" hidden><div id="hours"></div></section>
        <section class="module" id="m-faq" hidden><div id="tab-faq"></div></section>
        <section class="module" id="m-newsletter" hidden><div id="tab-newsletter"></div></section>
        <section class="module" id="m-config" hidden><h2>Configuración</h2><div id="mail-check"></div><div id="backup"></div></section>
      </main>
    </div>
  </div>
  <dialog class="brief-view" id="brief-view"><div class="brief-view-head"><strong id="brief-view-title">Brief</strong><div class="row"><button type="button" id="brief-view-print">Imprimir</button><button type="button" id="brief-view-close">Cerrar</button></div></div><div class="brief-view-body" id="brief-view-body"></div></dialog>
  <div class="toast" id="toast" role="status" hidden></div>
</div>
<script src="/js/holidays.js"></script>
<script src="/js/availability.js"></script>
<script src="/js/admin-tareas.js"></script>
<script src="/js/admin-sorteos.js"></script>
<script src="/js/brief.js"></script>
<script src="/js/admin-brief.js"></script>
<script src="/js/admin-agenda.js"></script>
<script src="/js/pricing.js"></script>
<script src="/js/custom-plan.js"></script>
<script src="/js/admin-cotizador.js"></script>
<script>
(() => {
  const STAGES = ['Reserva y confirmación', 'Recepción de materiales', 'Diseño y desarrollo', 'Revisión y ajustes', 'Publicación y entrega'];
  const STATUS = { recibido: 'Recibido', preparando: 'Preparando', enviado: 'Enviado', aceptado: 'Aceptado' };
  const SENT = ['enviado', 'aceptado'];
  // Condiciones sugeridas para cada presupuesto, sacadas de lo que ya dicen Términos y Preguntas frecuentes.
  // Se completan solas según el plan y el idioma del cliente; se pueden editar en cada presupuesto.
  const defaultConditions = (plan, lang) => {
    const isStore = /emprendedor|empreendedor/i.test(plan);
    const isPlan = /b[aá]sico|basic|premium|emprendedor|empreendedor/i.test(plan);
    const rounds = /premium/i.test(plan) ? 3 : 2;
    const T = {
      es: [
        'El trabajo empieza cuando se confirma el anticipo o la compra en mi tienda.',
        'El plazo de entrega se cuenta desde que recibo todo el material: textos, fotos, logo, colores y datos de contacto.',
        isPlan ? ('Incluye ' + rounds + ' rondas de ajustes') + (isStore ? ' mientras armo tu tienda.' : ' mientras armo tu web.') + ' Los cambios que amplían lo acordado se cotizan aparte.' : '',
        'Una ronda de ajustes es una entrega con todas tus observaciones juntas. Los cambios de alcance (secciones, páginas o funcionalidades nuevas) y las rondas extra se cotizan aparte, y los hago solo con tu aprobación.',
        'El mantenimiento después de publicar no está incluido: el soporte por mes es opcional y se contrata aparte.',
        isStore ? 'El dominio se gestiona desde tu plan de Tiendanube o Empretienda.' : 'El dominio se registra a tu nombre y su costo está a tu cargo. La publicación en mi cuenta de Cloudflare no tiene costo para vos.',
      ],
      en: [
        'Work starts once the deposit is confirmed.',
        'The delivery time starts once I receive all the content: texts, photos, logo, colors and contact details.',
        isPlan ? ('Includes ' + rounds + ' rounds of adjustments') + (isStore ? ' while I build your store.' : ' while I build your website.') + ' Changes that go beyond what we agreed are quoted separately.' : '',
        'A round of adjustments is one delivery of all your feedback together. Changes of scope (new sections, pages or features) and extra rounds are quoted separately, and I only do them with your approval.',
        'Maintenance after launch is not included: monthly support is optional and contracted separately.',
        isStore ? 'The domain is managed from your Tiendanube or Empretienda plan.' : 'The domain is registered in your name and you cover its cost. Publishing on my Cloudflare account is free for you.',
      ],
      pt: [
        'O trabalho começa quando o sinal ou a compra na minha loja é confirmado.',
        'O prazo de entrega é contado a partir do recebimento de todo o material: textos, fotos, logo, cores e dados de contato.',
        isPlan ? ('Inclui ' + rounds + ' rodadas de ajustes') + (isStore ? ' enquanto monto a sua loja.' : ' enquanto monto o seu site.') + ' Mudanças que ampliam o combinado são orçadas à parte.' : '',
        'Uma rodada de ajustes é um envio com todas as suas observações juntas. Mudanças de escopo (seções, páginas ou funcionalidades novas) e rodadas extras são orçadas à parte, e só faço com a sua aprovação.',
        'A manutenção depois da publicação não está incluída: o suporte mensal é opcional e contratado à parte.',
        isStore ? 'O domínio é gerenciado pelo seu plano da Tiendanube (Nuvemshop) ou Empretienda.' : 'O domínio é registrado no seu nome e o custo é seu. A publicação na minha conta da Cloudflare não tem custo para você.',
      ],
    }[lang] || [];
    return T.filter(Boolean).join('\\n'); // doble barra: esta página se arma dentro de un texto del Worker
  };
  const LANG = { es: 'Español', en: 'Inglés', pt: 'Portugués' };
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const date = (iso) => iso ? new Date(iso).toLocaleString('es-AR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
  const day = (iso) => iso ? iso.split('-').reverse().join('/') : '';
  const clientLink = (page, lang, token) => location.origin + '/' + page + '/' + (lang === 'es' ? '' : lang) + '?c=' + token;
  const $ = (id) => document.getElementById(id);
  // Un solo link por cliente: si el proyecto salió de un presupuesto, se usa el link del presupuesto (muestra las dos cosas)
  const projectLink = (p) => (p.quote ? clientLink('mi-presupuesto', p.lang, p.quote) : clientLink('mi-proyecto', p.lang, p.token));
  const SHARE = {
    es: (name, link) => '¡Hola, ' + name + '! Acá podés ver tu presupuesto y seguir el avance de tu proyecto: ' + link,
    en: (name, link) => 'Hi, ' + name + '! Here you can see your quote and follow your project: ' + link,
    pt: (name, link) => 'Olá, ' + name + '! Aqui você pode ver seu orçamento e acompanhar o seu projeto: ' + link,
  };
  const linkBox = (link, lang, name) => '<div class="linkbox"><span class="small muted">Link del cliente</span><br>' + esc(link) + '</div>'
    + '<div class="row"><button type="button" data-copy="' + esc(link) + '">Copiar link</button>'
    + '<a class="btn" target="_blank" href="' + esc('https://wa.me/?text=' + encodeURIComponent((SHARE[lang] || SHARE.es)(name, link))) + '">Mandar por WhatsApp ↗</a>'
    + '<a class="btn" target="_blank" href="' + esc(link) + '">Abrir ↗</a></div>';

  // Tarjetas de consultas y presupuestos minimizadas (se recuerda en este navegador)
  let minimized = new Set();
  try { minimized = new Set(JSON.parse(localStorage.getItem('jnb-admin-min') || '[]')); } catch (e) {}
  const isMin = (q) => minimized.has(q.code);
  const saveMin = () => { try { localStorage.setItem('jnb-admin-min', JSON.stringify([...minimized].slice(-3000))); } catch (e) {} };
  document.addEventListener('click', (e) => {
    const one = e.target.closest('[data-min]');
    const all = e.target.closest('[data-min-all]');
    if (!one && !all) return;
    const cards = one ? [one.closest('.quote-card')] : [...all.closest('.module').querySelectorAll('.quote-card')];
    const close = one ? !cards[0].classList.contains('is-min') : all.dataset.minAll === '1';
    cards.forEach((card) => {
      card.classList.toggle('is-min', close);
      if (close) minimized.add(card.dataset.code); else minimized.delete(card.dataset.code);
      const b = card.querySelector('[data-min]');
      b.textContent = close ? '▸' : '▾';
      b.setAttribute('aria-expanded', String(!close));
    });
    if (all) { all.dataset.minAll = close ? '0' : '1'; all.textContent = close ? '↕ Expandir todas' : '↕ Minimizar todas'; }
    saveMin();
  });
  let key = '';
  try { key = sessionStorage.getItem('jnb-admin') || ''; } catch (e) {}
  let data = null;
  let route = { mod: 'dashboard', id: '' };

  const toast = (msg) => { const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.timer); toast.timer = setTimeout(() => { t.hidden = true; }, 2200); };
  const copy = async (text) => { try { await navigator.clipboard.writeText(text); toast('Link copiado'); } catch (e) { prompt('Copiá el link:', text); } };

  const api = async (path, body) => {
    const res = await fetch('/api/admin/' + path, body === undefined
      ? { headers: { 'x-clave': key } }
      : { method: 'POST', headers: { 'x-clave': key, 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (res.status === 401) { showLogin(true); throw new Error('clave'); }
    if (!res.ok) throw new Error(res.status);
    return res.headers.get('content-type')?.includes('json') ? res.json() : res.text();
  };

  // Gestor de tareas (js/admin-tareas.js): usa la misma conexión y los mismos avisos del panel
  // Sorteos (js/admin-sorteos.js) además lee los datos ya cargados y navega con go()
  window.JNBPanel = { api: (path, body) => api(path, body), toast: (msg) => toast(msg), data: () => data, go: (mod, id) => go(mod, id), reload: () => load() };

  const showLogin = (wrong) => { $('app').hidden = true; $('login').hidden = false; $('login-error').hidden = !wrong; $('key').focus(); };

  const load = async () => {
    data = await api('datos');
    try { data.faq = await api('faq'); } catch (e) { data.faq = null; }
    try { data.newsletter = await api('newsletter'); } catch (e) { data.newsletter = null; }
    $('login').hidden = true; $('app').hidden = false;
    render();
    applyRoute();
    if (window.JNBTasks) window.JNBTasks.refresh();
    if (window.JNBGiveaways) window.JNBGiveaways.refresh();
    if (window.JNBAgenda) window.JNBAgenda.refresh();
  };

  // ---- Precio de la propuesta: moneda ($ o USD) y monto con puntos de miles (200.000)
  const priceFields = (price, q) => {
    // Doble barra: esta página se arma dentro de un texto del Worker
    const m = String(price || '').match(/^(USD|US\\$|ARS|\\$)\\s*(.*)$/i);
    const fromCountry = !q.country ? (q.lang === 'es' ? '$' : 'USD') : (/argentina/i.test(q.country) ? '$' : 'USD');
    const currency = m ? (/usd|us\\$/i.test(m[1]) ? 'USD' : '$') : fromCountry;
    const amount = m ? m[2] : String(price || '');
    return '<label>Precio' + (q.country ? ' <span class="small muted">(' + esc(q.country) + ')</span>' : '') + '<div class="price-row">'
      + '<select name="currency"><option value="$"' + (currency === '$' ? ' selected' : '') + '>$ Pesos</option><option value="USD"' + (currency === 'USD' ? ' selected' : '') + '>USD Dólares</option></select>'
      + '<input name="amount" class="amount-input" inputmode="numeric" placeholder="200.000" value="' + esc(amount) + '"></div></label>';
  };
  const formatAmount = (value) => {
    const digits = String(value).replace(/[^0-9]/g, '');
    return digits ? Number(digits).toLocaleString('es-AR') : '';
  };
  document.addEventListener('input', (e) => {
    // Si cambia el monto a mano, la referencia en dólares que cargó el cotizador ya no vale
    if (e.target.name === 'amount' && e.target.form && e.target.form.priceUsd) e.target.form.priceUsd.value = '';
    if (!e.target.classList || !e.target.classList.contains('amount-input')) return;
    const formatted = formatAmount(e.target.value);
    if (formatted !== e.target.value) e.target.value = formatted;
  });

  // ---- Consultas y presupuestos
  // Tarjeta de un pedido (en Consultas y en la ficha del cliente, pestaña Presupuesto)
  const inquiryCard = (q, inClient) => {
      const isQuote = q.kind === 'presupuesto';
      const p = q.proposal || {};
      return '<article class="card quote-card' + (isMin(q) ? ' is-min' : '') + '" data-token="' + esc(q.token) + '" data-code="' + esc(q.code) + '">'
        + '<div class="row space"><div class="row"><span class="code">' + esc(q.code) + '</span>'
        + '<span class="chip">' + (isQuote ? 'Presupuesto' : 'Consulta') + '</span>'
        + (isQuote ? '<span class="chip ' + (SENT.includes(q.status) ? 'ok' : 'warn') + '">' + STATUS[q.status] + '</span>' : '')
        + (!q.seen ? '<span class="chip new">Nueva</span>' : '')
        + '</div><span class="small muted">' + date(q.created) + ' · ' + LANG[q.lang] + ' <button type="button" class="min-btn" data-min="' + esc(q.code) + '" aria-expanded="' + !isMin(q) + '" title="Minimizar o expandir">' + (isMin(q) ? '▸' : '▾') + '</button></span></div>'
        + '<p class="q-who" style="margin-top:.5rem"><strong>' + esc(q.name) + '</strong> · <a href="mailto:' + esc(q.email) + '?subject=' + encodeURIComponent(q.code) + '">' + esc(q.email) + '</a>'
        + (q.plan ? ' · ' + esc(q.plan) : '') + (q.country ? ' · 📍 ' + esc(q.country) : '') + '</p>'
        + (clientById(q.clientId) && inClient !== 'client' ? '<p class="small" style="margin:0 0 .3rem"><button type="button" class="link-btn" data-go-client="' + esc(clientById(q.clientId).code) + '">👤 Ficha del cliente ' + esc(clientById(q.clientId).code) + '</button></p>' : '')
        + '<div class="message">' + esc(q.message) + '</div>'
        + '<div class="row small">' + (!q.seen ? '<button type="button" data-seen="' + esc(q.code) + '">✓ Marcar como vista</button>' : '') + '<span class="muted">' + (q.mailed ? 'Mail de confirmación enviado ✓' : 'Sin mail de confirmación') + '</span>'
        + '<a class="btn" href="#" data-mail="' + esc(q.code) + '">Ver el mail</a>'
        + '<button type="button" data-resend="' + esc(q.code) + '">📧 ' + (q.mailed ? 'Reenviar' : 'Enviar') + ' el mail al cliente</button>'
        + '</div>'
        + (q.coupon ? '<div class="alert" style="margin-top:.6rem">🎁 Usa el cupón <strong>' + esc(q.coupon) + '</strong>: aplicá 20 % de descuento en la propuesta. Queda usado cuando lo pases a "Aceptado".</div>' : '')
        + (isQuote ? linkBox(clientLink('mi-presupuesto', q.lang, q.token), q.lang, q.name.split(' ')[0])
          + (q.status === 'aceptado' && inClient !== true ? '<p class="small" style="margin-top:.5rem">✓ Ya es un proyecto en marcha. <button type="button" data-open-quote="' + esc(q.token) + '">Abrir el proyecto</button></p>' : '') : '')
        + (isQuote ? '<details' + (!SENT.includes(q.status) ? ' open' : '') + '><summary>Cargar la propuesta</summary><form class="quote-form">'
          + '<input type="hidden" name="options" value="' + esc(JSON.stringify(p.options || [])) + '"><input type="hidden" name="chosen" value="' + (Number.isInteger(p.chosen) ? p.chosen : '') + '"><input type="hidden" name="priceUsd" value="' + esc(p.priceUsd || '') + '">'
          + (p.options ? '<p class="alert">🔀 El cliente ve ' + p.options.length + ' opciones para elegir' + (Number.isInteger(p.chosen) ? ': <strong>eligió ' + esc(p.options[p.chosen].name) + '</strong> (el precio y lo que incluye ya son los de esa opción).' : '. Todavía no eligió.') + '</p>' : '')
          + '<div class="grid"><label>Estado<select name="status">' + Object.entries(STATUS).map(([v, l]) => '<option value="' + v + '"' + (q.status === v ? ' selected' : '') + '>' + l + '</option>').join('') + '</select></label>'
          + priceFields(p.price, q)
          + '<label>Válido hasta<input type="date" name="validUntil" value="' + esc(p.validUntil) + '"></label></div>'
          + '<label>Qué incluye (uno por renglón; para sumar una descripción, separala con un guion largo: Galería de tortas — Fotos ampliables)<textarea name="includes" rows="6">' + esc(p.includes) + '</textarea></label>'
          + '<label style="margin-top:.75rem">Condiciones de contratación (una por renglón; vienen sugeridas según el plan, podés editarlas)<textarea name="conditions" rows="5">' + esc(q.proposal ? p.conditions : defaultConditions(q.plan, q.lang)) + '</textarea></label>'
          + '<label style="margin-top:.75rem">Nota para el cliente (opcional)<textarea name="note">' + esc(p.note) + '</textarea></label>'
          + '<label style="margin-top:.75rem">Link para pagar en cuotas en tu tienda (dejalo vacío si este presupuesto no se puede pagar ahí)'
          + '<input name="storeLink" placeholder="https://jnbcreativestudio.mitiendanube.com/productos/..." value="' + esc(q.proposal ? p.storeLink : (q.lang === 'en' ? '' : 'https://jnbcreativestudio.mitiendanube.com/')) + '"></label>'
          + '<p class="small muted" style="margin-top:.5rem">El cliente ve la propuesta cuando el estado es "Enviado". Cuando te confirme por WhatsApp, pasalo a "Aceptado": se crea solo el seguimiento del proyecto y el cliente lo ve en este mismo link.</p>'
          + '<label class="check-line"><input type="checkbox" name="notify" checked> 📧 Avisarle por mail al cliente cuando el estado sea "Enviado"</label>'
          + '<button class="primary">Guardar</button></form></details>' : '')
        + '</article>';
  };

  // ---- Búsqueda, filtros y paginación (lo elegido se mantiene al volver a cada módulo)
  const PAGE_SIZE = 20;
  const F = {
    clientes: { q: '', status: '' },
    proyectos: { q: '', stage: '', type: '', from: '', to: '' },
    consultas: { q: '', seen: '' },
    presupuestos: { q: '', status: '' },
    pagos: { q: '', state: 'pendientes' },
  };
  const PAGE = { clientes: 1, proyectos: 1, consultas: 1, presupuestos: 1, pagos: 1 };
  const fold = (v) => String(v || '').toLowerCase().normalize('NFD').replace(/[^a-z0-9@. ]/g, '').replace(/ +/g, ' ').trim();
  const matches = (q, parts) => !q || fold(parts.join(' ')).includes(fold(q));
  const paged = (key, list) => {
    const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    if (PAGE[key] > pages) PAGE[key] = pages;
    const page = PAGE[key];
    const nav = list.length > PAGE_SIZE
      ? '<nav class="pager" aria-label="Páginas"><button type="button" data-page="' + key + '" data-to="' + (page - 1) + '"' + (page <= 1 ? ' disabled' : '') + '>← Anterior</button>'
        + '<span class="small muted">Página ' + page + ' de ' + pages + ' · ' + list.length + ' en total</span>'
        + '<button type="button" data-page="' + key + '" data-to="' + (page + 1) + '"' + (page >= pages ? ' disabled' : '') + '>Siguiente →</button></nav>'
      : '';
    return { items: list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), nav };
  };
  const searchBox = (key, placeholder) => '<label>Buscar<input type="search" id="f-' + key + '-q" data-f="' + key + '.q" placeholder="' + esc(placeholder) + '" value="' + esc(F[key].q) + '"></label>';
  const selectBox = (key, name, label, options) => '<label>' + label + '<select id="f-' + key + '-' + name + '" data-f="' + key + '.' + name + '">'
    + options.map(([v, l]) => '<option value="' + esc(v) + '"' + (String(F[key][name]) === v ? ' selected' : '') + '>' + esc(l) + '</option>').join('') + '</select></label>';
  const dateBox = (key, name, label) => '<label>' + label + '<input type="date" id="f-' + key + '-' + name + '" data-f="' + key + '.' + name + '" value="' + esc(F[key][name]) + '"></label>';

  // ---- Relaciones: cliente de cada cosa
  const clientById = (id) => (data.clients || []).find((c) => c.id === id) || null;
  const clientByCode = (code) => (data.clients || []).find((c) => c.code === code) || null;
  const projectsOf = (id) => data.projects.filter((p) => p.clientId === id);
  const inquiriesOf = (id) => data.inquiries.filter((q) => q.clientId === id);
  const paymentsOf = (tokens) => (data.payments || []).filter((y) => tokens.includes(y.project));
  const clientName = (p) => { const c = clientById(p.clientId); return c ? c.name : p.client; };

  // ---- Consultas (formulario de contacto) y Presupuestos (pedidos de presupuesto): cada uno en su módulo
  const mailNote = () => (data.mailReady ? '' : '<p class="small muted">El mail de confirmación todavía no se envía: faltan cargar RESEND_API_KEY y MAIL_FROM en Cloudflare. Las consultas se guardan igual.</p>');
  const newCount = (kind) => data.inquiries.filter((q) => q.kind === kind && !q.seen).length;
  const renderInquiryModule = (kind) => {
    const key = kind === 'consulta' ? 'consultas' : 'presupuestos';
    const f = F[key];
    const focus = kind === 'presupuesto' && route.mod === 'presupuestos' && route.id;
    let list = data.inquiries.filter((q) => q.kind === kind);
    if (focus) list = list.filter((q) => q.code === route.id);
    else list = list.filter((q) => matches(f.q, [q.code, q.name, q.email, q.plan, (clientById(q.clientId) || {}).code])
      && (key === 'consultas' ? (!f.seen || (f.seen === 'nuevas' ? !q.seen : q.seen)) : (!f.status || (f.status === 'pendientes' ? !SENT.includes(q.status) : q.status === f.status))));
    const { items, nav } = paged(key, list);
    const unseen = newCount(kind);
    $('m-' + key).innerHTML = '<div class="row space"><h2 style="margin:0">' + (kind === 'consulta' ? 'Consultas' : 'Presupuestos') + '</h2>'
      + '<div class="row">' + (items.length ? '<button type="button" data-min-all="' + (items.every(isMin) ? '0' : '1') + '">' + (items.every(isMin) ? '↕ Expandir todas' : '↕ Minimizar todas') + '</button>' : '')
      + (unseen ? '<button type="button" data-seen-all="' + kind + '">✓ Marcar ' + (unseen === 1 ? 'la nueva' : 'las ' + unseen + ' nuevas') + ' como vistas</button>' : '') + '</div></div>'
      + '<p class="module-intro small" style="margin-top:.6rem">' + (kind === 'consulta' ? 'Mensajes del formulario de contacto.' : 'Pedidos de presupuesto. Al pasar uno a "Aceptado" se crea solo el proyecto, dentro de la ficha del mismo cliente.') + '</p>'
      + mailNote()
      + (focus ? '<p><button type="button" data-go="presupuestos">← Ver todos los presupuestos</button></p>'
        : '<div class="filters">' + searchBox(key, 'Nombre, mail o código')
          + (key === 'consultas' ? selectBox(key, 'seen', 'Mostrar', [['', 'Todas'], ['nuevas', 'Solo nuevas'], ['vistas', 'Ya vistas']])
            : selectBox(key, 'status', 'Estado', [['', 'Todos'], ['pendientes', 'Por preparar (Recibido o Preparando)'], ...Object.entries(STATUS)])) + '</div>')
      + (items.length ? items.map((q) => inquiryCard(q, false)).join('') : '<p class="empty">' + (f.q || f.status || f.seen ? 'No hay resultados con esa búsqueda.' : (kind === 'consulta' ? 'Todavía no hay consultas.' : 'Todavía no hay pedidos de presupuesto.')) + '</p>')
      + nav;
  };
  const renderInquiries = () => {
    const cNew = newCount('consulta');
    const pending = data.inquiries.filter((q) => q.kind === 'presupuesto' && !SENT.includes(q.status)).length;
    $('n-consultas').textContent = cNew || '';
    $('n-presupuestos').textContent = pending || '';
    renderInquiryModule('consulta');
    renderInquiryModule('presupuesto');
  };

  // ---- Reseñas
  const renderReviews = () => {
    const approved = data.reviews.filter((r) => r.status === 'aprobada').length;
    const pending = data.reviews.filter((r) => r.status === 'pendiente').length;
    $('n-resenas').textContent = pending || '';
    const visible = approved >= data.minPublicReviews
      ? 'La sección de reseñas se ve en el inicio (' + approved + ' aprobadas).'
      : 'La sección de reseñas aparece en el inicio cuando haya ' + data.minPublicReviews + ' aprobadas (hoy: ' + approved + ').';
    $('tab-resenas').innerHTML = '<h2>Reseñas de clientes</h2><p class="muted">' + visible + '</p>'
      + '<form class="card" id="invite"><h3>Pedirle una reseña a un cliente</h3><div class="grid">'
      + '<label>Cliente (solo lo ves vos)<input name="client" required placeholder="Ej.: Ana, pastelería"></label>'
      + '<label>Idioma del link<select name="lang"><option value="es">Español</option><option value="en">Inglés</option><option value="pt">Portugués</option></select></label></div>'
      + '<button class="primary">Crear link</button><div id="invite-result"></div></form>'
      + (data.reviews.length ? data.reviews.map((r) => '<article class="card" data-review="' + r.id + '">'
        + '<div class="row space"><div class="row"><strong>' + esc(r.name) + '</strong><span class="muted">' + esc(r.business) + '</span></div>'
        + '<span class="chip ' + (r.status === 'aprobada' ? 'ok' : 'warn') + '">' + esc(r.status) + '</span></div>'
        + '<div class="message">' + esc(r.body) + '</div><div class="row">'
        + (r.status !== 'aprobada' ? '<button class="primary" data-set="aprobada">Aprobar y publicar</button>' : '<button data-set="oculta">Ocultar</button>')
        + '<button data-set="borrar">Borrar</button><span class="small muted">' + date(r.created) + ' · ' + LANG[r.lang] + '</span></div></article>').join('')
        : '<p class="empty">Todavía no hay reseñas.</p>')
      + (data.invitations.length ? '<h2 style="margin-top:1.5rem">Links enviados</h2><table><thead><tr><th>Cliente</th><th>Creado</th><th>Estado</th><th></th></tr></thead><tbody>'
        + data.invitations.map((i) => '<tr><td>' + esc(i.client) + '</td><td>' + date(i.created) + '</td><td>' + (i.used ? 'Respondió' : 'Esperando') + '</td>'
        + '<td class="n">' + (i.used ? '' : '<button data-copy="' + esc(clientLink('resena', 'es', i.token)) + '">Copiar link</button>') + '</td></tr>').join('') + '</tbody></table>' : '');
  };

  // ---- Proyectos: lista con búsqueda y filtros y, al tocar uno, su ficha con pestañas
  let selected = '';      // proyecto abierto
  let subTab = 'estado';  // pestaña de la ficha
  let presetClient = '';  // cliente elegido de antemano en "Crear un proyecto a mano" (desde la ficha del cliente)
  const SUBTABS = [['estado', '📍 Estado'], ['presupuesto', '💬 Presupuesto'], ['brief', '📝 Brief'], ['pagos', '💳 Pagos'], ['resena', '⭐ Reseña y cupón'], ['historial', '🕓 Historial']];
  const briefLabel = (p) => (p.briefStatus === 'enviado' ? '📝 Brief ✓' : p.briefStatus === 'borrador' ? '📝 Brief en curso' : '📝 Sin brief');
  // Tipo de servicio, según el plan del proyecto
  const SERVICE = [['tienda', 'Tienda online'], ['landing', 'Landing / Plan Básico'], ['premium', 'Web a medida / Premium'], ['actualizacion', 'Actualización'], ['otro', 'Otro']];
  const serviceOf = (text) => {
    const t = String(text || '');
    if (/actualiz|update|atualiza/i.test(t)) return 'actualizacion';
    if (/emprendedor|empreendedor|tienda|loja|store/i.test(t)) return 'tienda';
    if (/premium|a medida|custom|sob medida/i.test(t)) return 'premium';
    if (/b[aá]sico|basic|landing/i.test(t)) return 'landing';
    return 'otro';
  };
  const STAGE_GROUPS = { pendiente: [0, 1], desarrollo: [2, 3], publicado: [4] };

  const clientRow = (p) => '<button type="button" class="client-row" data-open="' + esc(p.token) + '">'
    + '<span class="client-row-main"><strong>' + (p.code ? '<span class="client-code">' + esc(p.code) + '</span> · ' : '') + esc(clientName(p)) + '</strong><span class="small muted">' + esc(p.project) + (p.origin === 'sorteo-instagram' ? ' · 🎁 ORIGEN: SORTEO DE INSTAGRAM' : '') + (p.quoteCode ? ' · ' + esc(p.quoteCode) : '') + ' · ' + esc((clientById(p.clientId) || {}).code || '') + '</span></span>'
    + '<span class="client-row-tags">' + (p.briefEditUnseen ? '<span class="chip alert-chip">⚠ Editó el brief</span>' : '')
    + (p.stage === STAGES.length - 1 ? '<span class="chip ok">✓ Finalizado</span>' : '<span class="chip">' + (p.stage + 1) + '. ' + STAGES[p.stage] + '</span>')
    + '<span class="chip ' + (p.briefStatus === 'enviado' ? 'ok' : 'warn') + '">' + briefLabel(p) + '</span>'
    + (p.coupon ? '<span class="chip">🎁</span>' : '') + (p.reviewDone ? '<span class="chip ok">⭐</span>' : '') + '</span>'
    + '<span class="client-row-go" aria-hidden="true">›</span></button>';

  const renderProjects = () => {
    const editedBriefs = data.projects.filter((p) => p.briefEditUnseen);
    $('n-proyectos').textContent = editedBriefs.length ? '⚠ ' + editedBriefs.length : (data.projects.filter((p) => p.stage < STAGES.length - 1).length || '');
    const p = data.projects.find((x) => x.token === selected);
    if (!p) { selected = ''; renderClientList(editedBriefs); } else { renderClient(p); }
  };

  const renderClientList = (editedBriefs) => {
    const f = F.proyectos;
    const list = data.projects.filter((p) => {
      const c = clientById(p.clientId) || {};
      if (!matches(f.q, [p.code, p.client, c.name, c.code, c.email, p.project, p.quoteCode])) return false;
      if (f.stage && (STAGE_GROUPS[f.stage] ? !STAGE_GROUPS[f.stage].includes(p.stage) : String(p.stage) !== f.stage)) return false;
      if (f.type && serviceOf(p.project) !== f.type) return false;
      if (f.from && p.created.slice(0, 10) < f.from) return false;
      if (f.to && p.created.slice(0, 10) > f.to) return false;
      return true;
    });
    // Sin filtro de estado, los finalizados (Publicación y entrega) van agrupados aparte, al final
    const done = f.stage ? [] : list.filter((p) => p.stage === STAGES.length - 1);
    const { items, nav } = paged('proyectos', f.stage ? list : list.filter((p) => p.stage < STAGES.length - 1));
    const filtered = f.q || f.stage || f.type || f.from || f.to;
    const presetOk = presetClient && clientByCode(presetClient);
    $('tab-proyectos').innerHTML = '<div class="row space"><h2 style="margin:0">Proyectos</h2><span class="small muted">' + data.projects.length + ' en total</span></div>'
      + (editedBriefs.length ? '<div class="alert" style="margin-top:.75rem">⚠ ' + (editedBriefs.length === 1 ? esc(clientName(editedBriefs[0])) + ' editó su brief después de enviarlo.' : editedBriefs.length + ' clientes editaron su brief después de enviarlo: ' + editedBriefs.map((x) => esc(clientName(x))).join(', ') + '.') + ' Abrí su proyecto, pestaña Brief, para ver qué cambió.</div>' : '')
      + '<div class="filters">' + searchBox('proyectos', 'Código de proyecto, cliente o plan')
      + selectBox('proyectos', 'stage', 'Estado', [['', 'Todos'], ['pendiente', 'Pendientes (Reserva y Materiales)'], ['desarrollo', 'En desarrollo (Diseño y Revisión)'], ['publicado', 'Publicados'], ...STAGES.map((s, i) => [String(i), (i + 1) + '. ' + s])])
      + selectBox('proyectos', 'type', 'Tipo de servicio', [['', 'Todos'], ...SERVICE])
      + dateBox('proyectos', 'from', 'Creado desde') + dateBox('proyectos', 'to', 'Hasta') + '</div>'
      + (items.length ? '<div class="client-list">' + items.map(clientRow).join('') + '</div>' : done.length ? '<p class="empty">No hay proyectos en curso: todos están finalizados.</p>' : '<p class="empty">' + (filtered ? 'No hay proyectos con esa búsqueda.' : 'Todavía no hay proyectos. Se crean solos al aceptar un presupuesto.') + '</p>')
      + nav
      + (done.length ? '<details class="card" style="margin-top:1rem"><summary>✓ Proyectos finalizados (' + done.length + ')</summary><div class="client-list" style="margin-top:.75rem">' + done.map(clientRow).join('') + '</div></details>' : '')
      + '<details class="card" id="new-project-box" style="margin-top:1rem"' + (presetOk ? ' open' : '') + '><summary>➕ Crear un proyecto a mano</summary>'
      + '<p class="small muted">Para clientes que no pidieron presupuesto por la web (por ejemplo, por WhatsApp). Si el cliente ya existe, elegilo: el proyecto queda en su misma ficha.</p>'
      + '<form id="new-project"><div class="grid">'
      + '<label>Cliente<select name="clientId" id="np-client"><option value="">➕ Cliente nuevo</option>'
        + (data.clients || []).slice().sort((a, b) => a.name.localeCompare(b.name, 'es')).map((c) => '<option value="' + c.id + '"' + (presetOk && presetOk.id === c.id ? ' selected' : '') + '>' + esc(c.code + ' · ' + c.name + (c.email ? ' · ' + c.email : '')) + '</option>').join('') + '</select></label>'
      + '<label class="np-new"' + (presetOk ? ' hidden' : '') + '>Nombre y apellido<input name="fullName" placeholder="Ej.: Ana López"></label>'
      + '<label class="np-new"' + (presetOk ? ' hidden' : '') + '>Mail (si ya existe, se usa esa ficha)<input type="email" name="email" placeholder="ana@ejemplo.com"></label>'
      + '<label class="np-new"' + (presetOk ? ' hidden' : '') + '>Teléfono<input name="phone" placeholder="+54 9 11 ..."></label>'
      + '<label>Nombre que ve el cliente (opcional)<input name="client" placeholder="Si lo dejás vacío, su primer nombre"></label>'
      + '<label>Proyecto<input name="project" required placeholder="Ej.: Landing · Plan Básico"></label>'
      + '<label>Idioma<select name="lang"><option value="es">Español</option><option value="en">Inglés</option><option value="pt">Portugués</option></select></label>'
      + '<label>Entrega estimada<input type="date" name="due"></label></div><button class="primary">Crear</button></form></details>';
  };

  // Historial: lo guardado por el sitio más el pedido y la propuesta (que son anteriores al proyecto)
  const historyOf = (p) => {
    const items = (data.events || []).filter((e) => e.project === p.token).map((e) => ({ at: e.at, icon: e.icon, text: e.text }));
    const q = p.quote ? data.inquiries.find((x) => x.token === p.quote) : null;
    if (q) {
      items.push({ at: q.created, icon: '📩', text: 'Pidió presupuesto (' + q.code + ')' + (q.coupon ? ' con el cupón ' + q.coupon : '') });
      if (q.mailed) items.push({ at: q.created, icon: '✉️', text: 'Le llegó el mail de confirmación con su link' });
      if (q.proposal && q.proposal.issued) items.push({ at: q.proposal.issued, icon: '💬', text: 'Le enviaste la propuesta (' + q.proposal.price + ')' });
    }
    if (p.briefStatus === 'borrador' && p.briefUpdated) items.push({ at: p.briefUpdated, icon: '✏️', text: 'Está completando el brief (último guardado)' });
    return items.sort((a, b) => (a.at < b.at ? 1 : -1));
  };

  const renderClient = (p) => {
    const q = p.quote ? data.inquiries.find((x) => x.token === p.quote) : null;
    const owner = clientById(p.clientId);
    const head = '<div class="row"><button type="button" class="btn" data-back>← Todos los proyectos</button>'
      + (owner ? '<button type="button" data-go-client="' + esc(owner.code) + '">👤 Ficha del cliente: ' + esc(owner.code) + ' · ' + esc(owner.name) + '</button>' : '') + '</div>'
      + '<div class="bv-top" style="margin-top:.75rem"><div><p class="small client-code" style="margin:0">' + esc(p.code || '') + '</p><p class="bv-client">' + esc(owner ? owner.name : p.client) + '</p><p class="small muted" style="margin:0">' + esc(p.project) + (p.origin === 'sorteo-instagram' ? ' · 🎁 ORIGEN: SORTEO DE INSTAGRAM' : '') + (p.quoteCode ? ' · ' + esc(p.quoteCode) : '') + ' · ' + LANG[p.lang] + ' · creado ' + date(p.created) + '</p></div>'
      + '<div class="row"><span class="chip">' + (p.stage + 1) + '. ' + STAGES[p.stage] + '</span>' + (p.briefEditUnseen ? '<span class="chip alert-chip">⚠ Editó el brief</span>' : '') + '</div></div>'
      + '<nav class="subtabs">' + SUBTABS.map(([id, label]) => '<button type="button" data-sub="' + id + '" aria-pressed="' + (subTab === id) + '">' + label + (id === 'brief' && p.briefEditUnseen ? ' ⚠' : '') + '</button>').join('') + '</nav>';
    let body = '';
    if (subTab === 'estado') {
      body = linkBox(projectLink(p), p.lang, p.client)
        + '<form class="project-form card" style="margin-top:.75rem">'
        + '<label class="check-line" style="margin-bottom:.5rem"><input type="checkbox" id="stage-notify" checked> 📧 Avisarle por mail al cliente cada vez que cambio la etapa</label>'
        + '<p class="small muted" style="margin:0 0 .4rem">Etapa actual (tocá la que corresponda; se guarda sola)</p>'
        + '<div class="stepper" role="group" aria-label="Etapa del proyecto">' + STAGES.map((st, i) => '<button type="button" class="step' + (i < p.stage ? ' is-done' : '') + '" data-stage="' + i + '" aria-pressed="' + (p.stage === i) + '"><span class="step-num">' + (i < p.stage ? '✓' : i + 1) + '</span><span class="step-name">' + st + '</span></button>').join('') + '</div>'
        + '<input type="hidden" name="stage" value="' + p.stage + '">'
        + '<div class="grid"><label>Entrega estimada<input type="date" name="due" value="' + esc(p.due) + '"></label></div>'
        + '<label>Tu próximo paso (opcional: si lo dejás vacío, se muestra el texto de la etapa)<input name="next" maxlength="400" placeholder="Ej.: Todavía necesito tu logo y los textos de la sección Servicios." value="' + esc(p.next) + '"></label>'
        + '<label style="margin-top:.75rem">Link de vista previa (opcional)<input name="preview" placeholder="https://..." value="' + esc(p.preview) + '"></label>'
        + '<label style="margin-top:.75rem">Nota para el cliente (opcional)<textarea name="note" placeholder="Ej.: Ya tengo tus fotos. Esta semana te mando la primera versión.">' + esc(p.note) + '</textarea></label>'
        + '<div class="row" style="margin-top:.75rem"><button class="primary">Guardar</button><button type="button" data-remove>Borrar proyecto</button>'
        + '<span class="small muted">Actualizado ' + date(p.updated) + '</span></div></form>';
    } else if (subTab === 'presupuesto') {
      body = q ? inquiryCard(q, true) : '<p class="empty">Este proyecto se creó a mano: no tiene un pedido de presupuesto en el sitio.</p>';
    } else if (subTab === 'brief') {
      const lockChip = p.briefStatus === 'enviado' && (p.stage === 2 || p.stage === 4) ? '<span class="chip">🔒 Cerrado para cambios</span>' : (p.briefStatus === 'enviado' ? '<span class="chip">🔓 El cliente puede editarlo</span>' : '');
      body = '<div class="row" style="margin-bottom:.75rem">' + lockChip
        + '<button type="button" data-copy="' + esc(projectLink(p) + '#brief') + '">Copiar link del brief</button>'
        + (p.quote ? '<button type="button" data-brief-mail="' + esc(p.quote) + '">Mandar link del brief por mail</button>' : '')
        + (p.briefStatus ? '<button type="button" id="brief-print">🖨 Imprimir</button>' : '') + '</div>'
        + '<div id="brief-inline"><p class="muted">Cargando el brief...</p></div>';
    } else if (subTab === 'resena') {
      const today = new Date().toISOString().slice(0, 10);
      const c = (data.coupons || []).find((x) => x.code === p.coupon);
      const cState = c ? (c.usedBy ? '✓ Usado en ' + c.usedBy : (c.expires < today ? 'Vencido' : 'Vigente')) : '';
      body = (p.coupon
        ? '<section class="bv-card" style="--bv:#7543d6"><h3 class="bv-head"><span class="bv-icon">🎁</span>Cupón de descuento</h3>'
          + '<p class="coupon-code">' + esc(p.coupon) + '</p><table><tbody>'
          + '<tr><td>Descuento</td><td class="n">' + (c ? c.percent : 20) + ' % en la próxima actualización</td></tr>'
          + '<tr><td>Entregado</td><td class="n">' + (c ? date(c.created) : '') + '</td></tr>'
          + '<tr><td>Vence</td><td class="n">' + (c ? day(c.expires) : '') + '</td></tr>'
          + '<tr><td>Estado</td><td class="n"><span class="chip ' + (cState === 'Vigente' ? 'warn' : 'ok') + '">' + esc(cState) + '</span></td></tr></tbody></table></section>'
        : '<p class="empty">El cupón se crea solo cuando pasás el proyecto a "Publicación y entrega".</p>')
        + (p.reviewToken
          ? '<section class="bv-card" style="--bv:#e0a12b"><h3 class="bv-head"><span class="bv-icon">⭐</span>Reseña</h3>'
            + (p.reviewDone ? '<p>✓ Dejó su reseña. La aprobás en la pestaña <strong>Reseñas</strong>.</p>' : '<p>Se la pedimos al publicar. Todavía no respondió.</p><div class="row"><button type="button" data-copy="' + esc(clientLink('resena', p.lang, p.reviewToken)) + '">Copiar link de la reseña</button></div>')
            + '</section>'
          : '');
    } else if (subTab === 'pagos') {
      const list = paymentsOf([p.token]);
      body = paymentTotals(list) + paymentTable(list, false)
        + '<details class="card" style="margin-top:1rem"' + (list.length ? '' : ' open') + '><summary>➕ Registrar un pago de este proyecto</summary>' + paymentForm(p.token) + '</details>';
    } else if (subTab === 'historial') {
      const items = historyOf(p);
      body = items.length ? '<ol class="timeline">' + items.map((it) => '<li><span class="tl-icon">' + it.icon + '</span><div><p class="tl-text">' + esc(it.text) + '</p><p class="small muted">' + date(it.at) + '</p></div></li>').join('') + '</ol>'
        : '<p class="empty">Todavía no hay movimientos.</p>';
    }
    $('tab-proyectos').innerHTML = '<article data-project="' + esc(p.token) + '">' + head + '<div class="client-body">' + body + '</div></article>';
    if (subTab === 'brief') loadBriefInline(p);
  };

  // Abrir un proyecto (por su token): queda en la dirección #proyectos/JNB-PRY-0001
  const openClient = (token, tab) => {
    const p = data.projects.find((x) => x.token === token);
    if (!p) return;
    subTab = tab || 'estado';
    go('proyectos', p.code || '');
  };

  // ---- Pagos (de cada proyecto; se cargan a mano)
  const CONCEPTS = ['Anticipo', 'Saldo', 'Cuota', 'Pago total', 'Actualización', 'Otro'];
  const METHODS = ['Tiendanube', 'Transferencia', 'Mercado Pago', 'PayPal', 'Efectivo'];
  const money = (currency, amount) => (currency === 'USD' ? 'USD ' : '$ ') + Number(amount || 0).toLocaleString('es-AR');
  const todayIso = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
  const sumBy = (list) => {
    const out = {};
    list.forEach((y) => { out[y.currency] = (out[y.currency] || 0) + y.amount; });
    return Object.entries(out).map(([cur, n]) => money(cur, n)).join(' + ') || money('$', 0);
  };
  const paymentTotals = (list) => list.length
    ? '<div class="row" style="margin-bottom:.75rem"><span class="chip ok">Cobrado: ' + esc(sumBy(list.filter((y) => y.paid))) + '</span><span class="chip warn">Pendiente: ' + esc(sumBy(list.filter((y) => !y.paid))) + '</span></div>' : '';
  const paymentTable = (list, withProject) => (list.length
    ? '<div class="table-wrap"><table><thead><tr>' + (withProject ? '<th>Proyecto</th>' : '') + '<th>Concepto</th><th class="n">Monto</th><th>Vence</th><th>Estado</th><th></th></tr></thead><tbody>'
      + list.map((y) => {
        const late = !y.paid && y.due && y.due < todayIso();
        const c = clientById(y.clientId);
        return '<tr data-payment="' + y.id + '">'
          + (withProject ? '<td><button type="button" class="link-btn" data-open-code="' + esc(y.projectCode) + '">' + esc(y.projectCode) + '</button><br><span class="small muted">' + esc(c ? c.name : '') + '</span></td>' : '')
          + '<td>' + esc(y.concept) + (y.method ? '<br><span class="small muted">' + esc(y.method) + '</span>' : '') + (y.note ? '<br><span class="small muted">' + esc(y.note) + '</span>' : '') + '</td>'
          + '<td class="n"><strong>' + esc(money(y.currency, y.amount)) + '</strong></td><td>' + (day(y.due) || '—') + '</td>'
          + '<td>' + (y.paid ? '<span class="chip ok">✓ Pagado ' + day(y.paid) + '</span>' : '<span class="chip ' + (late ? 'alert-chip' : 'warn') + '">' + (late ? 'Vencido' : 'Pendiente') + '</span>') + '</td>'
          + '<td class="n"><div class="row" style="justify-content:flex-end">' + (y.paid ? '<button type="button" data-pay-toggle>Desmarcar</button>' : '<button type="button" class="primary" data-pay-toggle>Marcar pagado</button>') + '<button type="button" data-pay-remove>Borrar</button></div></td></tr>';
      }).join('') + '</tbody></table></div>'
    : '<p class="empty">Todavía no hay pagos cargados.</p>');
  const paymentForm = (projectToken) => '<form class="payment-form">'
    + (projectToken ? '<input type="hidden" name="project" value="' + esc(projectToken) + '">'
      : '<label>Proyecto<select name="project" required><option value="">Elegí el proyecto</option>' + data.projects.map((p) => '<option value="' + esc(p.token) + '">' + esc((p.code || '') + ' · ' + clientName(p) + ' · ' + p.project) + '</option>').join('') + '</select></label>')
    + '<div class="grid"><label>Concepto<input name="concept" list="pay-concepts" required placeholder="Anticipo"></label>'
    + '<label>Monto<div class="price-row"><select name="currency"><option value="$">$ Pesos</option><option value="USD">USD Dólares</option></select><input name="amount" class="amount-input" inputmode="numeric" required placeholder="100.000"></div></label>'
    + '<label>Vence (opcional)<input type="date" name="due"></label>'
    + '<label>Pagado el (vacío = pendiente)<input type="date" name="paid"></label>'
    + '<label>Medio de pago<input name="method" list="pay-methods" placeholder="Tiendanube"></label></div>'
    + '<label>Nota (opcional)<input name="note" maxlength="500"></label>'
    + '<datalist id="pay-concepts">' + CONCEPTS.map((c) => '<option value="' + c + '">').join('') + '</datalist>'
    + '<datalist id="pay-methods">' + METHODS.map((c) => '<option value="' + c + '">').join('') + '</datalist>'
    + '<button class="primary" style="margin-top:.75rem">Guardar pago</button></form>';
  const renderPayments = () => {
    const all = data.payments || [];
    const unpaid = all.filter((y) => !y.paid);
    const late = unpaid.filter((y) => y.due && y.due < todayIso()).length;
    $('n-pagos').textContent = late ? '⚠ ' + late : (unpaid.length || '');
    const f = F.pagos;
    const list = all.filter((y) => {
      const c = clientById(y.clientId) || {};
      if (f.state === 'pendientes' && y.paid) return false;
      if (f.state === 'pagados' && !y.paid) return false;
      return matches(f.q, [y.projectCode, y.concept, y.method, c.name, c.code]);
    });
    const { items, nav } = paged('pagos', list);
    $('m-pagos').innerHTML = '<h2>Pagos</h2><p class="module-intro small">Anticipos, saldos y cuotas de cada proyecto. Se cargan a mano (los cobros de la tienda no llegan solos). Un pago sin fecha de pago queda pendiente.</p>'
      + paymentTotals(all)
      + '<div class="filters">' + searchBox('pagos', 'Proyecto, cliente o concepto') + selectBox('pagos', 'state', 'Mostrar', [['pendientes', 'Pendientes'], ['pagados', 'Pagados'], ['', 'Todos']]) + '</div>'
      + paymentTable(items, true) + nav
      + '<details class="card" style="margin-top:1rem"><summary>➕ Registrar un pago</summary>' + (data.projects.length ? paymentForm('') : '<p class="empty">Primero tiene que haber un proyecto.</p>') + '</details>';
  };

  // ---- Clientes: una ficha por persona, con todos sus proyectos, presupuestos, pagos, archivos e historial
  let openClientCode = '';
  let jumpToClient = false; // al abrir una ficha por su dirección, mostrar la página de la lista donde está
  let clientSub = 'datos';
  const CLIENT_SUBTABS = [['datos', '👤 Datos'], ['proyectos', '📁 Proyectos'], ['presupuestos', '💬 Presupuestos'], ['pagos', '💳 Pagos'], ['archivos', '📎 Archivos'], ['historial', '🕓 Historial']];
  const CLIENT_STATUS = { contacto: 'Contacto', presupuesto: 'En presupuesto', activo: 'Proyecto activo', publicado: 'Publicado', inactivo: 'Inactivo' };
  const autoStatus = (c) => {
    const ps = projectsOf(c.id);
    if (ps.some((p) => p.stage < STAGES.length - 1)) return 'activo';
    if (ps.length) return 'publicado';
    if (inquiriesOf(c.id).some((q) => q.kind === 'presupuesto')) return 'presupuesto';
    return 'contacto';
  };
  const statusOf = (c) => c.status || autoStatus(c);
  const lastActivity = (c) => {
    const tokens = projectsOf(c.id).map((p) => p.token);
    const dates = [c.created, ...inquiriesOf(c.id).map((q) => q.created), ...(data.events || []).filter((e) => tokens.includes(e.project)).map((e) => e.at)];
    return dates.sort().pop();
  };
  // Posibles duplicados: mismo nombre o mismo teléfono en fichas distintas (nunca se unen solas)
  const duplicates = () => {
    const pairs = [];
    const seen = new Set(data.notDuplicates || []);
    const list = data.clients || [];
    for (let i = 0; i < list.length; i += 1) {
      for (let k = i + 1; k < list.length; k += 1) {
        const a = list[i]; const b = list[k];
        const sameName = fold(a.name) && fold(a.name) === fold(b.name);
        const phoneA = String(a.phone || '').replace(/[^0-9]/g, '');
        const samePhone = phoneA.length >= 6 && phoneA === String(b.phone || '').replace(/[^0-9]/g, '');
        if (!sameName && !samePhone) continue;
        const [older, newer] = a.id < b.id ? [a, b] : [b, a];
        if (seen.has(older.id + '-' + newer.id)) continue;
        pairs.push({ older, newer, why: sameName ? 'mismo nombre' : 'mismo teléfono' });
      }
    }
    return pairs;
  };
  const clientHistory = (c) => {
    const projects = projectsOf(c.id);
    const codeOf = new Map(projects.map((p) => [p.token, p.code]));
    const items = (data.events || []).filter((e) => codeOf.has(e.project)).map((e) => ({ at: e.at, icon: e.icon, text: e.text, ref: codeOf.get(e.project) }));
    inquiriesOf(c.id).forEach((q) => {
      items.push({ at: q.created, icon: q.kind === 'presupuesto' ? '📩' : '✉️', text: (q.kind === 'presupuesto' ? 'Pidió presupuesto' : 'Escribió una consulta') + (q.plan ? ': ' + q.plan : ''), ref: q.code });
      if (q.proposal && q.proposal.issued) items.push({ at: q.proposal.issued, icon: '💬', text: 'Le enviaste la propuesta (' + q.proposal.price + ')', ref: q.code });
    });
    items.push({ at: c.created, icon: '🆕', text: 'Se creó la ficha ' + c.code, ref: '' });
    return items.sort((a, b) => (a.at < b.at ? 1 : -1));
  };
  const clientBody = (c) => {
    const projects = projectsOf(c.id);
    const quotes = inquiriesOf(c.id);
    const pays = paymentsOf(projects.map((p) => p.token));
    let body = '';
    if (clientSub === 'datos') {
      const others = (data.clients || []).filter((x) => x.id !== c.id);
      body = '<form class="client-form" data-client-id="' + c.id + '"><div class="grid">'
        + '<label>Nombre y apellido<input name="name" required maxlength="100" value="' + esc(c.name) + '"></label>'
        + '<label>Mail<input type="email" name="email" maxlength="160" value="' + esc(c.email || '') + '"></label>'
        + '<label>Teléfono<input name="phone" maxlength="40" placeholder="+54 9 11 ..." value="' + esc(c.phone) + '"></label>'
        + '<label>Estado<select name="status"><option value="">Automático (' + CLIENT_STATUS[autoStatus(c)] + ')</option>' + Object.entries(CLIENT_STATUS).map(([v, l]) => '<option value="' + v + '"' + (c.status === v ? ' selected' : '') + '>' + l + '</option>').join('') + '</select></label></div>'
        + '<label>Nota interna (solo la ves vos)<textarea name="note" maxlength="2000">' + esc(c.note) + '</textarea></label>'
        + '<div class="row" style="margin-top:.75rem"><button class="primary">Guardar</button><span class="small muted">Cliente desde ' + date(c.created) + ' · ' + projects.length + ' ' + (projects.length === 1 ? 'proyecto' : 'proyectos') + ' · ' + quotes.length + ' ' + (quotes.length === 1 ? 'pedido' : 'pedidos') + '</span>'
        + (c.email ? '<a class="btn" href="mailto:' + esc(c.email) + '">✉️ Escribirle</a>' : '')
        + (c.phone ? '<a class="btn" target="_blank" href="' + esc('https://wa.me/' + c.phone.replace(/[^0-9]/g, '')) + '">WhatsApp ↗</a>' : '') + '</div></form>'
        + (others.length ? '<details class="card" style="margin-top:1rem"><summary>🔗 Unir con otra ficha (si es la misma persona)</summary>'
          + '<form class="merge-form" data-client-id="' + c.id + '"><p class="small muted">Todo lo de esta ficha (pedidos, proyectos, pagos, archivos) pasa a la ficha que elijas y esta deja de existir. Su código no se vuelve a usar.</p>'
          + '<label>Pasar todo a<select name="into" required><option value="">Elegí la ficha</option>' + others.map((x) => '<option value="' + x.id + '">' + esc(x.code + ' · ' + x.name + (x.email ? ' · ' + x.email : '')) + '</option>').join('') + '</select></label>'
          + '<button style="margin-top:.75rem">Unir fichas</button></form></details>' : '');
    } else if (clientSub === 'proyectos') {
      body = (projects.length ? '<div class="client-list">' + projects.map(clientRow).join('') + '</div>' : '<p class="empty">Todavía no tiene proyectos.</p>')
        + '<p style="margin-top:.75rem"><button type="button" data-new-project-for="' + esc(c.code) + '">➕ Nuevo proyecto para este cliente</button></p>';
    } else if (clientSub === 'presupuestos') {
      const list = quotes.filter((q) => q.kind === 'presupuesto');
      body = list.length ? '<div class="table-wrap"><table><thead><tr><th>Pedido</th><th>Plan</th><th>Estado</th><th class="n">Precio</th><th></th></tr></thead><tbody>'
        + list.map((q) => '<tr><td><span class="code">' + esc(q.code) + '</span><br><span class="small muted">' + date(q.created) + '</span></td><td>' + esc(q.plan || '—') + '</td>'
          + '<td><span class="chip ' + (SENT.includes(q.status) ? 'ok' : 'warn') + '">' + STATUS[q.status] + '</span></td><td class="n">' + esc((q.proposal && q.proposal.price) || '—') + '</td>'
          + '<td class="n"><button type="button" data-go="presupuestos/' + esc(q.code) + '">Abrir</button></td></tr>').join('') + '</tbody></table></div>'
        : '<p class="empty">No pidió presupuestos por la web.</p>';
    } else if (clientSub === 'pagos') {
      body = paymentTotals(pays) + paymentTable(pays, true);
    } else if (clientSub === 'archivos') {
      body = '<div id="client-files" data-client-id="' + c.id + '"><p class="muted">Cargando archivos...</p></div>';
    } else if (clientSub === 'historial') {
      const items = clientHistory(c);
      body = '<ol class="timeline">' + items.map((it) => '<li><span class="tl-icon">' + it.icon + '</span><div><p class="tl-text">' + esc(it.text) + '</p><p class="small muted">' + date(it.at) + (it.ref ? ' · ' + esc(it.ref) : '') + '</p></div></li>').join('') + '</ol>';
    }
    return '<nav class="subtabs">' + CLIENT_SUBTABS.map(([id, label]) => '<button type="button" data-client-sub="' + id + '" aria-pressed="' + (clientSub === id) + '">' + label + '</button>').join('') + '</nav>' + body;
  };
  const clientCard = (c) => {
    const open = c.code === openClientCode;
    const st = statusOf(c);
    const n = projectsOf(c.id).length;
    return '<details class="client-card" data-client-code="' + esc(c.code) + '"' + (open ? ' open' : '') + '>'
      + '<summary class="client-row"><span class="client-row-main"><strong><span class="client-code">' + esc(c.code) + '</span> | ' + esc(c.name) + '</strong>'
      + '<span class="small muted">' + esc(c.email || 'Sin mail') + (c.phone ? ' · ' + esc(c.phone) : '') + '</span></span>'
      + '<span class="client-row-tags"><span class="chip' + (st === 'activo' ? ' warn' : st === 'publicado' ? ' ok' : '') + '">' + CLIENT_STATUS[st] + '</span>'
      + '<span class="chip">📁 ' + n + '</span><span class="chip">📩 ' + inquiriesOf(c.id).length + '</span></span>'
      + '<span class="client-row-go" aria-hidden="true">›</span></summary>'
      + (open ? '<div class="client-card-body">' + clientBody(c) + '</div>' : '') + '</details>';
  };
  const renderClients = () => {
    const dups = duplicates();
    $('n-clientes').textContent = dups.length ? '⚠ ' + dups.length : '';
    const f = F.clientes;
    const list = (data.clients || []).filter((c) => matches(f.q, [c.code, c.name, c.email, c.phone]) && (!f.status || statusOf(c) === f.status));
    // Si se abre una ficha por su dirección, se muestra la página donde está
    const at = jumpToClient ? list.findIndex((c) => c.code === openClientCode) : -1;
    if (at >= 0) PAGE.clientes = Math.floor(at / PAGE_SIZE) + 1;
    jumpToClient = false;
    const { items, nav } = paged('clientes', list);
    $('m-clientes').innerHTML = '<div class="row space"><h2 style="margin:0">Clientes</h2><span class="small muted">' + (data.clients || []).length + ' en total</span></div>'
      + '<p class="module-intro small" style="margin-top:.4rem">Una ficha por persona. Los pedidos con el mismo mail se suman solos a la misma ficha.</p>'
      + (dups.length ? '<details class="card"' + (dups.length <= 3 ? ' open' : '') + '><summary>🔎 Posibles duplicados (' + dups.length + ')</summary><p class="small muted">Fichas con ' + 'el mismo nombre o teléfono. No se unen solas: revisá si son la misma persona.</p>'
        + dups.map((d) => '<div class="bv-row row space"><span><strong>' + esc(d.older.code) + '</strong> ' + esc(d.older.name) + ' <span class="small muted">' + esc(d.older.email || 'sin mail') + '</span><br><strong>' + esc(d.newer.code) + '</strong> ' + esc(d.newer.name) + ' <span class="small muted">' + esc(d.newer.email || 'sin mail') + ' · ' + d.why + '</span></span>'
          + '<span class="row"><button type="button" data-merge="' + d.newer.id + '" data-into="' + d.older.id + '" data-label="' + esc(d.newer.code + ' en ' + d.older.code) + '">Unir en ' + esc(d.older.code) + '</button><button type="button" data-not-dup="' + d.older.id + '-' + d.newer.id + '">No son la misma persona</button></span></div>').join('') + '</details>' : '')
      + '<div class="filters">' + searchBox('clientes', 'Nombre, mail, teléfono o código') + selectBox('clientes', 'status', 'Estado', [['', 'Todos'], ...Object.entries(CLIENT_STATUS)]) + '</div>'
      + (items.length ? '<div class="client-list">' + items.map(clientCard).join('') + '</div>' : '<p class="empty">' + (f.q || f.status ? 'No hay clientes con esa búsqueda.' : 'Todavía no hay clientes. Se crean solos con cada consulta o pedido de presupuesto.') + '</p>')
      + nav
      + '<details class="card" style="margin-top:1rem"><summary>➕ Nuevo cliente</summary><form id="new-client"><div class="grid">'
      + '<label>Nombre y apellido<input name="name" required maxlength="100"></label><label>Mail<input type="email" name="email" maxlength="160"></label><label>Teléfono<input name="phone" maxlength="40"></label></div>'
      + '<label>Nota interna (opcional)<textarea name="note"></textarea></label><button class="primary" style="margin-top:.75rem">Crear ficha</button></form></details>';
    if (openClientCode && clientSub === 'archivos') loadClientFiles();
  };
  const loadClientFiles = async () => {
    const box = $('client-files');
    if (!box) return;
    const r = await api('clientes/' + box.dataset.clientId + '/archivos').catch(() => null);
    if (!$('client-files')) return;
    const size = (n) => (n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');
    $('client-files').innerHTML = !r ? '<p class="empty">No se pudieron cargar los archivos.</p>' : r.files.length
      ? '<ul class="brief-files-list">' + r.files.map((f) => '<li><span>' + esc(f.name) + ' <small class="muted">' + size(f.size) + ' · ' + esc(f.projectCode || '') + '</small></span><button type="button" data-file="' + f.id + '" data-name="' + esc(f.name) + '">⬇ Descargar</button></li>').join('') + '</ul>'
      : '<p class="empty">Todavía no subió archivos en sus briefs.</p>';
  };

  // ---- Dashboard: resumen general con datos reales
  const renderDashboard = () => {
    const P = data.projects;
    const inGroup = (g) => P.filter((p) => STAGE_GROUPS[g].includes(p.stage)).length;
    const quotesToDo = data.inquiries.filter((q) => q.kind === 'presupuesto' && !SENT.includes(q.status)).length;
    const quotesWaiting = data.inquiries.filter((q) => q.kind === 'presupuesto' && q.status === 'enviado').length;
    const unpaid = (data.payments || []).filter((y) => !y.paid);
    const unseen = data.inquiries.filter((q) => !q.seen).length;
    const stat = (href, n, label, extra, attrs) => '<a class="stat" href="#' + href + '"' + (attrs || '') + '><span class="stat-n">' + n + '</span><span class="stat-l">' + label + '</span>' + (extra ? '<span class="small muted">' + extra + '</span>' : '') + '</a>';
    const edited = P.filter((p) => p.briefEditUnseen);
    const dups = duplicates();
    // Actividad reciente: movimientos de los proyectos y pedidos nuevos
    const byToken = new Map(P.map((p) => [p.token, p]));
    const feed = [
      ...(data.events || []).filter((e) => byToken.has(e.project)).map((e) => { const p = byToken.get(e.project); return { at: e.at, icon: e.icon, text: e.text, who: clientName(p), go: 'proyectos/' + (p.code || '') }; }),
      ...data.inquiries.map((q) => ({ at: q.created, icon: q.kind === 'presupuesto' ? '📩' : '✉️', text: (q.kind === 'presupuesto' ? 'Pidió presupuesto' : 'Nueva consulta') + (q.plan ? ': ' + q.plan : ''), who: q.name, go: q.kind === 'presupuesto' ? 'presupuestos/' + q.code : 'consultas' })),
    ].sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 12);
    $('m-dashboard').innerHTML = '<h2>Resumen</h2>'
      + (edited.length ? '<div class="alert">⚠ ' + edited.length + ' ' + (edited.length === 1 ? 'cliente editó su brief' : 'clientes editaron su brief') + ' después de enviarlo: ' + edited.map((p) => '<button type="button" class="link-btn" data-open="' + esc(p.token) + '">' + esc(clientName(p)) + '</button>').join(', ') + '.</div>' : '')
      + (dups.length ? '<div class="alert">🔎 Hay ' + dups.length + ' ' + (dups.length === 1 ? 'posible cliente duplicado' : 'posibles clientes duplicados') + ' para revisar. <a href="#clientes">Ver en Clientes</a></div>' : '')
      + '<div class="stats">'
      + stat('clientes', (data.clients || []).length, 'Clientes')
      + stat('proyectos', P.length, 'Proyectos', '', ' data-stage-filter=""')
      + stat('proyectos', inGroup('pendiente'), 'Proyectos pendientes', 'Reserva y materiales', ' data-stage-filter="pendiente"')
      + stat('proyectos', inGroup('desarrollo'), 'En desarrollo', 'Diseño y revisión', ' data-stage-filter="desarrollo"')
      + stat('proyectos', inGroup('publicado'), 'Publicados', '', ' data-stage-filter="publicado"')
      + stat('presupuestos', quotesToDo, 'Presupuestos pendientes', quotesWaiting ? quotesWaiting + ' esperando respuesta' : '', ' data-quote-filter="pendientes"')
      + stat('pagos', unpaid.length, 'Pagos pendientes', unpaid.length ? sumBy(unpaid) : '', ' data-pay-filter="pendientes"')
      + stat(newCount('consulta') || !newCount('presupuesto') ? 'consultas' : 'presupuestos', unseen, 'Consultas nuevas', unseen ? 'Sin ver todavía' : '', newCount('consulta') ? ' data-seen-filter="nuevas"' : '')
      + '</div>'
      + '<div class="card"><h2>Actividad reciente</h2>' + (feed.length ? '<ul class="feed">' + feed.map((it) => '<li><span class="tl-icon">' + it.icon + '</span><div><p style="margin:0"><strong>' + esc(it.who) + '</strong> · ' + esc(it.text) + '</p><p class="small muted" style="margin:0">' + date(it.at) + ' · <button type="button" class="link-btn" data-go="' + esc(it.go) + '">Ver</button></p></div></li>').join('') + '</ul>' : '<p class="empty">Todavía no hay movimientos.</p>') + '</div>';
  };

  // ---- Copia de seguridad (en Configuración)
  const renderBackup = () => {
    $('backup').innerHTML = '<div class="card"><h2>Copia de seguridad</h2>'
      + '<p class="small muted">Descarga un archivo .json con todo lo que guarda el panel: clientes, consultas, presupuestos, proyectos, briefs, pagos, reseñas, cupones e historial. Los archivos que suben los clientes no van en la copia (se descargan desde cada proyecto). Tiene datos privados de tus clientes: guardalo en un lugar seguro.</p>'
      + '<p class="small">📧 Además, todos los lunes desde las 9 te llega sola por mail (a tu casilla de respuestas). ' + (data.backupMailed ? 'Última: ' + date(data.backupMailed) + '.' : 'Todavía no salió ninguna.') + '</p>'
      + '<button type="button" class="primary" id="backup-btn">⬇ Descargar copia de seguridad</button></div>'
      + '<details class="card"><summary>⚠ Reiniciar datos en cero</summary>'
      + '<form id="reset-form"><p class="small muted" style="margin-top:.6rem">Borra clientes, consultas, presupuestos, proyectos, briefs y sus archivos, pagos, cupones, reseñas e historial. Los códigos vuelven a empezar en JNB-CLI-0001. No se tocan los me gusta del blog, el newsletter, el cartel del inicio ni el horario. <strong>No se puede deshacer: descargá antes la copia de seguridad.</strong></p>'
      + '<label class="check-line"><input type="checkbox" name="faq" checked> También poner en cero los votos y búsquedas de Preguntas frecuentes</label>'
      + '<label>Para confirmar, escribí REINICIAR<input name="confirm" autocomplete="off" placeholder="REINICIAR"></label>'
      + '<button style="margin-top:.75rem">Reiniciar datos</button></form></details>';
  };

  // ---- Navegación: cada módulo tiene su dirección (#clientes, #proyectos/JNB-PRY-0001...), así el botón Atrás funciona
  const MODULES = ['dashboard', 'tareas', 'clientes', 'proyectos', 'consultas', 'presupuestos', 'pagos', 'resenas', 'cupones', 'sorteos', 'brief', 'agenda', 'numeros', 'cotizador', 'cartel', 'horario', 'faq', 'newsletter', 'config'];
  const parseHash = () => {
    const [mod, id] = decodeURIComponent(location.hash.slice(1)).split('/');
    return { mod: MODULES.includes(mod) ? mod : 'dashboard', id: id || '' };
  };
  const go = (mod, id) => {
    const hash = '#' + mod + (id ? '/' + id : '');
    if (location.hash !== hash) location.hash = hash; else applyRoute();
  };
  const applyRoute = () => {
    if (!data) return;
    const before = route.mod;
    route = parseHash();
    MODULES.forEach((m) => { $('m-' + m).hidden = m !== route.mod; });
    document.querySelectorAll('#side a').forEach((a) => { if (a.dataset.mod === route.mod) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    $('side').classList.remove('is-open');
    $('menu-toggle').setAttribute('aria-expanded', 'false');
    if (route.mod === 'proyectos') {
      const p = route.id ? data.projects.find((x) => x.code === route.id) : null;
      if (!p) subTab = 'estado';
      selected = p ? p.token : '';
      renderProjects();
    } else if (route.mod === 'clientes') {
      if (route.id !== openClientCode) { clientSub = 'datos'; jumpToClient = true; }
      openClientCode = route.id;
      renderClients();
    } else if (route.mod === 'tareas') {
      if (window.JNBTasks) window.JNBTasks.show();
    } else if (route.mod === 'sorteos') {
      if (window.JNBGiveaways) window.JNBGiveaways.show(route.id);
    } else if (route.mod === 'brief') {
      if (window.JNBBriefPreview) window.JNBBriefPreview.show();
    } else if (route.mod === 'agenda' || route.mod === 'numeros') {
      if (window.JNBAgenda) window.JNBAgenda.show(route.mod);
    } else if (route.mod === 'cotizador') {
      if (window.JNBQuoter) window.JNBQuoter.show();
    } else if (route.mod === 'presupuestos') {
      renderInquiries();
    }
    if (before !== route.mod || route.mod !== 'clientes') window.scrollTo({ top: 0 });
    if (route.mod === 'clientes' && openClientCode) {
      const el = document.querySelector('[data-client-code="' + openClientCode + '"]');
      if (el) el.scrollIntoView({ block: 'start' });
    }
  };
  window.addEventListener('hashchange', applyRoute);

  // ---- Preguntas frecuentes
  const renderFaq = () => {
    const faq = data.faq;
    if (!faq) { $('tab-faq').innerHTML = '<p class="empty">No se pudieron cargar los datos.</p>'; return; }
    $('tab-faq').innerHTML = '<h2>¿Te sirvió esta respuesta?</h2><p class="muted">Arriba quedan las que más "No" tienen: son las que conviene reescribir.</p>'
      + '<table><thead><tr><th>Pregunta</th><th class="n">Sí</th><th class="n">No</th></tr></thead><tbody>'
      + (faq.votes.map((v) => '<tr><td><a href="/preguntas-frecuentes/#' + esc(v.question) + '" target="_blank">' + esc(v.question) + '</a></td><td class="n">' + v.yes + '</td><td class="n">' + v.no + '</td></tr>').join('') || '<tr><td colspan="3" class="muted">Todavía no hay votos.</td></tr>')
      + '</tbody></table><h2 style="margin-top:1.5rem">Búsquedas que no encontraron nada</h2><p class="muted">Ideas de preguntas para agregar.</p>'
      + '<table><thead><tr><th>Búsqueda</th><th>Idioma</th><th class="n">Veces</th><th>Última vez</th></tr></thead><tbody>'
      + (faq.searches.map((s) => '<tr><td>' + esc(s.term) + '</td><td>' + esc(s.lang) + '</td><td class="n">' + s.times + '</td><td>' + day(s.last) + '</td></tr>').join('') || '<tr><td colspan="4" class="muted">Todavía no hay búsquedas sin resultado.</td></tr>')
      + '</tbody></table>';
  };

  // ---- Brief de un cliente: respuestas por sección y archivos para descargar (en su ficha, pestaña Brief)
  let briefFiles = [];
  let briefClient = '';
  const loadBriefInline = async (p) => {
    const token = p.quote || p.token;
    const box = $('brief-inline');
    if (!p.briefStatus) { box.innerHTML = '<p class="empty">Todavía no empezó el brief. Mandale el link con los botones de arriba.</p>'; return; }
    const b = await api('brief/' + token);
    briefFiles = b.files || [];
    briefClient = b.client || p.client;
    const size = (n) => (n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');
    // Cambios de la última edición: comparando con lo que había antes
    const prev = new Map((b.prevSummary || []).map((r) => [r.s + '|' + r.q, r.a]));
    const hasPrev = Boolean(b.edited && prev.size);
    // Cada sección en su tarjeta, con ícono y color (sirve en los tres idiomas)
    const SECTION_LOOK = [
      [/antes|before|começar/i, '📋', '#7543d6'], [/vos y|you and|você e/i, '👤', '#5b8def'], [/marca|brand/i, '🎨', '#c06bd6'],
      [/tienda|store|loja/i, '🛍️', '#e0a12b'], [/web a medida|custom|sob medida/i, '🖥️', '#3fa58a'], [/landing/i, '📄', '#3fa58a'],
      [/contenido|content|conteúdo/i, '✍️', '#d0659b'], [/terminar|finish/i, '✅', '#2fa36b'],
    ];
    const look = (title) => (SECTION_LOOK.find(([re]) => re.test(title)) || [null, '•', '#7543d6']).slice(1);
    const YES = /^(sí|si|yes|sim)$/i;
    const NO = /^(no|não)$/i;
    const answer = (a, changed) => {
      if (YES.test(a)) return '<span class="ans-chip ans-yes">✓ ' + esc(a) + '</span>';
      if (NO.test(a)) return '<span class="ans-chip ans-no">' + esc(a) + '</span>';
      return '<p class="brief-view-a' + (changed ? ' is-changed' : '') + '">' + esc(a) + '</p>';
    };
    const groups = [];
    (b.summary || []).forEach((r) => {
      if (!groups.length || groups[groups.length - 1].s !== r.s) groups.push({ s: r.s, rows: [] });
      groups[groups.length - 1].rows.push(r);
    });
    const rows = groups.map((g) => {
      const [icon, color] = look(g.s);
      return '<section class="bv-card" style="--bv:' + color + '"><h3 class="bv-head"><span class="bv-icon">' + icon + '</span>' + esc(g.s) + '</h3>'
        + g.rows.map((r) => {
          const before = prev.get(r.s + '|' + r.q);
          const changed = hasPrev && before !== r.a;
          return '<div class="bv-row' + (changed ? ' is-changed' : '') + '"><p class="brief-view-q">' + esc(r.q) + (changed ? '<span class="tag-edit">' + (before === undefined ? 'Nuevo' : 'Editado') + '</span>' : '') + '</p>'
            + answer(r.a, changed)
            + (changed && before !== undefined ? '<p class="brief-view-prev">Antes: ' + esc(before) + '</p>' : '') + '</div>';
        }).join('') + '</section>';
    }).join('');
    const current = new Set((b.summary || []).map((r) => r.s + '|' + r.q));
    const removed = hasPrev ? (b.prevSummary || []).filter((r) => !current.has(r.s + '|' + r.q)) : [];
    const removedHtml = removed.length ? '<section class="bv-card" style="--bv:#d0453f"><h3 class="bv-head"><span class="bv-icon">🗑️</span>Respuestas que quitó</h3>' + removed.map((r) => '<div class="bv-row"><p class="brief-view-q">' + esc(r.q) + '</p><p class="brief-view-prev">' + esc(r.a) + '</p></div>').join('') + '</section>' : '';
    const editNote = b.edited ? '<div class="alert">' + (b.editUnseen ? '⚠ ' : '✏️ ') + 'El cliente editó el brief después de enviarlo (última edición: ' + date(b.edited) + '). Lo que cambió está marcado en amarillo.</div>' : '';
    // Doble barra: esta página se arma dentro de un texto del Worker
    const fileIcon = (name) => (/\\.(png|jpe?g|webp|gif|svg|heic|heif)$/i.test(name) ? '🖼️' : /\\.pdf$/i.test(name) ? '📕' : /\\.(xlsx?|ods|csv)$/i.test(name) ? '📊' : /\\.zip$/i.test(name) ? '🗜️' : '📝');
    const files = (b.files || []).length
      ? '<section class="bv-card" style="--bv:#5b8def"><h3 class="bv-head"><span class="bv-icon">📎</span>Archivos (' + b.files.length + ')</h3><p class="small muted" style="margin:0 0 .5rem">Se descargan a la carpeta Descargas de tu compu.</p><div class="row" style="margin-bottom:.5rem"><button type="button" class="primary" id="zip-all">⬇ Descargar todos (.zip)</button></div><ul class="brief-files-list">' + b.files.map((f) => '<li><span class="bv-file-icon">' + fileIcon(f.name) + '</span><span>' + esc(f.name) + ' <small class="muted">' + size(f.size) + '</small></span><button type="button" data-file="' + f.id + '" data-name="' + esc(f.name) + '">⬇ Descargar</button></li>').join('') + '</ul></section>'
      : '';
    const stateChip = b.status === 'enviado' ? '<span class="chip ok">✓ Enviado el ' + date(b.sent) + '</span>' : b.status === 'borrador' ? '<span class="chip warn">✏️ En curso · ' + date(b.updated) + '</span>' : '<span class="chip">Sin empezar</span>';
    const summaryCard = '<div class="bv-top"><div><p class="bv-client">' + esc(b.client || '') + '</p><p class="small muted" style="margin:0">' + esc(b.planText || '') + '</p></div><div class="row">' + stateChip + '<span class="chip">🌐 ' + LANG[b.lang] + '</span></div></div>';
    if (!$('brief-inline')) return;
    $('brief-inline').innerHTML = summaryCard + editNote + files + (rows || '<p class="empty">Todavía no hay respuestas.</p>') + removedHtml;
    // Abrirlo cuenta como "visto": se va la alerta (se actualiza la lista sin volver a dibujar el brief)
    if (b.editUnseen) { const fresh = await api('datos'); data.projects = fresh.projects; const pr = data.projects.find((x) => x.token === p.token); if (pr) { $('n-proyectos').textContent = ''; } }
  };
  const printBrief = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const title = 'Brief · ' + briefClient;
    w.document.write('<!doctype html><meta charset="utf-8"><title>' + esc(title) + '</title><style>body{font:15px/1.5 system-ui,sans-serif;max-width:44rem;margin:2rem auto;padding:0 1rem;color:#211632}.brief-view-section{color:#5d31b8;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;margin:1.4rem 0 .4rem}.brief-view-q{font-weight:800;margin:.8rem 0 .1rem}.brief-view-a{margin:0;white-space:pre-line}button{display:none}ul{padding-left:1rem}.bv-card{border:1px solid #d9c6e8;border-radius:12px;padding:4px 14px 10px;margin:0 0 12px}.bv-head{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#5d31b8}</style><h1>' + esc(title) + '</h1>' + $('brief-inline').innerHTML);
    w.document.close();
    w.print();
  };

  // Todos los archivos del brief en un .zip (la herramienta JSZip se carga recién al tocar el botón, con su huella de seguridad)
  const loadZip = () => (window.JSZip ? Promise.resolve() : new Promise((resolve, reject) => {
    const sc = document.createElement('script');
    sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    sc.integrity = 'sha512-XMVd28F1oH/O71fzwBnV7HucLxVwtxf26XV8P4wPk26EDxuGZ91N8bsOttmnomcCD3CS5ZMRL50H0GgOHvegtg==';
    sc.crossOrigin = 'anonymous';
    sc.referrerPolicy = 'no-referrer';
    sc.onload = resolve; sc.onerror = reject;
    document.head.append(sc);
  }));
  const zipAll = async (btn) => {
    btn.disabled = true;
    const label = btn.textContent;
    try {
      await loadZip();
      const zip = new window.JSZip();
      const used = new Set();
      for (let k = 0; k < briefFiles.length; k += 1) {
        const f = briefFiles[k];
        btn.textContent = 'Preparando ' + (k + 1) + ' de ' + briefFiles.length + '...';
        const res = await fetch('/api/admin/archivo/' + f.id, { headers: { 'x-clave': key } });
        if (!res.ok) throw new Error(res.status);
        let name = f.name;
        while (used.has(name)) name = (k + 1) + '-' + name;
        used.add(name);
        zip.file(name, await res.blob());
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'brief-' + briefClient.toLowerCase().replace(/[^a-z0-9áéíóúñü]+/gi, '-').replace(/^-|-$/g, '') + '.zip';
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      toast('Listo: el .zip quedó en tu carpeta Descargas');
    } catch (err) { toast('No se pudo armar el .zip. Descargalos de a uno.'); }
    btn.disabled = false;
    btn.textContent = label;
  };

  // ---- Cartel "Disponible para nuevos proyectos" del inicio
  const AVAIL = [
    ['abierto', '#2fa36b', 'Disponible para nuevos proyectos', 'Punto verde.'],
    ['agenda', '#e0a12b', 'Agenda completa este mes', 'Punto amarillo y "Reservá tu lugar para {mes}", que abre tu agenda de Google.'],
    ['cerrado', '#d0453f', 'Por ahora no tomo proyectos nuevos', 'Punto rojo y "Escribime y te aviso cuando haya lugar", que lleva al contacto.'],
  ];
  const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const nextMonth = () => MONTHS[(new Date().getMonth() + 1) % 12];
  const availPreview = (estado, month) => {
    const m = month ? MONTHS[Number(month) - 1] : nextMonth();
    if (estado === 'agenda') return 'Agenda completa este mes · Reservá tu lugar para ' + m;
    if (estado === 'cerrado') return 'Por ahora no tomo proyectos nuevos · Escribime y te aviso cuando haya lugar';
    return 'Disponible para nuevos proyectos';
  };
  const renderAvailability = () => {
    const a = data.availability || { estado: 'abierto', reservaDesde: '' };
    $('availability').innerHTML = '<form class="card" id="availability-form"><div class="row space"><h2 style="margin:0">Cartel del inicio</h2>'
      + (a.updated ? '<span class="small muted">Guardado ' + date(a.updated) + '</span>' : '') + '</div>'
      + '<p class="small muted" style="margin:.4rem 0 0">Lo que se ve arriba en el inicio, en los tres idiomas. Elegí una opción y tocá Guardar.</p>'
      + '<div class="avail-options">' + AVAIL.map(([v, color, title, hint]) => '<label class="avail-option"><input type="radio" name="estado" value="' + v + '"' + (a.estado === v ? ' checked' : '') + '>'
        + '<span class="avail-dot" style="background:' + color + '"></span><span>' + title + '<br><span class="small muted" style="font-weight:500">' + esc(hint.replace('{mes}', 'el mes que elijas')) + '</span></span></label>').join('') + '</div>'
      + '<label id="avail-month"' + (a.estado === 'agenda' ? '' : ' hidden') + '>Reservas desde<select name="reservaDesde"><option value="">El mes que viene (' + nextMonth() + ')</option>'
        + MONTHS.map((m, i) => '<option value="' + (i + 1) + '"' + (String(a.reservaDesde) === String(i + 1) ? ' selected' : '') + '>' + m.charAt(0).toUpperCase() + m.slice(1) + '</option>').join('') + '</select></label>'
      + '<p class="avail-preview"><span class="small muted">Así se ve en el inicio:</span><br><strong id="avail-preview">' + esc(availPreview(a.estado, a.reservaDesde)) + '</strong></p>'
      + '<div class="row"><button class="primary">Guardar</button><a class="btn" href="/" target="_blank">Ver el inicio ↗</a></div></form>';
  };
  // ---- Horario de atención: "Disponible ahora / Fuera de horario" del inicio.
  // El horario habitual (días hábiles de 9 a 17) lo calcula js/availability.js, el mismo que usa el inicio.
  const HOURS_DATE = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'America/Argentina/Buenos_Aires' });
  const AWAY_GROUPS = [['mismo', 'Vuelvo hoy', 'Elegís la hora de regreso.'], ['dia', 'Vuelvo el próximo día hábil', 'Elegís la hora; el día lo calcula solo (saltea fines de semana y feriados).'], ['sin', 'Sin hora de regreso', 'Sigue cerrado hasta que lo reabras o hasta la próxima apertura habitual.']];
  const pad = (n) => String(n).padStart(2, '0');
  const defaultHour = (group) => {
    if (group === 'dia') return '09:00';
    const t = new Date(Date.now() + 60 * 60 * 1000);
    const parts = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hourCycle: 'h23', timeZone: 'America/Argentina/Buenos_Aires' }).formatToParts(t);
    const h = Number(parts.find((x) => x.type === 'hour').value);
    const m = Number(parts.find((x) => x.type === 'minute').value);
    return m <= 30 ? pad(h) + ':30' : pad((h + 1) % 24) + ':00';
  };
  // Lo que se va a guardar con lo elegido en el formulario de ausencia
  const awayPlan = (values) => {
    const H = window.JNBHours;
    const group = values.grupo || 'sin';
    const mensaje = values.mensaje && values.mensaje.startsWith(group + '-') ? values.mensaje : group + '-1';
    if (group === 'sin') return { mensaje, hasta: H.manualUntil('cerrado'), regreso: false };
    if (!/^[0-9]{2}:[0-9]{2}$/.test(values.hora || '')) return { mensaje, error: 'Elegí la hora de regreso.' };
    const day = group === 'mismo' ? H.today() : H.nextBusinessDay();
    if (!day) return { mensaje, error: 'No se pudo calcular el próximo día hábil.' };
    const hasta = new Date(day + 'T' + values.hora + ':00-03:00');
    if (hasta <= new Date()) return { mensaje, error: 'Esa hora ya pasó: elegí una más tarde.' };
    return { mensaje, hasta, regreso: true };
  };
  const awayOptions = (group) => Object.keys(window.JNBHours.AWAY).filter((id) => id.startsWith(group + '-'))
    .map((id) => '<option value="' + id + '">' + esc(window.JNBHours.AWAY[id].es.replace('{hora}', '[hora]').replace('{cuando}', 'mañana')) + '</option>').join('');
  const awayPreview = (form) => {
    const values = Object.fromEntries(new FormData(form));
    const plan = awayPlan(values);
    $('away-hora').hidden = values.grupo === 'sin';
    $('away-preview').textContent = window.JNBHours.awayText(plan.mensaje, plan.regreso && plan.hasta ? plan.hasta : null, 'es');
    $('away-until').textContent = plan.error ? '⚠ ' + plan.error
      : plan.regreso ? 'Vuelve a abrir solo el ' + HOURS_DATE.format(plan.hasta) + '.'
        : 'Sigue cerrado hasta que lo reabras o, si no, hasta la próxima apertura habitual (' + HOURS_DATE.format(plan.hasta) + ').';
  };
  let hoursEditing = false;
  const renderHours = () => {
    const H = window.JNBHours;
    if (!H) { $('hours').innerHTML = ''; return; }
    hoursEditing = false;
    const h = data.hours || {};
    const manual = h.modo && new Date(h.hasta) > new Date() ? h.modo : '';
    const scheduledOpen = H.isOpenAt(new Date());
    const away = manual === 'cerrado' && scheduledOpen;
    const open = manual === 'abierto' || (scheduledOpen && !away);
    const until = manual ? HOURS_DATE.format(new Date(h.hasta)) : '';
    const awayNow = manual === 'cerrado' ? H.awayText(h.mensaje, h.regreso ? new Date(h.hasta) : null, 'es') : '';
    const group = 'mismo';
    const form = '<details class="away-box"><summary class="btn primary">Cerrar ahora (ausencia)</summary><form id="away-form">'
      + '<div class="avail-options">' + AWAY_GROUPS.map(([v, title, hint]) => '<label class="avail-option"><input type="radio" name="grupo" value="' + v + '"' + (v === group ? ' checked' : '') + '><span>' + title + '<br><span class="small muted" style="font-weight:500">' + hint + '</span></span></label>').join('') + '</div>'
      + '<div class="grid"><label>Mensaje<select name="mensaje">' + awayOptions(group) + '</select></label>'
      + '<label id="away-hora">Hora de regreso<input type="time" name="hora" step="900" value="' + defaultHour(group) + '"></label></div>'
      + '<p class="avail-preview"><span class="small muted">Así se ve en el inicio:</span><br><strong id="away-preview"></strong><br><span class="small muted" id="away-until"></span></p>'
      + '<p class="small muted" style="margin:0 0 .75rem">El mensaje de ausencia se ve solo de 9 a 17 en días hábiles. Fuera de ese horario se ve siempre el mensaje habitual de "Fuera de horario".</p>'
      + '<button class="primary">Activar ausencia</button></form></details>';
    $('hours').innerHTML = '<div class="card"><div class="row space"><h2 style="margin:0">Horario de atención</h2>'
      + '<span class="chip ' + (open ? 'ok' : 'warn') + '">' + (open ? 'Disponible ahora' : away ? 'Ausente' : 'Fuera de horario') + '</span></div>'
      + '<p class="small muted" style="margin:.4rem 0 .75rem">El cartel de la sección Disponibilidad del inicio, en los tres idiomas. Horario habitual: lunes a viernes de 9 a 17, sin feriados.</p>'
      + (manual === 'cerrado'
        ? '<div class="alert" style="margin-bottom:.75rem">🔴 Ausencia activa: <strong>“' + esc(awayNow) + '”</strong><br>'
          + (h.regreso ? 'Vuelve a abrir solo el ' : 'Sigue cerrado hasta que lo reabras o hasta la próxima apertura habitual: ') + esc(until) + '.'
          + (scheduledOpen ? '' : '<br>Ahora es fuera de horario, así que el inicio muestra el mensaje habitual de "Fuera de horario".') + '</div>'
        : manual === 'abierto'
          ? '<div class="alert" style="margin-bottom:.75rem">🟢 Abierto a mano hasta el ' + esc(until) + '. Ahí vuelve solo el horario habitual.</div>'
          : '<p style="margin:0 0 .75rem">Funciona con el horario habitual.</p>')
      + '<div class="row">'
      + (manual === 'cerrado' ? '<button type="button" class="primary" data-hours="">' + (scheduledOpen ? 'Reabrir ahora' : 'Cancelar la ausencia') + '</button>' : '')
      + (manual === 'abierto' ? '<button type="button" data-hours="">Volver al horario habitual</button>' : '')
      + (!manual && !scheduledOpen ? '<button type="button" class="primary" data-hours="abierto">Abrir ahora</button>' : '')
      + '</div>'
      + (manual !== 'cerrado' && (scheduledOpen || manual === 'abierto') ? form : '')
      + '</div>';
    if ($('away-form')) awayPreview($('away-form'));
  };
  document.addEventListener('input', (e) => {
    const form = e.target.closest('#away-form');
    if (!form) return;
    hoursEditing = true;
    if (e.target.name === 'grupo') {
      form.elements.mensaje.innerHTML = awayOptions(e.target.value);
      form.elements.hora.value = defaultHour(e.target.value);
    }
    awayPreview(form);
  });
  document.addEventListener('toggle', (e) => { if (e.target.classList && e.target.classList.contains('away-box')) hoursEditing = e.target.open; }, true);
  // Cada minuto se actualiza (por ejemplo, cuando termina una ausencia), salvo mientras completás el formulario
  setInterval(() => { if (data && !hoursEditing) renderHours(); }, 60 * 1000);

  document.addEventListener('change', (e) => {
    const form = e.target.closest('#availability-form');
    if (!form) return;
    const values = Object.fromEntries(new FormData(form));
    $('avail-month').hidden = values.estado !== 'agenda';
    $('avail-preview').textContent = availPreview(values.estado, values.reservaDesde);
  });

  // ---- Cupones: 20 % para la próxima actualización, se entregan al publicar un proyecto
  const couponState = (c) => {
    const today = new Date().toISOString().slice(0, 10);
    if (c.usedBy) return ['ok', '✓ Usado en ' + c.usedBy + (c.usedAt ? ' · ' + date(c.usedAt) : '')];
    if (c.expires && c.expires < today) return ['', 'Vencido'];
    return ['warn', 'Vigente'];
  };
  const renderCoupons = () => {
    const list = data.coupons || [];
    const active = list.filter((c) => couponState(c)[1] === 'Vigente').length;
    $('n-cupones').textContent = active || '';
    $('tab-cupones').innerHTML = '<h2>Cupones de descuento</h2>'
      + '<p class="muted">Se entregan solos al pasar un proyecto a "Publicación y entrega": 20 % en la próxima actualización, un solo uso, válido por 3 meses. El cliente lo usa en el pedido de presupuesto ("Actualizar una web o tienda").</p>'
      + (list.length ? '<table><thead><tr><th>Cupón</th><th>Cliente</th><th>Entregado</th><th>Vence</th><th>Estado</th></tr></thead><tbody>'
        + list.map((c) => { const [cls, label] = couponState(c); return '<tr><td><strong class="code">' + esc(c.code) + '</strong><br><span class="small muted">' + c.percent + ' %</span></td>'
          + '<td>' + esc(c.client) + (c.email ? '<br><span class="small muted">' + esc(c.email) + '</span>' : '') + '</td>'
          + '<td>' + date(c.created) + '</td><td>' + day(c.expires) + '</td><td><span class="chip ' + cls + '">' + esc(label) + '</span></td></tr>'; }).join('')
        + '</tbody></table>' : '<p class="empty">Todavía no hay cupones. Se crea uno cuando publicás un proyecto.</p>');
  };

  // ---- Mails: estado, último error y prueba de envío (con lo que significa cada respuesta de Resend)
  const explainMail = (r) => {
    const e = String(r.error || '').toLowerCase();
    if (!r.status && /faltan/.test(e)) return 'Faltan claves en Cloudflare: cargá RESEND_API_KEY y MAIL_FROM como Secret (Workers → jimenabernadazdev → Settings → Variables and Secrets).';
    if (r.status === 401 || /api key is invalid|invalid api key|missing api key/.test(e)) return 'La clave de Resend no sirve: creá una nueva en Resend (API keys → Create API key, permiso Sending access) y reemplazá RESEND_API_KEY en Cloudflare.';
    if (/only send testing emails|testing emails to your own/.test(e)) return 'MAIL_FROM está usando la dirección de prueba de Resend. Cambiala por: JNB Creative Studio <hola@jnbcreativestudio.com.ar>';
    if (/not verified|verify a domain|domain is not/.test(e)) return 'El dominio de MAIL_FROM no está verificado en Resend. Revisá que MAIL_FROM termine en @jnbcreativestudio.com.ar y que en Resend → Domains diga Verified.';
    if (r.status === 403 && /restricted|permission|not allowed/.test(e)) return 'La clave de Resend no tiene permiso para este dominio: creá una con permiso Sending access para jnbcreativestudio.com.ar (o Full access) y reemplazala.';
    if (r.status === 422 || /from/.test(e)) return 'MAIL_FROM está mal escrito. Tiene que quedar exactamente así, sin comillas: JNB Creative Studio <hola@jnbcreativestudio.com.ar>';
    if (r.status === 429) return 'Se mandaron muchos mails seguidos. Esperá un minuto y probá de nuevo.';
    return 'Resend no aceptó el envío. Copiame el mensaje de arriba y lo reviso.';
  };
  const renderMailCheck = () => {
    const err = data.mailError;
    $('n-config').textContent = data.mailReady && !err ? '' : '⚠';
    $('mail-check').innerHTML = '<details class="card" open><summary>📧 Mails y notificaciones: '
      + (data.mailReady ? '<span class="chip ok">claves cargadas</span>' : '<span class="chip warn">faltan claves</span>') + (err ? ' <span class="chip alert-chip">hubo un error</span>' : '') + '</summary>'
      + (err ? '<div class="alert" style="margin-top:.75rem">Último error (' + date(err.at) + ', a ' + esc(err.to || '') + '): <strong>' + esc(err.error) + '</strong><br>' + esc(explainMail(err)) + '</div>' : '')
      + '<form id="mail-test" class="row" style="margin-top:.75rem"><input type="email" name="to" required placeholder="Tu mail, por ejemplo jnb.creativestudio@gmail.com" style="flex:1;min-width:14rem"><button class="primary">Probar envío de mail</button></form>'
      + '<div id="mail-test-result"></div></details>';
  };

  // ---- Newsletter del blog: suscriptores y avisos de artículos nuevos
  const renderNewsletter = () => {
    const n = data.newsletter;
    if (!n) { $('tab-newsletter').innerHTML = '<p class="empty">No se pudieron cargar los datos.</p>'; return; }
    const active = n.subscribers.filter((s) => s.status === 'activo');
    const waiting = n.subscribers.length - active.length;
    $('n-newsletter').textContent = active.length || '';
    $('tab-newsletter').innerHTML = '<h2>Newsletter del blog</h2>'
      + '<p class="muted">Quien deja su mail en el blog recibe un mail para confirmar; recién ahí queda anotado. Cuando se publica un artículo, a la hora siguiente le llega a cada suscriptor un aviso con la foto, el resumen y el link. Cada aviso trae su link para darse de baja.</p>'
      + '<p><strong>' + active.length + '</strong> ' + (active.length === 1 ? 'suscriptor confirmado' : 'suscriptores confirmados') + (waiting ? ' · <span class="muted">' + waiting + ' sin confirmar (se borran solos a los 7 días)</span>' : '') + '</p>'
      + '<form id="newsletter-test" class="row" style="margin:.75rem 0 1.25rem"><input type="email" name="to" required placeholder="Tu mail, para ver cómo llega el aviso del último artículo" style="flex:1;min-width:14rem"><button class="primary">Mandarme una prueba</button></form>'
      + (n.subscribers.length ? '<table><thead><tr><th>Mail</th><th>Estado</th><th>Desde</th><th></th></tr></thead><tbody>'
        + n.subscribers.map((s) => '<tr><td>' + esc(s.email) + '</td><td><span class="chip ' + (s.status === 'activo' ? 'ok' : 'warn') + '">' + (s.status === 'activo' ? 'Confirmado' : 'Sin confirmar') + '</span></td>'
          + '<td>' + date(s.confirmed || s.created) + '</td><td class="n"><button type="button" data-unsub="' + esc(s.email) + '">Quitar</button></td></tr>').join('')
        + '</tbody></table>' : '<p class="empty">Todavía no hay suscriptores.</p>')
      + '<h2 style="margin-top:1.5rem">Avisos enviados</h2>'
      + (n.sent.filter((x) => !x.silent).length ? '<table><thead><tr><th>Artículo</th><th>Enviado</th><th class="n">Llegaron a Resend</th></tr></thead><tbody>'
        + n.sent.filter((x) => !x.silent).map((x) => '<tr><td><a href="/blog/' + esc(x.slug) + '/" target="_blank">' + esc(x.title) + '</a>' + (x.error ? '<br><span class="small" style="color:#d0453f">' + esc(x.error) + '</span>' : '') + '</td><td>' + date(x.at) + '</td><td class="n">' + x.ok + ' de ' + x.total + '</td></tr>').join('')
        + '</tbody></table>' : '<p class="empty">Todavía no salió ningún aviso. Los artículos que ya estaban publicados no se avisan; sale uno con cada artículo nuevo.</p>');
  };

  const render = () => { renderAvailability(); renderHours(); renderMailCheck(); renderBackup(); renderInquiries(); renderReviews(); renderProjects(); renderClients(); renderPayments(); renderCoupons(); renderFaq(); renderNewsletter(); renderDashboard(); };
  const RENDER = { clientes: renderClients, proyectos: renderProjects, consultas: renderInquiries, presupuestos: renderInquiries, pagos: renderPayments };

  // ---- Acciones
  $('login').addEventListener('submit', async (e) => {
    e.preventDefault();
    key = $('key').value.trim();
    try { sessionStorage.setItem('jnb-admin', key); } catch (err) {}
    load().catch(() => {});
  });
  $('logout').addEventListener('click', () => { key = ''; try { sessionStorage.removeItem('jnb-admin'); } catch (e) {} showLogin(false); });

  // Búsquedas y filtros: se aplican mientras escribís, vuelven a la página 1 y el cursor queda donde estaba
  const applyFilter = (el) => {
    const [mod, name] = el.dataset.f.split('.');
    F[mod][name] = el.value;
    PAGE[mod] = 1;
    const id = el.id;
    const pos = el.type === 'search' ? el.selectionStart : null;
    RENDER[mod]();
    const again = $(id);
    if (again) { again.focus(); if (pos !== null) again.setSelectionRange(pos, pos); }
  };
  document.addEventListener('input', (e) => { if (e.target.dataset && e.target.dataset.f && e.target.type === 'search') applyFilter(e.target); });
  document.addEventListener('change', (e) => {
    if (e.target.dataset && e.target.dataset.f && e.target.type !== 'search') applyFilter(e.target);
    if (e.target.id === 'np-client') document.querySelectorAll('.np-new').forEach((l) => { l.hidden = Boolean(e.target.value); });
  });

  $('menu-toggle').addEventListener('click', () => {
    const open = $('side').classList.toggle('is-open');
    $('menu-toggle').setAttribute('aria-expanded', String(open));
  });
  const closeSide = () => { $('side').classList.remove('is-open'); $('menu-toggle').setAttribute('aria-expanded', 'false'); };
  $('side-close').addEventListener('click', closeSide);
  $('side-backdrop').addEventListener('click', closeSide);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSide(); });
  // Menú contraído (solo íconos): se recuerda en este navegador; en tablet arranca contraído si nunca se eligió
  const setCollapsed = (on, remember) => {
    document.documentElement.classList.toggle('side-collapsed', on);
    $('side-collapse').setAttribute('aria-expanded', String(!on));
    $('side-collapse').querySelector('.side-label').textContent = on ? 'Expandir menú' : 'Contraer menú';
    if (remember) { try { localStorage.setItem('jnb-admin-menu', on ? 'contraido' : 'expandido'); } catch (err) {} }
  };
  let savedMenu = null;
  try { savedMenu = localStorage.getItem('jnb-admin-menu'); } catch (err) {}
  setCollapsed(savedMenu ? savedMenu === 'contraido' : (innerWidth >= 768 && innerWidth < 1100), false);
  $('side-collapse').addEventListener('click', () => { setCollapsed(!document.documentElement.classList.contains('side-collapsed'), true); $('side-tip').hidden = true; });
  // Con el menú contraído, el nombre de cada sección aparece al pasar el cursor (o al llegar con el teclado)
  const showTip = (e) => {
    const item = e.target.closest('#side a, #side-collapse');
    if (!item || !document.documentElement.classList.contains('side-collapsed') || innerWidth < 768) { $('side-tip').hidden = true; return; }
    const r = item.getBoundingClientRect();
    const badge = item.querySelector('.badge');
    $('side-tip').textContent = item.querySelector('.side-label').textContent + (badge && badge.textContent ? ' · ' + badge.textContent : '');
    $('side-tip').style.top = (r.top + r.height / 2) + 'px';
    $('side-tip').style.left = (r.right + 10) + 'px';
    $('side-tip').hidden = false;
  };
  $('side').addEventListener('mouseover', showTip);
  $('side').addEventListener('focusin', showTip);
  $('side').addEventListener('mouseleave', () => { $('side-tip').hidden = true; });
  $('side').addEventListener('focusout', () => { $('side-tip').hidden = true; });
  document.querySelector('.side-scroll').addEventListener('scroll', () => { $('side-tip').hidden = true; });

  // Abrir o cerrar la ficha de un cliente (una a la vez); la dirección cambia a #clientes/JNB-CLI-0001
  document.addEventListener('toggle', (e) => {
    const card = e.target.closest && e.target.closest('.client-card');
    if (!card || card !== e.target) return;
    const code = card.dataset.clientCode;
    if (card.open && code !== openClientCode) go('clientes', code);
    else if (!card.open && code === openClientCode) go('clientes', '');
  }, true);

  document.addEventListener('click', async (e) => {
    // Accesos del Dashboard que llegan con un filtro ya elegido
    const statLink = e.target.closest('.stat');
    if (statLink) {
      if (statLink.dataset.stageFilter !== undefined) { F.proyectos = { q: '', stage: statLink.dataset.stageFilter, type: '', from: '', to: '' }; PAGE.proyectos = 1; selected = ''; }
      if (statLink.dataset.quoteFilter) { F.presupuestos = { q: '', status: statLink.dataset.quoteFilter }; PAGE.presupuestos = 1; }
      if (statLink.dataset.payFilter) { F.pagos = { q: '', state: statLink.dataset.payFilter }; PAGE.pagos = 1; }
      if (statLink.dataset.seenFilter) { F.consultas = { q: '', seen: statLink.dataset.seenFilter }; PAGE.consultas = 1; }
      const target = statLink.getAttribute('href').slice(1);
      if (location.hash === '#' + target) { e.preventDefault(); applyRoute(); }
      return;
    }
    const goBtn = e.target.closest('[data-go]');
    if (goBtn) { const [mod, id] = goBtn.dataset.go.split('/'); go(mod, id || ''); return; }
    const goClient = e.target.closest('[data-go-client]');
    if (goClient) { clientSub = 'datos'; go('clientes', goClient.dataset.goClient); return; }
    const openCode = e.target.closest('[data-open-code]');
    if (openCode) { subTab = 'pagos'; go('proyectos', openCode.dataset.openCode); return; }
    const clientSubBtn = e.target.closest('[data-client-sub]');
    if (clientSubBtn) { clientSub = clientSubBtn.dataset.clientSub; renderClients(); return; }
    const pageBtn = e.target.closest('[data-page]');
    if (pageBtn) { PAGE[pageBtn.dataset.page] = Number(pageBtn.dataset.to); RENDER[pageBtn.dataset.page](); window.scrollTo({ top: 0 }); return; }
    const newFor = e.target.closest('[data-new-project-for]');
    if (newFor) { presetClient = newFor.dataset.newProjectFor; go('proyectos', ''); const box = $('new-project-box'); if (box) box.scrollIntoView({ block: 'start' }); return; }
    const seenBtn = e.target.closest('[data-seen]');
    if (seenBtn) { await api('consultas/vistas', { codes: [seenBtn.dataset.seen] }); toast('Marcada como vista'); load(); return; }
    const seenAll = e.target.closest('[data-seen-all]');
    if (seenAll) {
      const codes = data.inquiries.filter((q) => q.kind === seenAll.dataset.seenAll && !q.seen).map((q) => q.code);
      await api('consultas/vistas', { codes }); toast('Listo'); load(); return;
    }
    const mergeBtn = e.target.closest('[data-merge]');
    if (mergeBtn) {
      if (!confirm('¿Unir ' + mergeBtn.dataset.label + '? Todos sus pedidos, proyectos y pagos pasan a una sola ficha. No se puede deshacer.')) return;
      await api('clientes/' + mergeBtn.dataset.merge + '/unir', { into: Number(mergeBtn.dataset.into) });
      toast('Fichas unidas'); load(); return;
    }
    const notDup = e.target.closest('[data-not-dup]');
    if (notDup) {
      const [a, b] = notDup.dataset.notDup.split('-').map(Number);
      await api('duplicados/descartar', { a, b }); toast('Listo: no se vuelven a sugerir'); load(); return;
    }
    const payRow = e.target.closest('[data-payment]');
    if (payRow && e.target.closest('[data-pay-toggle]')) {
      const y = data.payments.find((x) => x.id === Number(payRow.dataset.payment));
      await api('pagos/' + y.id, { ...y, paid: y.paid ? '' : todayIso() });
      toast(y.paid ? 'Vuelve a quedar pendiente' : 'Pago marcado como cobrado'); load(); return;
    }
    if (payRow && e.target.closest('[data-pay-remove]')) {
      if (!confirm('¿Borrar este pago? No se puede deshacer.')) return;
      await api('pagos/' + payRow.dataset.payment, { remove: true }); toast('Pago borrado'); load(); return;
    }
    if (e.target.closest('#backup-btn')) {
      const btn = $('backup-btn');
      btn.disabled = true;
      try {
        const res = await fetch('/api/admin/copia', { headers: { 'x-clave': key } });
        if (!res.ok) throw new Error(res.status);
        const a = document.createElement('a');
        a.href = URL.createObjectURL(await res.blob());
        a.download = 'jnb-panel-copia-' + todayIso() + '.json';
        document.body.append(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        toast('Listo: la copia quedó en tu carpeta Descargas');
      } catch (err) { toast('No se pudo descargar la copia'); }
      btn.disabled = false;
      return;
    }
    const copyBtn = e.target.closest('[data-copy]');
    if (copyBtn) { e.preventDefault(); copy(copyBtn.dataset.copy); return; }
    const resend = e.target.closest('[data-resend]');
    if (resend) {
      if (!confirm('¿Mandarle al cliente el mail de confirmación con sus respuestas?')) return;
      resend.disabled = true;
      const r = await api('reenviar/' + resend.dataset.resend, {}).catch(() => ({ ok: false }));
      toast(r.ok ? 'Mail enviado al cliente' : 'No se pudo enviar el mail');
      if (r.ok) load(); else resend.disabled = false;
      return;
    }
    const mail = e.target.closest('[data-mail]');
    if (mail) {
      e.preventDefault();
      const html = await api('mail/' + mail.dataset.mail);
      const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); }
      return;
    }
    const openBtn = e.target.closest('[data-open]');
    if (openBtn) { openClient(openBtn.dataset.open); return; }
    const openQuote = e.target.closest('[data-open-quote]');
    if (openQuote) { const pr = data.projects.find((x) => x.quote === openQuote.dataset.openQuote); if (pr) openClient(pr.token, 'presupuesto'); return; }
    if (e.target.closest('[data-back]')) { go('proyectos', ''); return; }
    const sub = e.target.closest('[data-sub]');
    if (sub) { subTab = sub.dataset.sub; renderProjects(); return; }
    if (e.target.closest('#brief-print')) { printBrief(); return; }
    const zipBtn = e.target.closest('#zip-all');
    if (zipBtn) { zipAll(zipBtn); return; }
    const briefMail = e.target.closest('[data-brief-mail]');
    if (briefMail) {
      if (!confirm('¿Mandarle al cliente el link del brief por mail?')) return;
      const r = await api('brief-mail/' + briefMail.dataset.briefMail, {});
      toast(r.ok ? 'Mail enviado' : 'No se pudo enviar el mail');
      return;
    }
    const fileBtn = e.target.closest('[data-file]');
    if (fileBtn) {
      fileBtn.disabled = true;
      try {
        const res = await fetch('/api/admin/archivo/' + fileBtn.dataset.file, { headers: { 'x-clave': key } });
        if (!res.ok) throw new Error(res.status);
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = fileBtn.dataset.name;
        document.body.append(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      } catch (err) { toast('No se pudo descargar'); }
      fileBtn.disabled = false;
      return;
    }
    const set = e.target.closest('[data-set]');
    if (set) {
      if (set.dataset.set === 'borrar' && !confirm('¿Borrar esta reseña? No se puede deshacer.')) return;
      await api('resenas/' + set.closest('[data-review]').dataset.review, { status: set.dataset.set });
      toast('Listo'); load();
      return;
    }
    // Etapa del proyecto: un toque la guarda (junto con lo que esté escrito en ese proyecto)
    const step = e.target.closest('.step[data-stage]');
    if (step) {
      const form = step.closest('.project-form');
      if (step.getAttribute('aria-pressed') === 'true') return;
      form.querySelectorAll('.step').forEach((b) => { b.disabled = true; });
      form.elements.stage.value = step.dataset.stage;
      const values = Object.fromEntries(new FormData(form));
      try {
        const notify = Boolean($('stage-notify') && $('stage-notify').checked);
        const r = await api('proyectos/' + form.closest('[data-project]').dataset.project, { stage: Number(values.stage), due: values.due, note: values.note, next: values.next, preview: values.preview, notify });
        toast(r.launched
          ? (r.launchMailed ? '¡Publicado! Le mandé el mail con la reseña y su cupón ' + r.coupon : '¡Publicado! Se creó el cupón ' + r.coupon + ' y el pedido de reseña (el mail no salió: revisá que tenga mail)')
          : 'Etapa: ' + STAGES[Number(values.stage)] + '. ' + (r.stageMailed ? 'Le avisé por mail.' : (notify ? 'El cliente la ve en su link (el mail no salió).' : 'El cliente la ve en su link.')));
        load();
      } catch (err) {
        form.querySelectorAll('.step').forEach((b) => { b.disabled = false; });
        toast('No se pudo guardar');
      }
      return;
    }
    const hoursBtn = e.target.closest('[data-hours]');
    if (hoursBtn) {
      const modo = hoursBtn.dataset.hours;
      const hasta = modo ? window.JNBHours.manualUntil(modo) : null;
      if (modo && !hasta) { toast('No se pudo calcular el próximo horario'); return; }
      hoursBtn.disabled = true;
      try {
        data.hours = await api('horario', { modo, hasta: hasta ? hasta.toISOString() : '' });
        renderHours();
        toast(!modo ? 'Listo: vuelve el horario habitual' : 'Abierto hasta el ' + HOURS_DATE.format(hasta));
      } catch (err) { hoursBtn.disabled = false; toast('No se pudo guardar'); }
      return;
    }
    const unsub = e.target.closest('[data-unsub]');
    if (unsub) {
      if (!confirm('¿Quitar ' + unsub.dataset.unsub + ' del newsletter? No le llegan más avisos.')) return;
      await api('newsletter/borrar', { email: unsub.dataset.unsub });
      data.newsletter = await api('newsletter'); renderNewsletter(); toast('Quitado del newsletter');
      return;
    }
    const remove = e.target.closest('[data-remove]');
    if (remove) {
      if (!confirm('¿Borrar este proyecto? El link del cliente deja de funcionar.')) return;
      try {
        await api('proyectos/' + remove.closest('[data-project]').dataset.project, { remove: true });
      } catch (err) {
        toast(err.message === '409' ? 'Tiene pagos cargados: borralos primero (pestaña Pagos)' : 'No se pudo borrar');
        return;
      }
      toast('Proyecto borrado'); go('proyectos', ''); load();
    }
  });

  document.addEventListener('submit', async (e) => {
    const form = e.target;
    const values = Object.fromEntries(new FormData(form));
    if (form.classList.contains('quote-form')) {
      e.preventDefault();
      values.price = values.amount && values.amount.trim() ? values.currency + ' ' + values.amount.trim() : '';
      values.notify = values.notify === 'on';
      if (SENT.includes(values.status) && !values.price) { toast('Falta el precio'); return; }
      const saved = await api('presupuestos/' + form.closest('[data-token]').dataset.token, values);
      toast(saved.created ? (saved.briefMailed ? 'Aceptado: se creó el proyecto y le mandé el link del brief por mail' : 'Aceptado: se creó el proyecto (copiá el link del brief en Clientes)')
        : (saved.proposalMailed ? 'Propuesta guardada y le avisé por mail' : 'Propuesta guardada'));
      load();
    } else if (form.id === 'invite') {
      e.preventDefault();
      const { token } = await api('resenas/invitar', { client: values.client });
      const link = clientLink('resena', values.lang, token);
      const wa = 'https://wa.me/?text=' + encodeURIComponent('¡Hola! Me ayudaría mucho que me dejes tu opinión sobre el trabajo que hicimos juntos: ' + link);
      $('invite-result').innerHTML = '<div class="linkbox">' + esc(link) + '</div><div class="row"><button type="button" data-copy="' + esc(link) + '">Copiar link</button><a class="btn" target="_blank" href="' + esc(wa) + '">Mandar por WhatsApp ↗</a></div>';
      form.reset();
      const fresh = await api('datos'); data.invitations = fresh.invitations;
    } else if (form.id === 'mail-test') {
      e.preventDefault();
      const btn = form.querySelector('button');
      btn.disabled = true; btn.textContent = 'Enviando...';
      const to = new FormData(form).get('to');
      const r = await api('probar-mail', { to }).catch(() => ({ ok: false, status: 0, error: 'No se pudo conectar con el sitio.' }));
      $('mail-test-result').innerHTML = r.ok
        ? '<div class="alert" style="margin-top:.75rem;background:color-mix(in srgb,#2fa36b 15%,var(--card));border-color:#2fa36b;color:inherit">✓ Resend aceptó el mail. Revisá ' + esc(to) + ' (y la carpeta de spam). Si llegó, los avisos a los clientes ya funcionan.</div>'
        : '<div class="alert" style="margin-top:.75rem">✗ No salió. Respuesta de Resend' + (r.status ? ' (' + r.status + ')' : '') + ': <strong>' + esc(r.error || '') + '</strong><br><br>👉 ' + esc(explainMail(r))
          + '<br><br><span class="small">Lo que tiene cargado el sitio: MAIL_FROM = <code>' + esc(r.from || '(vacío)') + '</code> · MAIL_REPLY_TO = <code>' + esc(r.replyTo || '(vacío)') + '</code> · RESEND_API_KEY ' + (r.hasKey ? 'cargada (empieza con ' + esc(r.keyStart) + '…)' : 'vacía') + '</span>'
          + (r.hasKey && !r.keyLooksRight ? '<br><br>⚠ La clave cargada no empieza con <code>re_</code>: las claves de Resend siempre empiezan así. Copiá de nuevo la clave desde Resend y pegá solo eso en RESEND_API_KEY.' : '') + '</div>';
      btn.disabled = false; btn.textContent = 'Probar envío de mail';
      if (!r.ok) { const fresh = await api('datos'); data.mailError = fresh.mailError; }
    } else if (form.id === 'newsletter-test') {
      e.preventDefault();
      const btn = form.querySelector('button');
      btn.disabled = true;
      const r = await api('newsletter/probar', { to: new FormData(form).get('to') }).catch(() => ({ ok: false, error: 'No se pudo conectar con el sitio.' }));
      toast(r.ok ? 'Te mandé el aviso de "' + r.title + '"' : 'No salió: ' + (r.error || 'revisá los mails en "Mails al cliente"'));
      btn.disabled = false;
    } else if (form.id === 'away-form') {
      e.preventDefault();
      const plan = awayPlan(Object.fromEntries(new FormData(form)));
      if (plan.error || !plan.hasta) { toast(plan.error || 'No se pudo calcular el horario'); return; }
      const btn = form.querySelector('button');
      btn.disabled = true;
      try {
        data.hours = await api('horario', { modo: 'cerrado', hasta: plan.hasta.toISOString(), mensaje: plan.mensaje });
        renderHours();
        toast('Ausencia activada');
      } catch (err) { btn.disabled = false; toast('No se pudo guardar'); }
    } else if (form.id === 'availability-form') {
      e.preventDefault();
      const values = Object.fromEntries(new FormData(form));
      data.availability = await api('disponibilidad', { estado: values.estado, reservaDesde: values.estado === 'agenda' ? values.reservaDesde : '' });
      renderAvailability();
      toast('Guardado: el inicio ya muestra "' + availPreview(data.availability.estado, data.availability.reservaDesde) + '"');
    } else if (form.id === 'new-project') {
      e.preventDefault();
      const existing = values.clientId ? clientById(Number(values.clientId)) : null;
      if (!existing && !values.fullName.trim()) { toast('Falta el nombre del cliente'); return; }
      // Nombre que ve el cliente: si no se escribe, su primer nombre
      if (!values.client.trim()) values.client = (existing ? existing.name : values.fullName).trim().split(' ')[0];
      try { await api('proyectos', values); } catch (err) { toast('No se pudo crear: revisá el mail'); return; }
      presetClient = '';
      toast('Proyecto creado'); load();
    } else if (form.id === 'reset-form') {
      e.preventDefault();
      if (values.confirm !== 'REINICIAR') { toast('Escribí REINICIAR para confirmar'); return; }
      if (!confirm('¿Borrar todos los datos de clientes, proyectos, pagos, cupones y reseñas? No se puede deshacer.')) return;
      try {
        await api('reiniciar', { confirm: 'REINICIAR' });
        if (values.faq === 'on') await api('faq/reiniciar', { confirm: 'REINICIAR' });
      } catch (err) { toast('No se pudo reiniciar'); return; }
      openClientCode = ''; selected = '';
      toast('Listo: el panel quedó en cero'); await load(); go('dashboard', '');
    } else if (form.id === 'new-client') {
      e.preventDefault();
      try {
        const r = await api('clientes', values);
        toast('Ficha ' + r.code + ' creada'); clientSub = 'datos'; await load(); go('clientes', r.code);
      } catch (err) { toast(err.message === '409' ? 'Ya hay una ficha con ese mail' : 'No se pudo crear la ficha'); }
    } else if (form.classList.contains('client-form')) {
      e.preventDefault();
      try {
        await api('clientes/' + form.dataset.clientId, values);
        toast('Ficha guardada'); load();
      } catch (err) { toast(err.message === '409' ? 'Ese mail ya es de otra ficha: si es la misma persona, unilas' : 'No se pudo guardar'); }
    } else if (form.classList.contains('merge-form')) {
      e.preventDefault();
      const into = clientById(Number(values.into));
      const from = clientById(Number(form.dataset.clientId));
      if (!into || !from || !confirm('¿Pasar todo de ' + from.code + ' a ' + into.code + '? ' + from.code + ' deja de existir. No se puede deshacer.')) return;
      await api('clientes/' + from.id + '/unir', { into: into.id });
      toast('Fichas unidas'); await load(); go('clientes', into.code);
    } else if (form.classList.contains('payment-form')) {
      e.preventDefault();
      if (!values.project) { toast('Elegí el proyecto'); return; }
      try { await api('pagos', values); } catch (err) { toast('Revisá el concepto y el monto'); return; }
      toast(values.paid ? 'Pago registrado' : 'Pago pendiente registrado'); load();
    } else if (form.classList.contains('project-form')) {
      e.preventDefault();
      await api('proyectos/' + form.closest('[data-project]').dataset.project, { stage: Number(values.stage), due: values.due, note: values.note, next: values.next, preview: values.preview });
      toast('Guardado'); load();
    }
  });

  if (key) load().catch(() => {}); else showLogin(false);
})();
</script>
</body></html>`;
