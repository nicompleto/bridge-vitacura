// Pestaña Mi torneo: mano por mano de una pareja en uno de los últimos torneos
(() => {
  const {fmt, filas, lindo, buscador} = window.bv;
  const q = {torneo: null, pareja: null};
  const MAX_MANOS = 8;

  const parejas = () => filas('mi_torneo_parejas') || [];
  const torneos = () => {
    const vistos = new Map();
    parejas().forEach((r) => { if (!vistos.has(r.id_torneo)) vistos.set(r.id_torneo, r); });
    return [...vistos.values()];
  };
  const torneoActual = () => {
    const t = torneos();
    return t.some((r) => r.id_torneo === q.torneo) ? q.torneo : (t[0] && t[0].id_torneo);
  };
  const delTorneo = () => parejas().filter((r) => r.id_torneo === torneoActual());
  const parejaActual = () => {
    const p = delTorneo();
    return p.find((r) => r.pareja_nro === q.pareja) || p[0];
  };
  const redibujar = () => ['mt-torneo', 'mt-pareja', 'mt-cabecera', 'mt-resumen', 'mt-lista'].forEach((d) => dash.draw(d));
  const manos = () => {
    const p = parejaActual();
    return p ? (filas('mi_torneo_manos') || []).filter((r) => r.id_torneo === p.id_torneo && r.pareja_nro === p.pareja_nro) : [];
  };

  buscador('sugerencias-mt', '#buscar-mt', () => [...new Set(parejas().flatMap((r) => r.pareja.split(' / ')))].sort(), (n) => {
    const r = parejas().find((x) => x.pareja.split(' / ').includes(n));    // vienen del más reciente al más antiguo
    if (r) { q.torneo = r.id_torneo; q.pareja = r.pareja_nro; redibujar(); }
  });

  dash.draw('mt-torneo', (sel) => {
    sel.replaceChildren(...torneos().map((t) => new Option(`${t.fecha} · ${t.torneo}`, t.id_torneo)));
    sel.value = torneoActual() || '';
    sel.onchange = () => { q.torneo = sel.value; q.pareja = null; redibujar(); };
  });
  dash.draw('mt-pareja', (sel) => {
    const lista = delTorneo().slice().sort((a, b) => a.pareja.localeCompare(b.pareja, 'es'));
    sel.replaceChildren(...lista.map((p) => new Option(lindo(p.pareja), p.pareja_nro)));
    const p = parejaActual();
    sel.value = p ? String(p.pareja_nro) : '';
    sel.onchange = () => { q.pareja = Number(sel.value); redibujar(); };
  });

  dash.draw('mt-cabecera', (el) => {
    const p = parejaActual();
    if (!p) { el.replaceChildren(); return; }
    const izq = document.createElement('div');
    const h = document.createElement('h3');
    h.textContent = lindo(p.pareja);
    const s = document.createElement('p');
    s.className = 'bv-note';
    s.textContent = `${p.fecha} · ${p.torneo}${p.linea ? ' · línea ' + p.linea : ''}`;
    izq.append(h, s);
    const b = document.createElement('b');
    b.textContent = `${p.posicion ? p.posicion + '° lugar · ' : ''}${fmt.pct(p.porcentaje)}`;
    el.replaceChildren(izq, b);
  });

  dash.draw('mt-resumen', (el) => {
    const m = manos();
    if (!m.length) { el.replaceChildren(); return; }
    const cuenta = (t) => m.filter((r) => r.tipo === t).length;
    el.replaceChildren(...[
      ['B', 'manos muy buenas', 'var(--color-ok)'],
      ['M', 'para mejorar', 'var(--color-warn)'],
      ['S', 'de mala suerte', dash.colors[1]],
    ].map(([t, texto, color]) => {
      const c = document.createElement('div');
      c.className = 'bv-mt-cifra';
      c.style.setProperty('--g', color);
      const b = document.createElement('b');
      b.textContent = String(cuenta(t));
      const s = document.createElement('span');
      s.textContent = texto;
      c.append(b, s);
      return c;
    }));
  });

  dash.draw('mt-lista', (el) => {
    const t = el.dataset.tipo;
    const sel = manos().filter((r) => r.tipo === t).sort((a, b) => (t === 'B' ? b.pct - a.pct : a.pct - b.pct)).slice(0, MAX_MANOS);
    if (!sel.length) {
      const v = document.createElement('p');
      v.className = 'bv-note';
      v.textContent = manos().length ? 'Ninguna mano en este grupo.' : '';
      el.replaceChildren(v);
      return;
    }
    el.replaceChildren(...sel.map((r) => {
      const c = document.createElement('div');
      c.className = 'bv-mt-mano';
      const top = document.createElement('div');
      const a = document.createElement('span');
      a.textContent = `Mano ${r.mano} · ${r.jugada}`;
      const b = document.createElement('span');
      b.textContent = `${r.pct}%`;
      top.append(a, b);
      const razon = document.createElement('span');
      razon.textContent = r.razon;
      const club = document.createElement('small');
      club.textContent = `${r.puntaje == null ? '' : fmt.int(r.puntaje) + ' puntos · '}en el club: ${r.club}`;
      c.append(top, razon, club);
      return c;
    }));
  });
})();
