// Tapeçaria Mendes: "Monte seu orçamento". O cliente escolhe o serviço, a opção e a cor do couro, vê o valor de referência
// e manda tudo pronto no WhatsApp. Nada é enviado pelo site. Os botões [data-simular] dos serviços já chegam com o serviço escolhido.
// PREÇOS: passados pela Mendes em 13/11/2026 (referencias/whatsapp-2026-11-13/informacoes.md). Para mudar um preço, mude só aqui.
(function () {
  const SERVICOS = {
    bancos: { nome: 'Bancos (jogo completo)', titulo: 'Material', opcoes: [
      { nome: 'Couro natural', valor: 4599, cor: true },
      { nome: '70% couro e 30% sintético', valor: 3179, cor: true },
      { nome: 'Couro sintético', valor: 2279, cor: true },
      { nome: 'Tecido', valor: 2279 },
    ] },
    assoalho: { nome: 'Assoalho', titulo: 'Tipo de veículo', opcoes: [
      { nome: 'Picape compacta', dica: 'Saveiro, Strada, Montana', valor: 670 },
      { nome: 'Hatch', dica: 'todos os modelos', valor: 750 },
      { nome: 'SUV', dica: 'todos os modelos', valor: 800 },
      { nome: 'Picape média', dica: 'Hilux, S10, Rampage, Toro, Ranger, Frontier', valor: 900 },
      { nome: 'Picape grande', dica: 'RAM, Silverado, F-150', valor: 1200 },
    ] },
    forros: { nome: 'Forros de porta', titulo: 'Tamanho do forro', opcoes: [
      { nome: 'Pequeno', dica: 'R$ 120 a unidade', valor: 480, apartir: true, detalhe: 'Jogo com as 4 portas. A unidade sai a partir de R$ 120.' },
      { nome: 'Médio', dica: 'R$ 160 a unidade', valor: 640, apartir: true, detalhe: 'Jogo com as 4 portas. A unidade sai a partir de R$ 160.' },
      { nome: 'Grande', dica: 'R$ 290 a unidade', valor: 1160, apartir: true, detalhe: 'Jogo com as 4 portas. A unidade sai a partir de R$ 290.' },
    ] },
    volante: { nome: 'Volante', titulo: 'Material', opcoes: [
      { nome: 'Couro natural', faixa: [320, 700], cor: true },
      { nome: 'Couro sintético', faixa: [200, 400], cor: true },
    ] },
    teto: { nome: 'Teto', valor: 600, apartir: true, detalhe: 'O menor é o de uma Saveiro cabine simples. Muda com o tamanho do carro.' },
    outro: { nome: 'Outro serviço', detalhe: 'Cabine de caminhão, sofá, cabeceira, capa, troca de faixa ou só um banco: o especialista responde com o valor.' },
  };
  const CORES = ['Preto', 'Grafite', 'Cinza claro', 'Bege claro', 'Bege', 'Caramelo', 'Marrom', 'Café', 'Vinho', 'Azul marinho', 'Verde musgo', 'Branco'];
  const arquivo = (c) => 'assets/img/couros/' + c.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ /g, '-') + '.webp';

  const form = document.querySelector('[data-simulador]');
  if (!form) return;
  const WHATS = document.body.dataset.whatsapp;
  const $ = (s) => form.querySelector(s);
  const caixa = (n) => $('[data-opcoes="' + n + '"]');
  const valorEl = $('[data-valor]'), detalheEl = $('[data-detalhe]'), previa = $('[data-previa]');
  const estado = { servico: '', opcao: -1, cor: '' };
  const reais = (v) => 'R$ ' + Math.round(v).toLocaleString('pt-BR');
  const limpar = (v) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, 300);

  function botao(texto, dica, ativo, aoClicar, classe) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = classe || 'opcao';
    b.setAttribute('aria-pressed', String(ativo));
    b.innerHTML = '<span></span>' + (dica ? '<small></small>' : '');
    b.firstChild.textContent = texto;
    if (dica) b.lastChild.textContent = dica;
    b.addEventListener('click', aoClicar);
    return b;
  }

  // Valor que conta até o novo número (só quando muda de um número para outro)
  let valorAtual = 0, anim;
  function mostrarValor(texto, numero) {
    cancelAnimationFrame(anim);
    if (numero == null || /[?&]parado/.test(location.search) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      valorEl.textContent = texto; valorAtual = numero || 0; return;
    }
    const de = valorAtual, ini = performance.now(), prefixo = texto.startsWith('a partir') ? 'a partir de ' : '';
    const passo = (t) => {
      const k = Math.min(1, (t - ini) / 650), e = 1 - Math.pow(1 - k, 3);
      valorEl.textContent = prefixo + reais(de + (numero - de) * e);
      if (k < 1) anim = requestAnimationFrame(passo); else { valorEl.textContent = texto; valorAtual = numero; }
    };
    anim = requestAnimationFrame(passo);
  }

  function opcaoAtual() { const s = SERVICOS[estado.servico]; return s && s.opcoes ? s.opcoes[estado.opcao] : null; }

  function calcular() {
    const s = SERVICOS[estado.servico], o = opcaoAtual();
    if (!s) return { texto: 'Escolha um serviço', detalhe: 'O valor final é confirmado depois da avaliação.' };
    if (estado.servico === 'outro') return { texto: 'Sob consulta', detalhe: s.detalhe };
    const base = o || (s.opcoes ? null : s);
    if (!base) return { texto: 'Escolha: ' + s.titulo.toLowerCase(), detalhe: 'O valor final é confirmado depois da avaliação.' };
    const fim = 'Valor de referência, confirmado depois da avaliação.';
    if (base.faixa) return { texto: reais(base.faixa[0]) + ' a ' + reais(base.faixa[1]), detalhe: fim };
    return { texto: (base.apartir ? 'a partir de ' : '') + reais(base.valor), numero: base.valor, detalhe: (base.detalhe ? base.detalhe + ' ' : '') + fim };
  }

  function montarMensagem() {
    const s = SERVICOS[estado.servico], o = opcaoAtual(), r = calcular();
    const linhas = [form.dataset.mensagem];
    if (s) linhas.push('Serviço: ' + s.nome);
    if (o) linhas.push(s.titulo + ': ' + o.nome);
    if (estado.cor && o && o.cor) linhas.push('Cor do couro: ' + estado.cor + ' (cód. ' + String(CORES.indexOf(estado.cor) + 1).padStart(2, '0') + ')');
    if (s && estado.servico !== 'outro' && (o || !s.opcoes)) linhas.push('Valor de referência: ' + r.texto);
    [['veiculo', 'Veículo ou peça'], ['pedido', 'O que eu quero'], ['nome', 'Nome']].forEach(([n, rot]) => {
      const v = limpar(form.elements[n].value);
      if (v) linhas.push(rot + ': ' + v);
    });
    return linhas.join('\n');
  }
  window.montarMensagem = montarMensagem; // usado pelo conferidor e pela cena do vídeo

  function desenhar() {
    const s = SERVICOS[estado.servico], o = opcaoAtual();
    const cs = caixa('servico');
    cs.replaceChildren(...Object.entries(SERVICOS).map(([id, sv]) => botao(sv.nome.replace(' (jogo completo)', ''), '', id === estado.servico, () => escolherServico(id))));
    const passoOpcao = $('[data-passo-opcao]'), passoCor = $('[data-passo-cor]');
    passoOpcao.hidden = !(s && s.opcoes);
    if (s && s.opcoes) {
      $('[data-opcao-titulo]').textContent = s.titulo;
      caixa('opcao').replaceChildren(...s.opcoes.map((op, i) => botao(op.nome, op.dica, i === estado.opcao, () => { estado.opcao = i; atualizar(); })));
    }
    passoCor.hidden = !(o && o.cor);
    if (o && o.cor) {
      caixa('cor').replaceChildren(...CORES.map((c) => {
        const b = botao('', '', c === estado.cor, () => { estado.cor = c; atualizar(); }, 'cor');
        b.style.backgroundImage = 'url("' + arquivo(c) + '")';
        b.setAttribute('aria-label', c); b.title = c; b.firstChild.remove();
        return b;
      }));
      $('[data-cor-nome]').textContent = estado.cor ? '· ' + estado.cor : '';
    }
    $('[data-num-dados]').textContent = 1 + !passoOpcao.hidden + !passoCor.hidden + 1;
  }

  function atualizar() {
    desenhar();
    const r = calcular();
    mostrarValor(r.texto, r.numero);
    detalheEl.textContent = r.detalhe;
    previa.textContent = montarMensagem();
  }
  function escolherServico(id) { estado.servico = id; estado.opcao = -1; estado.cor = ''; atualizar(); }
  window.simular = (id, opcao, cor) => { escolherServico(id); if (opcao != null) estado.opcao = opcao; if (cor) estado.cor = cor; atualizar(); }; // cena do vídeo

  form.addEventListener('input', () => { previa.textContent = montarMensagem(); });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    window.open('https://wa.me/' + WHATS + '?text=' + encodeURIComponent(montarMensagem()), '_blank', 'noopener');
  });
  // Botões dos serviços ("Monte o orçamento do volante"): chegam aqui já com o serviço escolhido
  document.querySelectorAll('[data-simular]').forEach((a) => a.addEventListener('click', () => escolherServico(a.dataset.simular)));
  atualizar();
})();
