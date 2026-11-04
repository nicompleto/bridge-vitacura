// Utilidades compartidas por todas las pestañas: window.bv
(() => {
  // mínimo de torneos (o manos) para entrar en un ranking, por período
  const MINIMOS = {
    jugador: {anio: 30, todos: 100},
    pareja: {anio: 15, todos: 40},
    declarante: {anio: 300, todos: 1000},
    estilo: {anio: 150, todos: 400},       // manos jugadas juntas
  };
  const fmt = {
    int: (v) => (v == null ? '—' : d3.format(',')(v)),
    compact: (v) => (v == null ? '—' : (v >= 10000 ? d3.format('.3~s')(v) : d3.format(',')(v))),
    pct: (v) => (v == null ? '—' : d3.format('.1f')(v) + '%'),
    dec: (v) => (v == null ? '—' : d3.format('.1f')(v)),
    dd: (v) => (v == null ? '—' : d3.format('+.2f')(v)),
    dif: (v) => (v == null ? '—' : d3.format('+.1f')(v)),
    dec2: (v) => (v == null ? '—' : d3.format('.2f')(v)),
    lugar: (v) => (v == null ? '—' : '#' + v),
    texto: (v) => (v == null ? '—' : String(v)),
  };
  const enc = (s) => String(s).replace(/%/g, '%25').replace(/&/g, '%26').replace(/=/g, '%3D');
  const filas = (id) => { const d = dash.data(id); return d.status === 'ok' ? d.data : null; };

  const anios = () => {
    const r = filas('resumen_anio');
    return r ? r.map((x) => x.anio).filter((a) => a !== 'todos').sort() : [];
  };
  const anio = () => {
    const a = anios();
    const p = dash.params().anio;
    if (p === 'todos' || a.includes(p)) return p;
    return a.length ? a[a.length - 1] : null;
  };
  const etiqueta = (a) => (a === 'todos' ? 'Histórico' : a);
  const minimo = (tipo) => MINIMOS[tipo][anio() === 'todos' ? 'todos' : 'anio'];

  // 'JOSE DE LA MAZA' -> 'Jose de la Maza'
  const lindo = (s) => (s == null ? '—' : String(s).toLowerCase()
    .replace(/(^|[\s.\-/])(\p{L})/gu, (m, a, b) => a + b.toUpperCase())
    .replace(/ (De|La|Del|Las|Los)(?= )/g, (m) => m.toLowerCase()));

  const jugadorActual = () => {
    const rows = filas('jugadores');
    const p = dash.params().jugador;
    if (!rows || !rows.length) return null;
    return rows.some((r) => r.jugador === p) ? p : rows[0].jugador;
  };

  const irA = (tab) => {
    document.querySelectorAll('.bv-tab').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
    document.querySelectorAll('.bv-page').forEach((s) => { s.hidden = s.id !== tab; });
    // el selector de año solo tiene sentido en las pestañas que cambian con el año
    document.querySelectorAll('.bv-chips').forEach((c) => { c.hidden = ['inicio', 'jugador', 'juveniles', 'dias-semana'].includes(tab) && c.dataset.draw === 'anios'; });
    dash.setLink(tab);
  };
  const verJugador = (nombre) => { dash.setParams({jugador: nombre}); irA('jugador'); window.scrollTo({top: 0}); };

  // Lista de barras horizontales. items: {nombre, valor, texto, sub, clic?}
  const listaBarras = (ol, items, {dominio, color, medallas = true, colores} = {}) => {
    if (!items.length) { ol.replaceChildren(); return; }
    const vals = items.map((i) => i.valor);
    const [lo, hi] = dominio || [Math.min(0, d3.min(vals)), d3.max(vals)];
    const ancho = (v) => Math.max(2, Math.min(100, ((v - lo) / ((hi - lo) || 1)) * 100));
    ol.replaceChildren(...items.map((it, i) => {
      const li = document.createElement('li');
      const rank = document.createElement('span');
      rank.className = 'bv-rank' + (medallas && i < 3 ? ' bv-m' + (i + 1) : '');
      rank.textContent = it.etiquetaRank ?? String(i + 1);
      const body = document.createElement('div');
      body.className = 'bv-bar-body';
      const top = document.createElement('div');
      top.className = 'bv-bar-top';
      const name = document.createElement('span');
      name.className = 'bv-bar-name' + (it.clic ? ' bv-link' : '');
      name.textContent = it.nombre;
      if (it.clic) {
        name.tabIndex = 0;
        name.setAttribute('role', 'button');
        name.addEventListener('click', it.clic);
        name.addEventListener('keydown', (e) => { if (e.key === 'Enter') it.clic(); });
      }
      const val = document.createElement('span');
      val.className = 'bv-bar-val';
      val.textContent = it.texto;
      top.append(name, val);
      const track = document.createElement('div');
      track.className = 'bv-track';
      const fill = document.createElement('div');
      fill.className = 'bv-fill';
      fill.style.width = ancho(it.valor) + '%';
      fill.style.background = (colores && colores[i]) || color || dash.colors[0];
      track.appendChild(fill);
      body.append(top, track);
      if (it.sub) {
        const sub = document.createElement('span');
        sub.className = 'bv-bar-sub';
        sub.textContent = it.sub;
        body.appendChild(sub);
      }
      li.append(rank, body);
      return li;
    }));
  };

  // Mancuernas: valor anterior -> valor actual. items: {nombre, antes, ahora, texto, sub, clic?}
  const mancuernas = (ol, items, colorAhora) => {
    if (!items.length) { ol.replaceChildren(); return; }
    const lo = Math.floor(d3.min(items, (i) => Math.min(i.antes, i.ahora)) - 1);
    const hi = Math.ceil(d3.max(items, (i) => Math.max(i.antes, i.ahora)) + 1);
    const x = (v) => ((v - lo) / (hi - lo)) * 100;
    ol.replaceChildren(...items.map((it, i) => {
      const li = document.createElement('li');
      const rank = document.createElement('span');
      rank.className = 'bv-rank' + (i < 3 ? ' bv-m' + (i + 1) : '');
      rank.textContent = String(i + 1);
      const body = document.createElement('div');
      body.className = 'bv-bar-body';
      const top = document.createElement('div');
      top.className = 'bv-bar-top';
      const name = document.createElement('span');
      name.className = 'bv-bar-name' + (it.clic ? ' bv-link' : '');
      name.textContent = it.nombre;
      if (it.clic) { name.tabIndex = 0; name.setAttribute('role', 'button'); name.addEventListener('click', it.clic); }
      const val = document.createElement('span');
      val.className = 'bv-bar-val';
      val.textContent = it.texto;
      top.append(name, val);
      const db = document.createElement('div');
      db.className = 'bv-db';
      const line = document.createElement('div');
      line.className = 'bv-db-line';
      line.style.left = x(Math.min(it.antes, it.ahora)) + '%';
      line.style.width = Math.abs(x(it.ahora) - x(it.antes)) + '%';
      const d1 = document.createElement('div');
      d1.className = 'bv-db-dot';
      d1.style.left = x(it.antes) + '%';
      d1.style.background = 'var(--cds-chart-muted)';
      const d2 = document.createElement('div');
      d2.className = 'bv-db-dot';
      d2.style.left = x(it.ahora) + '%';
      d2.style.background = colorAhora;
      db.append(line, d1, d2);
      const sub = document.createElement('span');
      sub.className = 'bv-bar-sub';
      sub.textContent = it.sub;
      body.append(top, db, sub);
      li.append(rank, body);
      return li;
    }));
  };

  const orden = {};
  const ordenar = (tabla, rows, porDefecto) => {
    const o = orden[tabla] || porDefecto;
    const s = rows.slice().sort((a, b) => {
      const x = a[o.col], y = b[o.col];
      if (x == null && y == null) return 0;
      if (x == null) return 1;
      if (y == null) return -1;
      return (typeof x === 'number' ? x - y : String(x).localeCompare(String(y), 'es')) * (o.dir === 'asc' ? 1 : -1);
    });
    document.querySelectorAll(`table[data-table="${tabla}"] th[data-sort]`).forEach((th) => {
      th.setAttribute('aria-sort', th.dataset.sort === o.col ? (o.dir === 'asc' ? 'ascending' : 'descending') : 'none');
    });
    return s;
  };
  const llenar = (tbody, rows, cols, extra) => {
    tbody.replaceChildren(...rows.map((r) => {
      const tr = document.createElement('tr');
      cols.forEach((c) => {
        const td = document.createElement('td');
        td.textContent = c.fmt ? c.fmt(r[c.f]) : (r[c.f] == null ? '—' : String(r[c.f]));
        if (c.cls) td.className = c.cls;
        tr.appendChild(td);
      });
      if (extra) extra(tr, r);
      return tr;
    }));
  };

  // Tooltip dentro de un gráfico
  const tooltip = (el) => {
    const tip = d3.select(el).append('div').attr('class', 'bv-tip').style('opacity', 0);
    return {
      show(lineas, px, py) {
        tip.selectAll('*').remove();
        lineas.forEach((t, i) => tip.append('div').attr('class', i === 0 ? 'bv-tip-date' : null).text(t));
        const bw = el.clientWidth, tw = tip.node().offsetWidth;
        tip.style('left', Math.max(0, Math.min(bw - tw, px - tw / 2)) + 'px').style('top', Math.max(0, py - 58) + 'px').style('opacity', 1);
      },
      hide() { tip.style('opacity', 0); },
    };
  };
  const ejeY = (svg, y, ml, W, fmtTick) => {
    svg.append('g').selectAll('line').data(y.ticks(5)).join('line')
      .attr('x1', ml).attr('x2', W).attr('y1', y).attr('y2', y).attr('stroke', 'var(--cds-chart-grid)');
    svg.append('g').selectAll('text').data(y.ticks(5)).join('text')
      .attr('x', ml - 6).attr('y', y).attr('dy', '0.32em').attr('text-anchor', 'end')
      .attr('fill', 'var(--color-fg-muted)').attr('font-size', 'var(--cds-font-size-caption)').text(fmtTick);
  };
  const anchoTexto = (svg, texto) => {
    const t = svg.append('text').attr('font-size', 'var(--cds-font-size-caption)').text(texto);
    const w = t.node().getComputedTextLength();
    t.remove();
    return Math.ceil(w);
  };
  const estiloEje = (g) => g.attr('font-size', null).attr('font-family', null)
    .call((s) => s.select('.domain').attr('stroke', 'var(--cds-chart-axis)'))
    .call((s) => s.selectAll('line').attr('stroke', 'var(--cds-chart-axis)'))
    .call((s) => s.selectAll('text').attr('fill', 'var(--color-fg-muted)').attr('font-size', 'var(--cds-font-size-caption)'));

  window.bv = {fmt, enc, lindo, filas, anios, anio, etiqueta, minimo, jugadorActual, irA, verJugador,
               listaBarras, mancuernas, ordenar, llenar, orden, tooltip, ejeY, anchoTexto, estiloEje};

  // ---------- pestañas ----------
  document.querySelectorAll('.bv-tab').forEach((b) => b.addEventListener('click', () => irA(b.dataset.tab)));
  if (['inicio', 'resumen', 'ranking', 'parejas', 'juveniles', 'dias-semana', 'jugador', 'estilo', 'cartas'].includes(location.hash.slice(1))) irA(location.hash.slice(1));

  // ---------- orden de tablas ----------
  document.querySelectorAll('table.bv-sortable').forEach((t) => {
    t.querySelectorAll('th[data-sort] button').forEach((btn) => btn.addEventListener('click', () => {
      const col = btn.parentElement.dataset.sort, tabla = t.dataset.table;
      const prev = orden[tabla];
      const texto = col === 'jugador' || col === 'pareja';
      orden[tabla] = {col, dir: prev && prev.col === col ? (prev.dir === 'desc' ? 'asc' : 'desc') : (texto ? 'asc' : 'desc')};
      dash.draw('tabla-' + tabla);
    }));
  });

  // ---------- selector de año y títulos ----------
  dash.draw('anios', (el) => {
    const a = anios();
    if (!a.length) { el.replaceChildren(); return; }
    const actual = anio();
    el.replaceChildren(...[...a, 'todos'].map((x) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'bv-chip';
      b.textContent = etiqueta(x);
      b.setAttribute('aria-pressed', String(x === actual));
      b.addEventListener('click', () => dash.setParams({anio: x}));
      return b;
    }));
  });
  dash.draw('anio-titulo', (el) => {
    const a = anio();
    if (!a) { el.textContent = '—'; return; }
    const r = filas('resumen_anio') || [];
    const ultimo = a === 'todos' ? null : r.find((x) => x.anio === a);
    el.textContent = a === 'todos' ? 'Histórico, desde ' + anios()[0] : a + (ultimo && a === anios()[anios().length - 1] ? ' (en curso)' : '');
  });
  dash.draw('umbral', (el) => { el.textContent = anio() ? String(minimo(el.dataset.tipo)) : '—'; });
  dash.draw('hist', (el) => {
    const r = (filas('resumen_anio') || []).find((x) => x.anio === 'todos');
    if (!r) { el.textContent = '—'; return; }
    el.dataset.where = 'anio=todos';
    el.textContent = fmt.int(r[el.dataset.field]);
  });
  dash.draw('hist-desde', (el) => { const a = anios(); el.textContent = a.length ? a[0] : '—'; });
  dash.draw('kpi-anio', (el) => {
    const a = anio();
    const r = (filas('resumen_anio') || []).find((x) => x.anio === a);
    if (!r) { el.textContent = '—'; return; }
    el.dataset.where = 'anio=' + enc(a);
    el.textContent = (fmt[el.dataset.fmt] || fmt.texto)(r[el.dataset.field]);
  });
})();
