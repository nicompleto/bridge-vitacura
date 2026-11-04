// Pestaña ¿Qué rematarías?: tu contrato contra lo que jugó el Club Vitacura en una mano real
(() => {
  const {fmt, filas, listaBarras} = window.bv;
  const PALOS = [['T', '♣'], ['D', '♦'], ['C', '♥'], ['P', '♠'], ['S', 'ST']];
  const q = {i: null, nivel: null, palo: null, visto: false, ganadas: 0, jugadas: 0};

  const manos = () => filas('quiz') || [];
  const actual = () => {
    const m = manos();
    if (!m.length) return null;
    if (q.i === null) q.i = Math.floor(Math.random() * m.length);
    return m[q.i % m.length];
  };
  const dibujar = () => ['quiz-mano', 'quiz-nivel', 'quiz-palo', 'quiz-resultado', 'quiz-marcador'].forEach((d) => dash.draw(d));
  const elegido = () => (q.palo === 'Paso' ? 'Paso' : q.nivel && q.palo ? `${q.nivel}${q.palo}` : null);
  const texto = (c) => (c === 'Paso' ? 'Paso' : c[0] + (PALOS.find(([k]) => k === c[1]) || [])[1]);

  // puntaje del contrato (sin doblar) con las bazas del doble muerto
  const puntaje = (c, bazas, vul) => {
    if (c === 'Paso') return 0;
    const nivel = Number(c[0]), palo = c[1];
    const hechas = bazas - nivel - 6;
    if (hechas < 0) return hechas * (vul ? 100 : 50);
    const porBaza = palo === 'T' || palo === 'D' ? 20 : 30;
    const base = nivel * porBaza + (palo === 'S' ? 10 : 0);
    const bono = (base >= 100 ? (vul ? 500 : 300) : 50) + (nivel === 6 ? (vul ? 750 : 500) : 0) + (nivel === 7 ? (vul ? 1500 : 1000) : 0);
    return base + bono + hechas * porBaza;
  };
  const evaluar = (m, c) => {
    const dd = m.dd.split(',').map(Number);
    const bazas = c === 'Paso' ? 0 : dd[PALOS.findIndex(([k]) => k === c[1])];
    const p = puntaje(c, bazas, m.vul);
    const club = m.puntajes.split(',').map(Number);
    const pct = club.reduce((s, v) => s + (p > v ? 1 : p === v ? 0.5 : 0), 0) / club.length * 100;
    return {bazas, p, pct};
  };

  const botones = (el, items, activo, alElegir) => {
    el.replaceChildren(...items.map(([v, t]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'bv-chip';
      b.textContent = t;
      b.disabled = q.visto;
      b.setAttribute('aria-pressed', String(v === activo));
      b.addEventListener('click', () => { alElegir(v); dibujar(); actualizarBoton(); });
      return b;
    }));
  };
  const actualizarBoton = () => {
    document.querySelectorAll('#quiz-comparar').forEach((b) => { b.disabled = !elegido() || q.visto; });
  };

  dash.draw('quiz-nivel', (el) => botones(el, [1, 2, 3, 4, 5, 6, 7].map((n) => [n, String(n)]), q.nivel, (v) => { q.nivel = v; if (q.palo === 'Paso') q.palo = null; }));
  dash.draw('quiz-palo', (el) => botones(el, [...PALOS, ['Paso', 'Paso']], q.palo, (v) => { q.palo = v; if (v === 'Paso') q.nivel = null; }));

  const mano = (titulo, cartas) => {
    const d = document.createElement('div');
    d.className = 'bv-quiz-mano';
    const h = document.createElement('h3');
    h.textContent = titulo;
    d.appendChild(h);
    cartas.split('.').forEach((c, i) => {
      const f = document.createElement('div');
      f.className = 'bv-quiz-palo' + (i === 1 || i === 2 ? ' bv-rojo' : '');
      const s = document.createElement('span');
      s.textContent = '♠♥♦♣'[i];
      const v = document.createElement('span');
      v.textContent = c ? c.replace(/T/g, '10').split('').join(' ').replace('1 0', '10') : '—';
      f.append(s, v);
      d.appendChild(f);
    });
    return d;
  };
  dash.draw('quiz-mano', (el) => {
    const m = actual();
    if (!m) { el.replaceChildren(); return; }
    const info = document.createElement('p');
    info.className = 'bv-quiz-info';
    info.textContent = `Tu línea tiene ${m.hcp} puntos de honor · ${m.vul ? 'vulnerables' : 'no vulnerables'} · jugada el ${m.fecha}`;
    el.replaceChildren(mano('Tu mano', m.tu), mano('Tu compañero', m.comp), info);
  });

  dash.draw('quiz-marcador', (el) => {
    el.textContent = q.jugadas ? `Tú ${q.ganadas} · Club ${q.jugadas - q.ganadas}` : 'Tú 0 · Club 0';
  });

  dash.draw('quiz-resultado', (el) => {
    const m = actual();
    const c = elegido();
    if (!m || !q.visto || !c) { el.replaceChildren(); return; }
    const r = evaluar(m, c);
    const card = document.createElement('div');
    card.className = 'bv-card';
    const v = document.createElement('p');
    v.className = 'bv-quiz-veredicto';
    v.textContent = r.pct > 50 ? `¡Le ganaste al club! ${fmt.pct(r.pct)}` : r.pct === 50 ? `Empate con el club: ${fmt.pct(r.pct)}` : `El club ganó esta: ${fmt.pct(r.pct)}`;
    const d = document.createElement('p');
    d.className = 'bv-sentence';
    d.textContent = c === 'Paso' ? 'Pasaste la mano: 0 puntos.'
      : `${texto(c)}: con juego perfecto se hacen ${r.bazas} bazas, ${r.bazas >= Number(c[0]) + 6 ? 'se cumple' : 'no se cumple'}, ${fmt.int(r.p)} puntos.`;
    const mejores = [];
    for (let n = 1; n <= 7; n++) PALOS.forEach(([k]) => mejores.push(`${n}${k}`));
    const top = mejores.map((x) => ({x, s: evaluar(m, x).p})).sort((a, b) => b.s - a.s)[0];
    const t = document.createElement('p');
    t.className = 'bv-note';
    t.textContent = `El mejor contrato posible era ${texto(top.x)} (${fmt.int(top.s)} puntos).`;
    const h = document.createElement('h3');
    h.textContent = 'Qué se jugó en el club';
    const ol = document.createElement('ol');
    ol.className = 'bv-bars';
    const club = m.club.split(',').map((x) => x.split(':')).map(([k, n]) => ({k, n: Number(n)}));
    card.append(v, d, t, h, ol);
    el.replaceChildren(card);
    listaBarras(ol, club.map((x) => ({nombre: texto(x.k), valor: x.n, texto: `${x.n} ${x.n === 1 ? 'mesa' : 'mesas'}`})),
                {dominio: [0, d3.max(club, (x) => x.n)], medallas: false, colores: club.map((x) => (x.k === c ? 'var(--color-ok)' : 'var(--cds-chart-muted)'))});
  });

  document.querySelectorAll('#quiz-comparar').forEach((b) => b.addEventListener('click', () => {
    const m = actual();
    const c = elegido();
    if (!m || !c || q.visto) return;
    q.visto = true;
    q.jugadas += 1;
    if (evaluar(m, c).pct > 50) q.ganadas += 1;
    dibujar();
    actualizarBoton();
  }));
  document.querySelectorAll('#quiz-otra').forEach((b) => b.addEventListener('click', () => {
    q.i = (q.i ?? 0) + 1 + Math.floor(Math.random() * 5);
    q.nivel = null; q.palo = null; q.visto = false;
    dibujar();
    actualizarBoton();
    window.scrollTo({top: 0});
  }));
  actualizarBoton();
})();
