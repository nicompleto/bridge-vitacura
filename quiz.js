// La mano del día, en Inicio: tu contrato contra lo que jugó el Club Vitacura en una mano real.
// Es la misma mano para todos durante el día y se juega una sola vez.
(() => {
  const {fmt, filas} = window.bv;
  const PALOS = [['T', '♣'], ['D', '♦'], ['C', '♥'], ['P', '♠'], ['S', 'ST']];
  const CLAVE = 'bv-mano-del-dia';
  const q = {id: null, nivel: null, palo: null, visto: false};

  // lo guardado es solo una comodidad de cada navegador: sin esto la página funciona igual
  const leer = () => { try { return JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch (e) { return {}; } };
  let guardado = leer();
  const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(guardado)); } catch (e) { /* sin almacenamiento */ } };

  const actual = () => {
    const m = filas('quiz') || [];
    if (!m.length) return null;
    const h = new Date();
    const mano = m[Math.floor(Date.UTC(h.getFullYear(), h.getMonth(), h.getDate()) / 864e5) % m.length];
    if (q.id !== mano.id) {
      q.id = mano.id;
      const c = guardado.id === mano.id ? guardado.contrato : null;
      q.visto = Boolean(c);
      q.nivel = c && c !== 'Paso' ? Number(c[0]) : null;
      q.palo = c ? (c === 'Paso' ? 'Paso' : c[1]) : null;
    }
    return mano;
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

  const actualizarBoton = () => {
    document.querySelectorAll('#quiz-comparar').forEach((b) => { b.disabled = !elegido() || q.visto; });
  };
  const botones = (el, items, activo, alElegir) => {
    el.replaceChildren(...items.map(([v, t]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'bv-chip';
      b.textContent = t;
      b.setAttribute('aria-pressed', String(v === activo));
      b.addEventListener('click', () => { alElegir(v); dibujar(); });
      return b;
    }));
    actualizarBoton();
  };

  dash.draw('quiz-nivel', (el) => { actual(); botones(el, [1, 2, 3, 4, 5, 6, 7].map((n) => [n, String(n)]), q.nivel, (v) => { q.nivel = v; if (q.palo === 'Paso') q.palo = null; }); });
  dash.draw('quiz-palo', (el) => { actual(); botones(el, [...PALOS, ['Paso', 'Paso']], q.palo, (v) => { q.palo = v; if (v === 'Paso') q.nivel = null; }); });

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
  // la mano del compañero queda oculta: solo se sabe lo que habría mostrado en el remate
  const pista = (cartas) => {
    const palos = cartas.split('.');
    const puntos = [...cartas].reduce((s, c) => s + ({A: 4, K: 3, Q: 2, J: 1}[c] || 0), 0);
    const largos = palos.map((c, i) => [c.length, '♠♥♦♣'[i]]).filter(([n]) => n >= 5).map(([, s]) => s);
    const parejo = !largos.length && palos.every((c) => c.length >= 2);
    const d = document.createElement('div');
    d.className = 'bv-quiz-mano bv-dorso';
    const h = document.createElement('h3');
    h.textContent = 'Tu compañero muestra';
    const b = document.createElement('b');
    b.textContent = `${Math.max(0, puntos - 1)} a ${puntos + 1} puntos`;
    const s = document.createElement('span');
    s.textContent = largos.length ? `5 o más cartas de ${largos.join(' y ')}` : parejo ? 'Mano pareja' : 'Sin palo largo';
    const n = document.createElement('small');
    n.textContent = 'Su mano se ve al comparar.';
    d.append(h, b, s, n);
    return d;
  };
  dash.draw('quiz-mano', (el) => {
    const m = actual();
    if (!m) { el.replaceChildren(); return; }
    const info = document.createElement('p');
    info.className = 'bv-quiz-info';
    info.textContent = `${m.vul ? 'Vulnerables' : 'No vulnerables'} · jugada el ${m.fecha}`;
    el.replaceChildren(mano('Tu mano', m.tu), q.visto ? mano('Tu compañero tenía', m.comp) : pista(m.comp), info);
  });

  dash.draw('quiz-marcador', (el) => { el.textContent = `Tú ${guardado.tu || 0} · Club ${guardado.club || 0}`; });

  const parrafo = (clase, t) => {
    const p = document.createElement('p');
    p.className = clase;
    p.textContent = t;
    return p;
  };
  dash.draw('quiz-resultado', (el) => {
    const m = actual();
    const c = elegido();
    document.querySelectorAll('#mano-dia').forEach((d) => d.classList.toggle('bv-jugada', q.visto));
    if (!m || !q.visto || !c) { el.replaceChildren(); return; }
    const r = evaluar(m, c);
    const veredicto = r.pct > 50 ? '¡Le ganaste al club!' : r.pct === 50 ? 'Empate con el club' : 'El club ganó esta';
    const detalle = c === 'Paso' ? 'Pasaste la mano: 0 puntos.'
      : `${texto(c)}: con juego perfecto se hacen ${r.bazas} bazas, ${r.bazas >= Number(c[0]) + 6 ? 'se cumple' : 'no se cumple'}, ${fmt.int(r.p)} puntos.`;
    const todos = [];
    for (let n = 1; n <= 7; n++) PALOS.forEach(([k]) => todos.push(`${n}${k}`));
    const top = todos.map((x) => ({x, s: evaluar(m, x).p})).sort((a, b) => b.s - a.s)[0];
    const mesas = document.createElement('div');
    mesas.className = 'bv-club-mesas';
    mesas.append(...m.club.split(',').map((x) => x.split(':')).map(([k, n]) => {
      const s = document.createElement('span');
      s.textContent = `${texto(k)} · ${n} ${n === '1' ? 'mesa' : 'mesas'}`;
      if (k === c) s.className = 'bv-tuyo';
      return s;
    }));
    el.replaceChildren(parrafo('bv-quiz-veredicto', `${veredicto} ${fmt.pct(r.pct)}`), parrafo('bv-sentence', detalle),
                       parrafo('bv-note', `Lo mejor posible era ${texto(top.x)} (${fmt.int(top.s)} puntos). En el club se jugó:`), mesas,
                       parrafo('bv-note', 'Mañana hay otra mano.'));
  });

  document.querySelectorAll('#quiz-comparar').forEach((b) => b.addEventListener('click', () => {
    const m = actual();
    const c = elegido();
    if (!m || !c || q.visto) return;
    q.visto = true;
    const gano = evaluar(m, c).pct > 50;
    guardado = {...guardado, id: m.id, contrato: c, tu: (guardado.tu || 0) + (gano ? 1 : 0), club: (guardado.club || 0) + (gano ? 0 : 1)};
    guardar();
    dibujar();
  }));
})();
