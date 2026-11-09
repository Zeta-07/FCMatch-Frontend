// Antes del primer render. Solo preferencia visual, nunca tokens.
(() => {
  let theme = 'dark';
  try {
    if (localStorage.getItem('fcmatch-theme') === 'light') theme = 'light';
  } catch {
    /* Modo privado. */
  }
  document.documentElement.dataset.theme = theme;
  document
    .querySelector('link[rel="icon"]')
    ?.setAttribute(
      'href',
      `assets/branding/${theme === 'light' ? 'Logo.png' : 'Logo-modo-oscuro.png'}`,
    );
})();
