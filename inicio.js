// Pestaña Inicio: historias, temporadas, avances por año y curiosidades
(() => {
  const {fmt, filas, lindo, nombreTorneo, listaBarras, verJugador, anios} = window.bv;
  // cada grupo es un palo
  const GRUPOS = {
    dominio: {palo: '♠', color: () => dash.colors[0]},
    parejas: {palo: '♥', color: () => dash.colors[4]},
    estilos: {palo: '♦', color: () => dash.colors[1]},
    manos: {palo: '♣', color: () => dash.colors[3]},
    club: {palo: 'ST', color: () => dash.colors[2]},
    asistencia: {palo: '', color: () => dash.colors[5]},
    genero: {palo: '', color: () => dash.colors[4]},
  };

  const tarjeta = (h, conPalo) => {
    const g = GRUPOS[h.grupo] || GRUPOS.club;
    const card = document.createElement('article');
    card.className = 'bv-feature';
    card.style.setProperty('--g', g.color());
    const crear = (clase, texto) => { const e = document.createElement('div'); e.className = clase; e.textContent = texto; return e; };
    if (conPalo) card.appendChild(crear('bv-f-palo', g.palo));
    card.append(crear('bv-f-cifra', h.cifra), crear('bv-f-unidad', h.unidad), crear('bv-f-titulo', h.titulo), crear('bv-f-detalle', h.detalle));
    if (h.jugador) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'bv-linkbtn';
      b.textContent = 'Ver ficha';
      b.addEventListener('click', () => verJugador(h.jugador));
      card.appendChild(b);
    }
    return card;
  };

  const celda = (tag, clase, texto) => { const e = document.createElement(tag); if (clase) e.className = clase; e.textContent = texto; return e; };

  // historia de Inicio: cartulina de subasta con el palo en su color real, en orden ♠ ♥ ♦ ♣ ST
  const historia = (h, principal) => {
    const palo = (GRUPOS[h.grupo] || {}).palo;
    const a = document.createElement('article');
    a.className = principal ? 'bv-historia-top' : 'bv-historia';
    const envolver = (clase, hijos) => { const d = document.createElement('div'); d.className = clase; d.append(...hijos); return d; };
    const txt = [celda('div', 'bv-h-titulo', h.titulo), celda('div', 'bv-h-detalle', h.detalle)];
    if (h.jugador) {
      const b = celda('button', 'bv-linkbtn', 'Ver ficha');
      b.type = 'button';
      b.addEventListener('click', () => verJugador(h.jugador));
      txt.push(b);
    }
    if (palo) {
      const bid = celda('div', 'bv-bid' + ('♥♦'.includes(palo) ? ' bv-rojo-palo' : ''), palo);
      bid.setAttribute('aria-hidden', 'true');
      a.appendChild(bid);
    }
    a.append(envolver('bv-h-num', [celda('div', 'bv-h-cifra', h.cifra), celda('div', 'bv-h-unidad', h.unidad)]), envolver('bv-h-txt', txt));
    return a;
  };

  // la mesa de la portada: la pareja ganadora de cada línea, sentada en su lugar
  const sinTildes = (t) => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  dash.draw('mesa', (el) => {
    const rows = filas('ultimo_podio'), t = (filas('ultimo_torneo') || [])[0];
    if (!rows || !rows.length || !t) { el.replaceChildren(); return; }
    const lineas = d3.groups(rows, (r) => r.linea);
    const ganador = (v) => v.find((r) => r.posicion === 1) || v[0];
    const dos = lineas.length > 1;
    const [pa, pb] = dos ? lineas.slice(0, 2).map(([, v]) => ganador(v)) : lineas[0][1].slice(0, 2);
    const [la, lb] = dos ? lineas.slice(0, 2).map(([l]) => l) : ['1.º', '2.º'];
    const jugadores = filas('jugadores') || [];
    const asiento = (letra, nombre) => {
      const j = jugadores.find((r) => sinTildes(r.jugador) === sinTildes(nombre));
      const e = document.createElement(j ? 'button' : 'div');
      e.className = 'bv-asiento bv-a-' + letra.toLowerCase();
      if (j) { e.type = 'button'; e.addEventListener('click', () => verJugador(j.jugador)); }
      e.append(celda('i', '', letra), celda('span', '', nombre || '—'));
      return e;
    };
    const [n, s] = pa ? pa.pareja.split(' / ') : [];
    const [e, o] = pb ? pb.pareja.split(' / ') : [];
    const centro = celda('div', 'bv-tapete', '');
    centro.append(celda('b', '', nombreTorneo(t.torneo)), celda('span', '', t.fecha));
    if (pa) centro.appendChild(celda('span', '', `${la}: ${fmt.pct(pa.porcentaje)}`));
    if (pb) centro.appendChild(celda('span', '', `${lb}: ${fmt.pct(pb.porcentaje)}`));
    el.replaceChildren(asiento('N', n), asiento('O', o), centro, asiento('E', e), asiento('S', s));
  });

  dash.draw('ultimo-titulo', (el) => {
    const r = (filas('ultimo_torneo') || [])[0];
    el.textContent = r ? nombreTorneo(r.torneo) : '—';
  });
  dash.draw('ultimo-sub', (el) => {
    const r = (filas('ultimo_torneo') || [])[0];
    el.textContent = r ? `${r.fecha}, con ${fmt.int(r.parejas)} parejas y ${fmt.int(r.manos)} manos` : '—';
  });
  dash.draw('ultimo-podio', (el) => {
    const rows = filas('ultimo_podio');
    if (!rows) { el.replaceChildren(); return; }
    el.replaceChildren(...d3.groups(rows, (r) => r.linea).map(([linea, v]) => {
      const col = document.createElement('div');
      col.className = 'bv-podio';
      col.appendChild(celda('h3', '', linea === 'General' ? 'Clasificación' : `Línea ${linea}`));
      v.forEach((r) => {
        const f = document.createElement('div');
        f.className = 'bv-puesto bv-p' + r.posicion;
        f.append(celda('span', 'bv-rank bv-m' + r.posicion, String(r.posicion)), celda('span', 'bv-puesto-nombre', r.pareja), celda('span', 'bv-puesto-pct', fmt.pct(r.porcentaje)));
        col.appendChild(f);
      });
      return col;
    }));
  });
  dash.draw('ultimo-datos', (el) => {
    const rows = filas('ultimo_datos');
    if (!rows) { el.replaceChildren(); return; }
    el.replaceChildren(...rows.map((r) => {
      const c = document.createElement('div');
      c.className = 'bv-dato';
      c.append(celda('span', '', r.etiqueta), celda('b', '', r.cifra), celda('small', '', r.detalle));
      return c;
    }));
  });
  dash.draw('en-forma', (el) => {
    const rows = filas('en_forma');
    if (!rows || !rows.length) { el.replaceChildren(); return; }
    // los honores del palo: A K Q J 10
    const HONORES = ['A', 'K', 'Q', 'J', '10'];
    const mano = document.createElement('ol');
    mano.className = 'bv-mano';
    mano.append(...rows.slice(0, 5).map((r, i) => {
      const li = document.createElement('li');
      const b = celda('button', 'bv-carta', '');
      b.type = 'button';
      b.setAttribute('aria-label', `Puesto ${i + 1}: ${lindo(r.jugador)}, ${fmt.pct(r.pct)}. Ver ficha.`);
      const indice = celda('span', 'bv-c-i', HONORES[i]);
      indice.appendChild(celda('i', '', '♥'));
      if (i === 0) { const as = celda('span', 'bv-c-as', '♥'); as.setAttribute('aria-hidden', 'true'); b.appendChild(as); }
      b.append(indice, celda('span', 'bv-c-nombre', lindo(r.jugador)), celda('span', 'bv-c-pct', fmt.pct(r.pct)));
      b.addEventListener('click', () => verJugador(r.jugador));
      li.appendChild(b);
      return li;
    }));
    el.replaceChildren(mano);
  });

  dash.draw('inicio-destacados', (el) => {
    const destacados = (filas('hallazgos') || []).filter((h) => h.destacado);
    el.replaceChildren(...destacados.map((h, i) => historia(h, i === 0)));
  });
  dash.draw('inicio-grupo', (el) => {
    const rows = filas('hallazgos');
    el.replaceChildren(...(rows || []).filter((h) => h.grupo === el.dataset.grupo && !h.destacado).map((h) => tarjeta(h, false)));
  });

  dash.draw('inicio-temporadas', (el) => {
    const rows = filas('campeones_anio');
    if (!rows) { el.replaceChildren(); return; }
    const ultimo = anios()[anios().length - 1];
    const premio = (label, nombre, extra) => {
      if (!nombre) return null;
      const d = document.createElement('div');
      d.className = 'bv-premio';
      d.append(celda('span', '', extra ? `${label}: ${extra}` : label), celda('b', '', lindo(nombre)));
      return d;
    };
    const principal = (label, nombre, pct) => {
      const d = document.createElement('div');
      d.className = 'bv-anio-p';
      d.append(celda('span', '', `${label}: ${fmt.pct(pct)}`), celda('b', '', lindo(nombre)));
      return d;
    };
    el.replaceChildren(...rows.slice().sort((a, b) => b.anio.localeCompare(a.anio)).map((r) => {
      const fila = document.createElement('details');
      fila.className = 'bv-anio';
      const s = document.createElement('summary');
      const n = celda('div', 'bv-anio-n', r.anio);
      if (r.anio === ultimo) n.appendChild(celda('small', '', 'en curso'));
      s.append(n, principal('Campeón', r.campeon, r.campeon_pct), principal('Mejor pareja', r.pareja, r.pareja_pct), celda('span', 'bv-anio-ver', 'Ver más'));
      const detalle = document.createElement('div');
      detalle.className = 'bv-anio-detalle';
      detalle.append(...[
        premio('Más victorias', r.ganador, `${r.victorias} torneos`),
        premio('Más torneos', r.activo, `${r.activo_torneos} jugados`),
        premio('Mayor mejora', r.mejora, r.mejora_pts == null ? '' : d3.format('+.1f')(r.mejora_pts) + ' puntos'),
        premio('Mejor novato', r.novato, r.novato_pct == null ? '' : fmt.pct(r.novato_pct)),
      ].filter(Boolean));
      fila.append(s, detalle);
      return fila;
    }));
  });

  // gráfico chico por año: barras desde cero para cantidades, línea para tasas
  dash.draw('mini', (el) => {
    el.replaceChildren();
    const rows = filas(el.dataset.datos || 'resumen_anio');
    if (!rows) return;
    const datos = rows.filter((r) => r.anio !== 'todos').sort((a, b) => a.anio.localeCompare(b.anio));
    const campo = el.dataset.campo, f = fmt[el.dataset.fmt] || fmt.texto, color = dash.colors[Number(el.dataset.color)];
    const W = el.clientWidth || 240, H = 130, mt = 20, mb = 20;
    const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img');
    const x = d3.scaleBand(datos.map((r) => r.anio), [4, W - 4]).padding(0.28);
    const etiqueta = (sel, ty) => sel.attr('text-anchor', 'middle').attr('fill', 'var(--color-fg)')
      .attr('font-size', 'var(--cds-font-size-caption)').attr('x', (r) => x(r.anio) + x.bandwidth() / 2).attr('y', ty).text((r) => f(r[campo]));
    svg.append('g').selectAll('text').data(datos).join('text').attr('text-anchor', 'middle').attr('fill', 'var(--color-fg-muted)')
      .attr('font-size', 'var(--cds-font-size-caption)').attr('x', (r) => x(r.anio) + x.bandwidth() / 2).attr('y', H - 4).text((r) => "'" + r.anio.slice(2));
    if (el.dataset.tipo === 'barras') {
      const y = d3.scaleLinear([0, d3.max(datos, (r) => r[campo])], [H - mb, mt]);
      svg.append('g').selectAll('rect').data(datos).join('rect').attr('x', (r) => x(r.anio)).attr('width', x.bandwidth())
        .attr('y', (r) => y(r[campo])).attr('height', (r) => y(0) - y(r[campo])).attr('rx', 4).attr('fill', color);
      svg.append('g').selectAll('text').data(datos).join('text').call(etiqueta, (r) => y(r[campo]) - 5);
    } else {
      const ext = d3.extent(datos, (r) => r[campo]);
      const pad = (ext[1] - ext[0]) * 0.35 || 1;
      const y = d3.scaleLinear([ext[0] - pad, ext[1] + pad], [H - mb, mt]);
      const cx = (r) => x(r.anio) + x.bandwidth() / 2;
      svg.append('path').datum(datos).attr('fill', 'none').attr('stroke', color).attr('stroke-width', 2.5)
        .attr('stroke-linejoin', 'round').attr('stroke-linecap', 'round').attr('d', d3.line().x(cx).y((r) => y(r[campo])));
      svg.append('g').selectAll('circle').data(datos).join('circle').attr('cx', cx).attr('cy', (r) => y(r[campo])).attr('r', 4).attr('fill', color);
      svg.append('g').selectAll('text').data(datos).join('text').call(etiqueta, (r) => y(r[campo]) - 9);
    }
  });

  dash.draw('inicio-dias', (ol) => {
    const rows = filas('dias_semana');
    if (!rows) { ol.replaceChildren(); return; }
    listaBarras(ol, rows.map((r) => ({
      etiquetaRank: r.dia.slice(0, 2), nombre: r.dia, valor: r.parejas_por_torneo, texto: fmt.dec(r.parejas_por_torneo),
      sub: `${fmt.int(r.torneos)} torneos`,
    })), {dominio: [0, d3.max(rows, (r) => r.parejas_por_torneo)], medallas: false, color: dash.colors[5]});
  });
})();
