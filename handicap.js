// Pestaña Handicap: el handicap de la Federación contra los resultados del club
(() => {
  const {fmt, filas, lindo, listaBarras, verJugador, tooltip, ejeY, anchoTexto, estiloEje} = window.bv;
  const NIVELES = ['0 a 2', '3 y 4', '5 y 6', '7 a 9'];
  const MIN_LISTA = 30;
  const uno = d3.format('.1f');
  const signo = d3.format('+.2f');
  const resumen = () => (filas('handicap_resumen') || [])[0];
  const analizados = () => (filas('handicap_jugadores') || []).filter((r) => r.analizado);

  dash.draw('hc-cifras', (el) => {
    const r = resumen();
    if (!r) { el.replaceChildren(); return; }
    el.replaceChildren(...[
      [`${uno(-r.pendiente)}%`, 'menos de resultado por cada punto de handicap'],
      [`${fmt.int(r.victorias_0a2)}%`, `de las victorias son de handicap 0 a 2, que son el ${fmt.int(r.jugadores_0a2)}% de los jugadores`],
      [`${fmt.int(r.analizados)}`, `jugadores analizados, de ${fmt.int(r.lista)} en la lista de la Federación`],
    ].map(([cifra, texto]) => {
      const c = document.createElement('div');
      c.className = 'bv-mt-cifra';
      const b = document.createElement('b');
      b.textContent = cifra;
      const s = document.createElement('span');
      s.textContent = texto;
      c.append(b, s);
      return c;
    }));
  });

  // un punto por jugador; la raya es el promedio de cada handicap
  dash.draw('hc-puntos', (el) => {
    el.replaceChildren();
    const datos = analizados();
    const grupos = filas('handicap_grupos') || [];
    if (!datos.length || !grupos.length) return;
    const W = el.clientWidth || 720, H = 340, mb = 42;
    const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img')
      .attr('aria-label', '% ajustado de cada jugador según su handicap');
    const y = d3.scaleLinear([Math.floor(d3.min(datos, (r) => r.pct) / 5) * 5, Math.ceil(d3.max(datos, (r) => r.pct) / 5) * 5], [H - mb, 10]);
    const ml = anchoTexto(svg, y.domain()[1] + '%') + 10;
    const x = d3.scaleBand(d3.range(0, 10), [ml + 4, W - 8]).padding(.18);
    ejeY(svg, y, ml, W - 8, (v) => v + '%');
    svg.append('g').attr('transform', `translate(0,${H - mb})`).call(d3.axisBottom(x).tickSizeOuter(0)).call(estiloEje);
    svg.append('text').attr('x', (ml + W) / 2).attr('y', H - 6).attr('text-anchor', 'middle').attr('fill', 'var(--color-fg-muted)')
      .attr('font-size', 'var(--cds-font-size-caption)').text('Handicap');
    const puntos = datos.map((r) => {
      let h = 0;
      for (const c of r.jugador) h = (h * 31 + c.charCodeAt(0)) % 997;      // separa los puntos, siempre igual
      return {...r, px: x(r.handicap) + x.bandwidth() * (.12 + .76 * h / 997), py: y(r.pct)};
    });
    svg.append('g').selectAll('circle').data(puntos).join('circle')
      .attr('cx', (r) => r.px).attr('cy', (r) => r.py).attr('r', 4).attr('fill', dash.colors[0]).attr('fill-opacity', .62)
      .attr('stroke', 'var(--color-panel)').attr('stroke-width', 1);
    svg.append('g').selectAll('line').data(grupos).join('line')
      .attr('x1', (g) => x(g.handicap)).attr('x2', (g) => x(g.handicap) + x.bandwidth()).attr('y1', (g) => y(g.pct)).attr('y2', (g) => y(g.pct))
      .attr('stroke', 'var(--color-fg)').attr('stroke-width', 2.5).attr('stroke-linecap', 'round');
    const tip = tooltip(el);
    const marca = svg.append('circle').attr('r', 7).attr('fill', 'none').attr('stroke', 'var(--color-fg)').attr('stroke-width', 2).style('opacity', 0);
    let actual = null;
    svg.append('rect').attr('x', ml).attr('y', 0).attr('width', W - ml).attr('height', H - mb).attr('fill', 'transparent').style('cursor', 'pointer')
      .on('pointermove', (ev) => {
        const [mx, my] = d3.pointer(ev);
        actual = d3.least(puntos, (r) => (r.px - mx) ** 2 + (r.py - my) ** 2);
        marca.attr('cx', actual.px).attr('cy', actual.py).style('opacity', 1);
        tip.show([lindo(actual.jugador), `Handicap ${actual.handicap} · ${fmt.pct(actual.pct)} · ${fmt.int(actual.torneos)} torneos`],
                 actual.px / W * el.clientWidth, actual.py / H * el.clientHeight);
      })
      .on('pointerleave', () => { tip.hide(); marca.style('opacity', 0); })
      .on('click', () => { if (actual) verJugador(actual.jugador); });
  });

  dash.draw('hc-victorias', (ol) => {
    const g = filas('handicap_grupos') || [];
    listaBarras(ol, g.map((r) => ({nombre: `Handicap ${r.handicap}`, valor: r.pct_victoria, texto: `${uno(r.pct_victoria)}% de sus torneos`, etiquetaRank: String(r.handicap)})),
                {dominio: [0, d3.max(g, (r) => r.pct_victoria) || 1], medallas: false});
  });

  dash.draw('hc-cruces', (el) => {
    const c = filas('handicap_cruces') || [];
    if (!c.length) { el.replaceChildren(); return; }
    const t = document.createElement('table');
    t.className = 'bv-table bv-cruces';
    const cab = document.createElement('tr');
    ['Tu pareja ↓ · Rival →', ...NIVELES].forEach((x) => { const th = document.createElement('th'); th.textContent = x; cab.appendChild(th); });
    t.appendChild(cab);
    NIVELES.forEach((g) => {
      const tr = document.createElement('tr');
      const th = document.createElement('td');
      th.textContent = `Handicap ${g}`;
      tr.appendChild(th);
      NIVELES.forEach((r) => {
        const v = c.find((x) => x.grupo === g && x.rival === r);
        const td = document.createElement('td');
        td.textContent = v ? `${uno(v.pct)}%` : '—';
        if (v) {
          td.title = `${fmt.int(v.manos)} manos`;
          const fuerza = Math.min(40, Math.abs(v.pct - 50) * 3);
          td.style.background = `color-mix(in srgb, ${v.pct >= 50 ? dash.colors[0] : dash.colors[4]} ${fuerza}%, transparent)`;
        }
        tr.appendChild(td);
      });
      t.appendChild(tr);
    });
    el.replaceChildren(t);
  });

  dash.draw('hc-tabla', (tb) => {
    const g = filas('handicap_grupos') || [];
    tb.replaceChildren(...g.map((r) => {
      const tr = document.createElement('tr');
      [r.handicap, fmt.int(r.jugadores), `${uno(r.pct)}%`, `${uno(r.pct_podio)}%`, `${uno(r.cumple)}%`, signo(r.bazas_declarando), signo(r.bazas_defendiendo), `${uno(r.slams)}%`, fmt.int(r.torneos_historicos)]
        .forEach((v) => { const td = document.createElement('td'); td.textContent = v; tr.appendChild(td); });
      return tr;
    }));
  });

  // sin números de puesto: en esta pestaña un número solo puede ser un handicap
  const filaRinde = (x, como, tope) => {
    const tr = document.createElement('tr');
    const nombre = document.createElement('td');
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'bv-hc-nombre';
    boton.textContent = lindo(x.jugador);
    boton.addEventListener('click', () => verJugador(x.jugador));
    // la barra da el orden: cuánto se aleja de lo esperado para su handicap
    const barra = document.createElement('div');
    barra.className = 'bv-hc-barra';
    const riel = document.createElement('span');
    riel.className = 'bv-hc-riel';
    const relleno = document.createElement('i');
    relleno.style.width = `${Math.max(4, Math.abs(x.dif) / tope * 100)}%`;
    relleno.style.background = dash.colors[0];
    riel.appendChild(relleno);
    const dif = document.createElement('b');
    dif.textContent = `${fmt.dif(x.dif)}%`;
    barra.append(riel, dif);
    const detalle = document.createElement('span');
    detalle.className = 'bv-hc-detalle';
    detalle.textContent = `Promedia ${fmt.pct(x.pct)}, se esperaba ${fmt.pct(x.esperado)}`;
    nombre.append(boton, barra, detalle);
    const hc = document.createElement('td');
    hc.textContent = String(x.handicap);
    const rinde = document.createElement('td');
    rinde.className = 'bv-hc-rinde';
    rinde.textContent = como;
    tr.append(nombre, hc, rinde);
    return tr;
  };
  // handicap que le correspondería por sus resultados, en entero salvo que redondeado no cambie
  const rindeComo = (x, pendiente) => {
    const v = x.handicap + x.dif / pendiente;
    if (v > 9) return '9+';
    const r = Math.max(0, Math.round(v));
    return r === x.handicap ? uno(Math.max(0, v)) : String(r);
  };

  // misma escala en las dos tablas, para que las barras se puedan comparar
  const topeDif = () => d3.max(analizados().filter((x) => x.torneos >= MIN_LISTA), (x) => Math.abs(x.dif)) || 1;

  dash.draw('hc-sobre', (tb) => {
    const r = resumen();
    if (!r) { tb.replaceChildren(); return; }
    const sel = analizados().filter((x) => x.torneos >= MIN_LISTA && x.dif > 0).sort((a, b) => b.dif - a.dif).slice(0, 10);
    tb.replaceChildren(...sel.map((x) => filaRinde(x, rindeComo(x, r.pendiente), topeDif())));
  });

  // sin rojo: es una lectura de sus resultados recientes, no un juicio
  dash.draw('hc-exigente', (tb) => {
    const r = resumen();
    if (!r) { tb.replaceChildren(); return; }
    const sel = analizados().filter((x) => x.torneos >= MIN_LISTA && x.dif < 0).sort((a, b) => a.dif - b.dif).slice(0, 10);
    tb.replaceChildren(...sel.map((x) => filaRinde(x, rindeComo(x, r.pendiente), topeDif())));
  });

  dash.draw('hc-dias', (ol) => {
    const d = (filas('handicap_dias') || []).slice().sort((a, b) => a.handicap - b.handicap);
    listaBarras(ol, d.map((x) => ({nombre: x.dia, etiquetaRank: x.dia.slice(0, 2), valor: x.handicap, texto: `${d3.format('.2f')(x.handicap)} promedio`})), {dominio: [0, 9], medallas: false});
  });
})();
