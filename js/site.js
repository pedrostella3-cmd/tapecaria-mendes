// Tapeçaria Mendes (base da Gênova Detail): menu, rolagem, topo, serviços que abrem (um por vez, com link próprio),
// galeria com filtro e foto ampliada, e os links que abrem o WhatsApp com o texto pronto.
// O simulador de orçamento fica em simulador.js; as animações em animacoes.js. Sem eles, o site continua legível.
(function () {
  const WHATS = document.body.dataset.whatsapp;
  const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]parado/.test(location.search);
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  // Links de WhatsApp: o número fica só no data-whatsapp do <body>; data-wa é o texto inicial da conversa
  document.querySelectorAll('[data-wa]').forEach((a) => {
    a.href = 'https://wa.me/' + WHATS + (a.dataset.wa ? '?text=' + encodeURIComponent(a.dataset.wa) : '');
  });

  /* ---------- Menu do celular ---------- */
  const menuBtn = document.querySelector('.menu-btn');
  const nav = document.getElementById('nav');
  function fecharMenu() {
    menuBtn.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
    document.body.classList.remove('menu-open');
    if (window.lenis) window.lenis.start();
  }
  menuBtn.addEventListener('click', () => {
    if (menuBtn.getAttribute('aria-expanded') === 'true') return fecharMenu();
    menuBtn.setAttribute('aria-expanded', 'true');
    nav.classList.add('is-open');
    document.body.classList.add('menu-open');
    if (window.lenis) window.lenis.stop();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('is-open')) fecharMenu(); });

  /* ---------- Serviços: tocar abre o painel embaixo do grupo (um aberto por vez) ---------- */
  const chips = [...document.querySelectorAll('[data-abre]')];
  function mostrarServico(id) {   // id vazio fecha todos
    document.querySelectorAll('.servico').forEach((p) => {
      p.hidden = p.id !== id;
      const v = p.querySelector('video');
      if (v) { if (!p.hidden && !reduz) v.play().catch(() => {}); else v.pause(); }
    });
    chips.forEach((c) => c.setAttribute('aria-expanded', String(c.dataset.abre === id)));
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  }
  window.mostrarServico = mostrarServico; // usado pela cena do vídeo
  chips.forEach((c) => c.addEventListener('click', () => {
    const aberto = c.getAttribute('aria-expanded') === 'true';
    mostrarServico(aberto ? '' : c.dataset.abre);
    if (!aberto) history.replaceState(null, '', '#' + c.dataset.abre);   // link certo na barra, para mandar ao cliente
  }));
  // Quem chega por um link de serviço (…/#volante) já vê o serviço aberto
  function abrirPeloLink() {
    const p = location.hash.length > 1 && document.getElementById(location.hash.slice(1));
    if (p && p.matches('.servico')) { mostrarServico(p.id); p.closest('.grupo').scrollIntoView(); }
  }
  window.addEventListener('hashchange', abrirPeloLink);
  abrirPeloLink();

  /* ---------- Links internos (a rolagem suave do Lenis entra em animacoes.js) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const alvo = id.length > 1 && document.querySelector(id);
      if (!alvo) return;
      e.preventDefault();
      if (alvo.matches('.servico')) { mostrarServico(alvo.id); history.replaceState(null, '', id); }
      if (nav.classList.contains('is-open')) fecharMenu();
      if (window.lenis) window.lenis.scrollTo(alvo, { offset: id === '#inicio' ? 0 : -70, duration: 1.3 });
      else alvo.scrollIntoView({ behavior: reduz ? 'auto' : 'smooth' });
    });
  });

  /* ---------- Topo: fica sólido ao rolar e some ao descer ---------- */
  const topbar = document.querySelector('[data-topbar]');
  let ultimoY = 0;
  function atualizarTopo() {
    const y = window.scrollY;
    topbar.classList.toggle('is-solid', y > 60);
    topbar.classList.toggle('is-hidden', y > 500 && y > ultimoY && !nav.classList.contains('is-open'));
    ultimoY = y;
  }
  window.addEventListener('scroll', atualizarTopo, { passive: true });
  atualizarTopo();

  // Destaca no menu a seção que está na tela
  const links = [...nav.querySelectorAll('a[href^="#"]:not(.nav__cta)')];
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entradas) => {
      entradas.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((l) => l.classList.toggle('is-current', l.getAttribute('href') === '#' + en.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach((l) => { const s = document.querySelector(l.getAttribute('href')); if (s) io.observe(s); });
  }

  /* ---------- Trabalhos: filtro por tipo ---------- */
  const filtros = [...document.querySelectorAll('[data-filtro]')];
  const fotos = [...document.querySelectorAll('.gallery__grid li')];
  filtros.forEach((f) => f.addEventListener('click', () => {
    filtros.forEach((o) => o.setAttribute('aria-pressed', String(o === f)));
    fotos.forEach((li) => { li.hidden = f.dataset.filtro !== 'todos' && li.dataset.tipo !== f.dataset.filtro; });
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  }));

  /* ---------- Foto ampliada (galeria e catálogo) ---------- */
  const dialog = document.querySelector('[data-lightbox-dialog]');
  if (dialog && typeof dialog.showModal === 'function') {
    const img = dialog.querySelector('img');
    document.querySelectorAll('[data-lightbox]').forEach((b) => {
      b.addEventListener('click', () => {
        const mini = b.querySelector('img');
        img.src = b.dataset.lightbox;
        img.alt = b.dataset.alt || (mini ? mini.alt : '');
        dialog.showModal();
        if (window.lenis) window.lenis.stop();
      });
    });
    dialog.querySelector('.lightbox__close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => { if (window.lenis) window.lenis.start(); });
  }
})();
