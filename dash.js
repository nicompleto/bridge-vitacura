// Reemplazo mínimo del entorno "dash" del dashboard de Claude, para publicar la página en
// cualquier hosting estático. Implementa solo lo que usan los scripts de pagina/:
// dash.data, dash.draw, dash.calc, dash.params / setParams, dash.setLink, dash.colors, dash.onData.
(() => {
  const PARAMS_INICIALES = {jugador: null, anio: null};
  const datos = {};        // id -> {status, data}
  const calcs = {};        // id -> {inputs, fn}
  const dibujos = {};      // nombre -> fn(el)
  const alCambiar = [];
  let params = {...PARAMS_INICIALES};
  let pendiente = false;
  const observador = new MutationObserver(() => programar());

  const visible = (el) => !el.closest('[hidden]');
  const correr = (nombre) => {
    const fn = dibujos[nombre];
    if (!fn) return;
    document.querySelectorAll(`[data-draw="${nombre}"]`).forEach((el) => {
      if (!visible(el)) return;
      try { fn(el); } catch (e) { console.error('Error dibujando', nombre, e); }
    });
  };
  const correrTodo = () => {
    pendiente = false;
    alCambiar.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
    Object.keys(dibujos).forEach(correr);
    observador.takeRecords();   // los cambios de hidden hechos por los dibujos no vuelven a disparar
  };
  const programar = () => {
    if (pendiente) return;
    pendiente = true;
    setTimeout(correrTodo, 0);   // no requestAnimationFrame: se pausa si la pestaña no está visible
  };

  // Cada conjunto de datos es un script (datos/<id>.js) que deja sus filas en window.__bvDatos.
  // Con <script> en vez de fetch, el sitio funciona también abriendo index.html con doble clic (file://).
  window.__bvDatos = window.__bvDatos || {};
  const cargar = (id) => {
    datos[id] = {status: 'loading', data: []};
    const s = document.createElement('script');
    s.src = `datos/${id}.js?v=${window.__bvVersion || ''}`;
    s.onload = () => {
      const filas = window.__bvDatos[id];
      datos[id] = Array.isArray(filas) ? {status: 'ok', data: filas} : {status: 'error', data: []};
      programar();
    };
    s.onerror = () => { datos[id] = {status: 'error', data: []}; console.error('No se pudo cargar', id); programar(); };
    document.head.appendChild(s);
  };

  const data = (id) => {
    if (calcs[id]) {
      const c = calcs[id];
      const entradas = c.inputs.map((i) => data(i));
      if (entradas.some((e) => e.status === 'error')) return {status: 'error', data: []};
      if (entradas.some((e) => e.status !== 'ok')) return {status: 'loading', data: []};
      if (!c.cache || c.cache.fuentes.some((f, i) => f !== entradas[i].data)) {
        c.cache = {fuentes: entradas.map((e) => e.data), valor: c.fn(...entradas.map((e) => e.data))};
      }
      return {status: 'ok', data: c.cache.valor};
    }
    if (!datos[id]) cargar(id);
    return datos[id];
  };

  window.dash = {
    data,
    calc: (id, def) => { calcs[id] = def; },
    draw: (nombre, fn) => {
      if (fn) {
        dibujos[nombre] = typeof fn === 'function' ? fn : (el) => fn.update(el, el.__montado || (el.__montado = fn.mount(el)));
      }
      correr(nombre);
    },
    onData: (fn) => { alCambiar.push(fn); fn(); },
    params: () => ({...params}),
    setParams: (cambios) => { params = {...params, ...cambios}; programar(); },
    resetParams: () => { params = {...PARAMS_INICIALES}; programar(); },
    setLink: (nombre) => { try { history.replaceState(null, '', '#' + nombre); } catch (e) { /* sin historial */ } },
    refresh: () => programar(),
    // colores de serie: valores fijos que se ven bien en tema claro y oscuro
    colors: ['#2f7d5b', '#3b6fb6', '#c08a1e', '#8a5fbf', '#c2553f', '#2a8f9c', '#b0487a', '#6b7a3a'],
  };

  // Al mostrar una pestaña (cambia el atributo hidden) o cambiar el ancho, se vuelve a dibujar
  observador.observe(document.documentElement, {subtree: true, attributes: true, attributeFilter: ['hidden']});
  let t;
  window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(programar, 150); });
})();
