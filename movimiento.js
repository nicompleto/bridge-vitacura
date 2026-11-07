// Movimiento de la página, sin librerías: las tarjetas aparecen al bajar, las cifras cuentan,
// la raya roja del menú se desliza, las líneas de los gráficos se dibujan y el paño sigue al mouse.
// Ideas tomadas de componentes abiertos (Magic UI: Blur Fade y Number Ticker, MIT) y hechas a mano.
// Quien pidió "reducir movimiento" en su equipo ve la página quieta.
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window) || !Element.prototype.animate) return;
  const raiz = document.querySelector('.bv');
  if (!raiz) return;
  document.documentElement.classList.add('bv-mov');

  const SUAVE = 'cubic-bezier(.16, 1, .3, 1)';          // llega rápido y frena despacio
  const REVELA = '.bv-card, .bv-ultimo, .bv-kpi, .bv-mt-cifra, .bv-dia, .bv-historia, .bv-historia-top, details.bv-anio, .bv-atajos > *';
  const CIFRA = '.bv-kpi b, .bv-mt-cifra b';
  const visible = (el) => {
    if (!el.isConnected || !el.getClientRects().length) return false;
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < innerHeight;
  };

  // ---------- cifras que cuentan ----------
  const escrito = new WeakMap();      // último texto que puso este script, para no reaccionar a sí mismo
  const valorPrevio = new WeakMap();
  const turno = new WeakMap();
  const leer = (texto) => {
    const tokens = texto.match(/[−-]?\d[\d.,]*/g);
    if (!tokens || tokens.length !== 1) return null;     // fechas y textos con varios números quedan quietos
    let t = tokens[0].replace(/[.,]$/, '');
    const neg = /^[−-]/.test(t);
    t = t.replace(/^[−-]/, '');
    let miles = '', decimal = '.', dec = 0, limpio = t;
    if (/^\d{1,3}([.,])\d{3}(\1\d{3})*$/.test(t) && !/^0/.test(t)) {
      miles = t[t.search(/[.,]/)];
      limpio = t.split(miles).join('');
    } else if (/[.,]/.test(t)) {
      const i = Math.max(t.lastIndexOf('.'), t.lastIndexOf(','));
      decimal = t[i];
      dec = t.length - i - 1;
      const entera = t.slice(0, i), otro = decimal === '.' ? ',' : '.';
      if (entera.includes(otro)) miles = otro;
      limpio = entera.split(otro).join('') + '.' + t.slice(i + 1);
    }
    const v = Number(limpio) * (neg ? -1 : 1);
    if (!Number.isFinite(v)) return null;
    if (!dec && !miles && v >= 1900 && v <= 2100) return null;          // un año no se cuenta
    const signo = neg ? tokens[0][0] : '';
    return {v, dec, miles, decimal, signo, antes: texto.slice(0, texto.indexOf(tokens[0])), despues: texto.slice(texto.indexOf(tokens[0]) + tokens[0].length), original: texto,
      fin: tokens[0].endsWith('.') || tokens[0].endsWith(',') ? tokens[0].slice(-1) : ''};
  };
  const escribir = (n, x) => {
    let s = Math.abs(x).toFixed(n.dec);
    let [e, d] = s.split('.');
    if (n.miles) e = e.replace(/\B(?=(\d{3})+(?!\d))/g, n.miles);
    s = e + (d ? n.decimal + d : '');
    return n.antes + (x < 0 ? (n.signo || '-') : '') + s + n.fin + n.despues;
  };
  const contar = (el, retraso = 0) => {
    const n = leer(el.textContent.trim());
    if (!n) return;
    const desde = valorPrevio.get(el) ?? 0;
    valorPrevio.set(el, n.v);
    if (desde === n.v) return;
    const id = (turno.get(el) || 0) + 1;
    turno.set(el, id);
    const dur = 950, t0 = performance.now() + retraso;
    const paso = (ahora) => {
      if (turno.get(el) !== id) return;                 // llegó otro dato y empezó otra cuenta
      const p = Math.min(1, Math.max(0, (ahora - t0) / dur));
      const k = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      const txt = p === 1 ? n.original : escribir(n, desde + (n.v - desde) * k);
      escrito.set(el, txt);
      el.textContent = txt;
      if (p < 1) requestAnimationFrame(paso);
    };
    escrito.set(el, escribir(n, desde));
    el.textContent = escrito.get(el);
    requestAnimationFrame(paso);
  };

  // ---------- líneas de gráficos que se dibujan ----------
  const dibujar = (cont, retraso = 0) => {
    cont.querySelectorAll('svg path').forEach((p) => {
      if (p.closest('.tick') || p.classList.contains('domain')) return;
      const cs = getComputedStyle(p);
      if (cs.fill !== 'none' || cs.stroke === 'none') return;
      let largo = 0;
      try { largo = p.getTotalLength(); } catch { return; }
      if (largo < 40) return;
      p.animate([{strokeDasharray: `${largo} ${largo}`, strokeDashoffset: largo}, {strokeDasharray: `${largo} ${largo}`, strokeDashoffset: 0}],
        {duration: 1100, delay: retraso + 120, easing: SUAVE, fill: 'backwards'});
    });
  };

  // ---------- aparecer al entrar en pantalla ----------
  const vistos = new WeakSet();
  let cola = [];
  const soltar = () => {
    const lote = cola.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top || a.getBoundingClientRect().left - b.getBoundingClientRect().left);
    cola = [];
    lote.forEach((el, i) => {
      const retraso = Math.min(i, 8) * 55;
      el.classList.remove('bv-espera');
      el.animate([{opacity: 0, transform: 'translateY(18px) scale(.985)', filter: 'blur(6px)'}, {opacity: 1, transform: 'none', filter: 'blur(0)'}],
        {duration: 620, delay: retraso, easing: SUAVE, fill: 'backwards'});
      (el.matches(CIFRA) ? [el] : el.querySelectorAll(CIFRA)).forEach((c) => contar(c, retraso + 80));
      dibujar(el, retraso);
    });
  };
  const io = new IntersectionObserver((entradas) => {
    for (const e of entradas) {
      if (!e.isIntersecting || !e.target.classList.contains('bv-espera')) continue;
      io.unobserve(e.target);
      cola.push(e.target);
    }
    if (cola.length) soltar();
  }, {rootMargin: '0px 0px -5% 0px'});
  // además del observador, una revisión directa: lo que está en pantalla y sigue esperando, aparece ya
  // (se llama al cambiar de pestaña, al bajar y cada segundo, así nada queda invisible)
  const revisar = () => {
    for (const el of raiz.querySelectorAll('.bv-espera')) {
      if (visible(el)) { io.unobserve(el); cola.push(el); }
    }
    if (cola.length) soltar();
  };
  let pedido = false;
  const revisarLuego = () => { if (!pedido) { pedido = true; requestAnimationFrame(() => { pedido = false; revisar(); }); } };
  addEventListener('scroll', revisarLuego, {passive: true});
  addEventListener('resize', revisarLuego);
  setInterval(revisar, 1000);
  const mirar = (el) => {
    if (vistos.has(el) || el.parentElement?.closest(REVELA)) return;     // lo de adentro se mueve con su tarjeta
    vistos.add(el);
    el.classList.add('bv-espera');
    io.observe(el);
  };
  let enLote = false;                 // nodos nuevos: se revisan juntos al final del cambio
  raiz.querySelectorAll(REVELA).forEach(mirar);
  revisar();

  // ---------- cambios de contenido ----------
  new MutationObserver((cambios) => {
    for (const c of cambios) {
      if (c.type === 'childList') {
        c.addedNodes.forEach((n) => {
          if (n.nodeType !== 1) return;
          if (n.matches(REVELA)) mirar(n);
          n.querySelectorAll?.(REVELA).forEach(mirar);
          enLote = true;
          if (n.tagName === 'svg' || n.querySelector?.('svg')) {
            const tarjeta = n.closest(REVELA);
            if (tarjeta && !tarjeta.classList.contains('bv-espera') && visible(n)) dibujar(n.tagName === 'svg' ? n.parentElement : n);
          }
        });
      }
      // una cifra que cambia (otro año, otro jugador) cuenta desde el valor anterior
      const el = c.target.nodeType === 1 ? c.target : c.target.parentElement;
      const cifra = el?.closest?.(CIFRA);
      if (cifra && cifra.textContent !== escrito.get(cifra) && !cifra.closest('.bv-espera') && visible(cifra)) contar(cifra);
      else if (cifra && cifra.textContent !== escrito.get(cifra)) valorPrevio.delete(cifra);
    }
    if (enLote) { enLote = false; revisar(); }
  }).observe(raiz, {childList: true, subtree: true, characterData: true});

  // ---------- al cambiar de pestaña, la página entra suave ----------
  raiz.querySelectorAll('.bv-page').forEach((pag) => new MutationObserver(() => {
    if (pag.hidden) return;
    revisar();
    pag.animate([{opacity: 0, transform: 'translateY(10px)'}, {opacity: 1, transform: 'none'}], {duration: 380, easing: SUAVE});
  }).observe(pag, {attributes: true, attributeFilter: ['hidden']}));

  // ---------- la raya roja del menú se desliza ----------
  const menu = raiz.querySelector('nav.bv-tabs');
  if (menu) {
    const raya = document.createElement('span');
    raya.className = 'bv-tab-raya';
    raya.setAttribute('aria-hidden', 'true');
    menu.appendChild(raya);
    let primera = true;
    const ubicar = () => {
      const activa = [...menu.querySelectorAll(':scope > .bv-tab, .bv-mas-btn')].find((b) => b.getAttribute('aria-selected') === 'true' && b.getClientRects().length);
      if (!activa) { raya.style.opacity = '0'; return; }
      const m = menu.getBoundingClientRect(), r = activa.getBoundingClientRect();
      if (primera) raya.style.transition = 'none';
      raya.style.opacity = '1';
      raya.style.width = `${r.width}px`;
      raya.style.transform = `translate(${r.left - m.left}px, ${r.bottom - m.top - 3}px)`;
      if (primera) { raya.getBoundingClientRect(); raya.style.transition = ''; primera = false; }
    };
    new MutationObserver(() => requestAnimationFrame(ubicar)).observe(menu, {attributes: true, subtree: true, attributeFilter: ['aria-selected'], childList: true, characterData: true});
    addEventListener('resize', () => requestAnimationFrame(ubicar));
    document.fonts?.ready.then(ubicar);
    ubicar();
  }

  // ---------- el paño sigue al mouse dentro de cada tarjeta ----------
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    raiz.addEventListener('pointermove', (ev) => {
      const t = ev.target.closest?.('.bv-card, .bv-ultimo, .bv-dia');
      if (!t) return;
      const r = t.getBoundingClientRect();
      t.style.setProperty('--mx', `${ev.clientX - r.left}px`);
      t.style.setProperty('--my', `${ev.clientY - r.top}px`);
    }, {passive: true});
  }
})();
