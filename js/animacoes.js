// Tapeçaria Mendes: poucas animações, com motivo. Rolagem suave (Lenis), a abertura que "costura" o título,
// fotos que se revelam e a linha dos passos que se costura ao rolar (GSAP + ScrollTrigger).
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

  /* ---------- Abertura: o título sobe palavra por palavra e a costura laranja é "passada" embaixo ---------- */
  const titulo = document.querySelector('.hero [data-split]');
  titulo.setAttribute('aria-label', titulo.textContent.trim());
  titulo.innerHTML = titulo.textContent.trim().split(/\s+/)
    .map((p) => '<span class="split-word" aria-hidden="true"><span>' + p + '</span></span>').join(' ');
  gsap.timeline()
    .from(titulo.querySelectorAll('.split-word > span'), { yPercent: 115, duration: 1, ease: 'expo.out', stagger: .07 })
    .to('.hero .costura', { clipPath: 'inset(0 0% 0 0)', duration: 1.1, ease: 'power2.inOut' }, '-=.45')
    .to('.hero [data-reveal]', { opacity: 1, y: 0, duration: .9, ease: 'expo.out', stagger: .1 }, '-=.8');

  /* ---------- Fotos que se revelam de baixo para cima ---------- */
  document.querySelectorAll('[data-clip]').forEach((el) => {
    gsap.to(el, { clipPath: 'inset(0% 0 0 0)', duration: 1.2, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });

  /* ---------- Passos: a linha que liga os números se costura conforme a rolagem ---------- */
  const passos = document.querySelector('.passos');
  if (passos) {
    gsap.fromTo(passos, { '--costurado': 0 }, { '--costurado': 1, ease: 'none', scrollTrigger: { trigger: passos, start: 'top 75%', end: 'bottom 60%', scrub: true } });
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
