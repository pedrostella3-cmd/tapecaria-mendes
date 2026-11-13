// Tapeçaria Mendes: poucas animações, com motivo. Rolagem suave (Lenis); na abertura a fachada acende (CSS) e o título
// sobe palavra por palavra; fotos que se revelam ao chegar e números que contam (nota e avaliações reais do Google).
// Sem as bibliotecas, com "reduzir movimento" ligado ou com ?parado na URL, nada se mexe e tudo aparece normal.
(function () {
  const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]parado/.test(location.search);
  const temGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  if (!temGsap || reduz) return;
  document.documentElement.classList.add('motion');
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Rolagem suave ---------- */
  if (typeof window.Lenis !== 'undefined') {
    const lenis = new window.Lenis({ duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true });
    window.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- Abertura ---------- */
  const titulo = document.querySelector('.hero [data-split]');
  titulo.setAttribute('aria-label', titulo.textContent.trim());
  titulo.innerHTML = titulo.textContent.trim().split(/\s+/)
    .map((p) => '<span class="split-word" aria-hidden="true"><span>' + p + '</span></span>').join(' ');
  gsap.timeline({ delay: .4 })
    .from(titulo.querySelectorAll('.split-word > span'), { yPercent: 115, duration: 1, ease: 'expo.out', stagger: .07 })
    .to('.hero [data-reveal]', { opacity: 1, y: 0, duration: .9, ease: 'expo.out', stagger: .1 }, '-=.7');

  /* ---------- Fotos que se revelam ---------- */
  document.querySelectorAll('[data-clip]').forEach((el) => {
    gsap.to(el, { clipPath: 'inset(0% 0 0 0)', duration: 1.2, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });

  /* ---------- Fotos da galeria entram em sequência ---------- */
  ScrollTrigger.batch('.gallery__grid li', {
    start: 'top 92%', once: true,
    onEnter: (lote) => gsap.from(lote, { opacity: 0, y: 30, duration: .8, ease: 'expo.out', stagger: .06 }),
  });

  /* ---------- Números que contam ---------- */
  const fmt = (v, d) => v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  document.querySelectorAll('[data-count]').forEach((el) => {
    const alvo = Number(el.dataset.count), dec = Number(el.dataset.decimais || 0), obj = { v: 0 };
    el.textContent = fmt(0, dec);
    gsap.to(obj, { v: alvo, duration: 1.4, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: () => { el.textContent = fmt(obj.v, dec); } });
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
