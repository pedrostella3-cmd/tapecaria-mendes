// Tapeçaria Mendes (a partir do modelo base Agiliza): menu, rolagem, topo, avaliações, galeria com filtro,
// serviços (um aberto por vez), formulário do WhatsApp com prévia da mensagem e o fio que costura a página.
// Funciona sozinho; as animações ficam em animacoes.js e o site continua legível se elas não carregarem.
(function () {
  const WHATS = document.body.dataset.whatsapp;
  const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]parado/.test(location.search);
  const hoje = new Date();
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = hoje.getFullYear(); });

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

  /* ---------- Links internos (a rolagem suave do Lenis entra em animacoes.js) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const alvo = id.length > 1 && document.querySelector(id);
      if (!alvo) return;
      e.preventDefault();
      if (nav.classList.contains('is-open')) fecharMenu();
      if (window.lenis) window.lenis.scrollTo(alvo, { offset: id === '#inicio' ? 0 : -60, duration: 1.4 });
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

  /* ---------- Fotos da abertura em sequência ---------- */
  const slides = [...document.querySelectorAll('.hero__slide')];
  if (slides.length > 1 && !reduz) {
    let atual = 0;
    setInterval(() => {
      if (document.hidden) return;
      slides[atual].classList.remove('is-active');
      atual = (atual + 1) % slides.length;
      slides[atual].classList.add('is-active');
    }, 6500);
  }

  /* ---------- Depoimentos ---------- */
  const reviews = [...document.querySelectorAll('.review')];
  const dots = [...document.querySelectorAll('.reviews__dots button')];
  let rAtual = 0;
  let rTimer;
  function mostrarReview(i) {
    reviews[rAtual].classList.remove('is-active');
    dots[rAtual].setAttribute('aria-selected', 'false');
    rAtual = i;
    reviews[rAtual].classList.add('is-active');
    dots[rAtual].setAttribute('aria-selected', 'true');
  }
  function rodarReviews() {
    clearInterval(rTimer);
    if (!reduz && reviews.length > 1) rTimer = setInterval(() => mostrarReview((rAtual + 1) % reviews.length), 7000);
  }
  if (reviews.length && dots.length === reviews.length) {
    dots.forEach((d, i) => d.addEventListener('click', () => { mostrarReview(i); rodarReviews(); }));
    rodarReviews();
  }

  /* ---------- Galeria ampliada ---------- */
  const dialog = document.querySelector('[data-lightbox-dialog]');
  if (dialog && typeof dialog.showModal === 'function') {
    const img = dialog.querySelector('img');
    document.querySelectorAll('[data-lightbox]').forEach((b) => {
      b.addEventListener('click', () => {
        const mini = b.querySelector('img');
        img.src = b.dataset.lightbox;
        img.alt = mini ? mini.alt : '';
        dialog.showModal();
        if (window.lenis) window.lenis.stop();
      });
    });
    dialog.querySelector('.lightbox__close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => { if (window.lenis) window.lenis.start(); });
  }

  /* ---------- Formulário → mensagem pronta no WhatsApp ---------- */
  // Cada campo com name entra na mensagem como "Rótulo: valor", na ordem do formulário.
  // A primeira linha vem de data-mensagem no <form>. Nada é enviado pelo site: só abre o WhatsApp.
  const form = document.querySelector('[data-booking]');
  const aviso = document.querySelector('[data-booking-warn]');
  const dataBR = (v) => v.split('-').reverse().join('/');
  const limpar = (v) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, 300);

  function montarMensagem() {
    const linhas = [form.dataset.mensagem];
    const vistos = new Set();
    [...form.elements].forEach((campo) => {
      if (!campo.name || vistos.has(campo.name) || campo.type === 'submit') return;
      vistos.add(campo.name);
      let valor = campo.type === 'radio' ? (form.querySelector(`[name="${campo.name}"]:checked`) || {}).value : campo.value;
      valor = limpar(valor);
      if (!valor) return;
      if (campo.type === 'date') valor = dataBR(valor);
      const rotulo = campo.dataset.rotulo || (campo.closest('.field')?.querySelector('span, legend')?.textContent ?? campo.name);
      linhas.push(limpar(rotulo) + ': ' + valor);
    });
    return linhas.join('\n');
  }

  if (form) {
    window.montarMensagem = montarMensagem; // usado pela cena da propaganda
    const hojeISO = new Date(hoje.getTime() - hoje.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const datas = [...form.querySelectorAll('input[type="date"]')];
    datas.forEach((d) => { d.min = hojeISO; });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      aviso.hidden = true;
      // Com duas datas (chegada e saída), a segunda precisa ser depois da primeira
      if (datas.length === 2 && datas[0].value && datas[1].value && datas[1].value <= datas[0].value) {
        aviso.textContent = 'A segunda data precisa ser depois da primeira.';
        aviso.hidden = false;
        return;
      }
      window.open('https://wa.me/' + WHATS + '?text=' + encodeURIComponent(montarMensagem()), '_blank', 'noopener');
    });
  }

  /* ---------- Prévia: mostra a mensagem do jeito que ela chega no WhatsApp ---------- */
  const previa = document.querySelector('[data-previa]');
  function atualizarPrevia() { if (form && previa) previa.textContent = montarMensagem(); }
  if (form) { form.addEventListener('input', atualizarPrevia); form.addEventListener('change', atualizarPrevia); }
  atualizarPrevia();

  /* ---------- Serviços: só um aberto por vez; o botão leva o serviço escolhido para o formulário ---------- */
  const servicos = [...document.querySelectorAll('.servico')];
  servicos.forEach((s) => {
    s.addEventListener('toggle', () => { if (s.open) servicos.forEach((o) => { if (o !== s) o.open = false; }); });
    // No computador sempre fica um aberto (o painel ao lado não pode ficar vazio)
    s.querySelector('summary').addEventListener('click', (e) => { if (s.open && window.innerWidth > 860) e.preventDefault(); });
  });
  document.querySelectorAll('[data-servico]').forEach((b) => {
    b.addEventListener('click', () => {
      if (!form) return;
      form.elements.servico.value = b.dataset.servico;
      atualizarPrevia();
    });
  });

  /* ---------- Trabalhos: filtro por tipo ---------- */
  const filtros = [...document.querySelectorAll('[data-filtro]')];
  const fotos = [...document.querySelectorAll('.gallery__grid li')];
  filtros.forEach((f) => {
    f.addEventListener('click', () => {
      filtros.forEach((o) => o.setAttribute('aria-pressed', String(o === f)));
      fotos.forEach((li) => { li.hidden = f.dataset.filtro !== 'todos' && li.dataset.tipo !== f.dataset.filtro; });
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    });
  });

  /* ---------- Fio que costura a borda da página conforme a rolagem ---------- */
  const fio = document.querySelector('.fio');
  if (fio) {
    const medirFio = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      fio.style.setProperty('--p', max > 0 ? Math.min(1, window.scrollY / max).toFixed(4) : '0');
    };
    window.addEventListener('scroll', medirFio, { passive: true });
    medirFio();
  }
})();
