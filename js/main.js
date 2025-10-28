// js/main.js
// Usa: axios (peticiones) y dayjs (fechas)

// Tabla simple de interés según cuotas
const INTERES_POR_CUOTAS = {
  3: 0.05,
  6: 0.08,
  12: 0.12,
  24: 0.20
};

// --- ELEMENTOS DOM ---
const simuladorForm = document.getElementById('simuladorForm');
const nombreInput = document.getElementById('nombre');
const montoInput = document.getElementById('monto');
const cuotasSelect = document.getElementById('cuotas');
const resultadoContainer = document.getElementById('resultadoContainer');
const historialList = document.getElementById('historialList');
const limpiarBtn = document.getElementById('limpiarBtn');

// Cotizaciones
const dolarInfo = document.getElementById('dolarInfo');
const euroInfo = document.getElementById('euroInfo');

const tipoDolarSelect = document.getElementById('tipoDolar');
const pesosInput = document.getElementById('pesos');
const convertirBtn = document.getElementById('convertirBtn');
const conversionResultado = document.getElementById('conversionResultado');
const dolaresInput = document.getElementById('dolares');
const convertirAPesosBtn = document.getElementById('convertirAPesosBtn');
const conversionAPesosResultado = document.getElementById('conversionAPesosResultado');

const tipoEuroSelect = document.getElementById('tipoEuro');
const pesosEuroInput = document.getElementById('pesosEuro');
const convertirEuroBtn = document.getElementById('convertirEuroBtn');
const conversionEuroResultado = document.getElementById('conversionEuroResultado');
const eurosInput = document.getElementById('euros');
const convertirAEurosBtn = document.getElementById('convertirAEurosBtn');
const conversionAEurosResultado = document.getElementById('conversionAEurosResultado');

// --- LOCAL STORAGE ---
const STORAGE_KEY = 'simulaciones_v1';

// === FUNCIONES DE HISTORIAL ===
function guardarSimulacion(sim) {
  const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  arr.unshift(sim);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

function cargarHistorial() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function renderHistorial() {
  const arr = cargarHistorial();
  historialList.innerHTML = '';

  if (arr.length === 0) {
    historialList.innerHTML = '<li class="placeholder">No hay simulaciones guardadas.</li>';
    return;
  }

  arr.forEach((item, idx) => {
    const li = document.createElement('li');
    // No clase específica para el item: usamos los estilos del contenedor `.historialList`
    li.innerHTML = `
      <strong>${item.nombre}</strong> • ${item.cuotas} cuotas • Monto: $${Number(item.monto).toLocaleString()} 
      • cuota: $${Number(item.valorCuota).toFixed(2)} • total: $${Number(item.total).toFixed(2)}
      <div style="font-size:.9rem;color:var(--text-muted)">Fecha: ${item.fecha}</div>
      <button data-idx="${idx}" class="btn btn-secondary eliminar">Eliminar</button>
    `;
    historialList.appendChild(li);
  });

  // Seleccionamos los botones eliminar dentro del contenedor del historial
  document.querySelectorAll('#historialList .eliminar').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = Number(e.target.dataset.idx);
      borrarItem(idx);
    });
  });
}

function borrarItem(index) {
  const arr = cargarHistorial();
  arr.splice(index, 1);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  renderHistorial();
}

// === EXPORTAR HISTORIAL JSON ===
function exportarHistorialJSON() {
  const historial = cargarHistorial();
  if (!historial.length) {
    alert('No hay simulaciones para exportar.');
    return;
  }

  const fecha = dayjs().format('YYYY-MM-DD_HH-mm-ss');
  const nombreArchivo = `historial_simulaciones_${fecha}.json`;
  const blob = new Blob([JSON.stringify(historial, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  enlace.click();

  URL.revokeObjectURL(url);
}

// === AGREGAR BOTÓN DE EXPORTAR AL DOM ===
function agregarBotonExportar() {
  if (!document.getElementById('exportarBtn')) {
    const exportarBtn = document.createElement('button');
    exportarBtn.id = 'exportarBtn';
  exportarBtn.className = 'btn btn-primary';
    exportarBtn.textContent = 'Exportar historial (JSON)';
    exportarBtn.style.marginLeft = '0rem';
    limpiarBtn.insertAdjacentElement('afterend', exportarBtn);

    exportarBtn.addEventListener('click', exportarHistorialJSON);
  }
}

limpiarBtn.addEventListener('click', () => {
  if (confirm('¿Eliminar todo el historial?')) {
    localStorage.removeItem(STORAGE_KEY);
    renderHistorial();
    resultadoContainer.innerHTML = '<p class="placeholder">Historial eliminado.</p>';
  }
});

// === SIMULADOR ===
simuladorForm.addEventListener('submit', (e) => {
  e.preventDefault();
  calcularSimulacion();
});

function calcularSimulacion() {
  const nombre = nombreInput.value.trim();
  const monto = parseFloat(montoInput.value);
  const cuotas = parseInt(cuotasSelect.value, 10);

  if (!nombre || !monto || !cuotas) {
    alert('Completa todos los campos correctamente.');
    return;
  }

  const interes = INTERES_POR_CUOTAS[cuotas] ?? 0.15;
  const total = monto * (1 + interes);
  const valorCuota = total / cuotas;
  const fecha = dayjs().format('YYYY-MM-DD HH:mm:ss');

  const simulacion = { nombre, monto, cuotas, interes, total, valorCuota, fecha };
  guardarSimulacion(simulacion);
  renderResultado(simulacion);
  renderHistorial();
}

function renderResultado(sim) {
  resultadoContainer.innerHTML = `
    <div class="resultadoContainer">
      <p><strong>Simulación para:</strong> ${sim.nombre}</p>
      <p><strong>Monto solicitado:</strong> $${Number(sim.monto).toLocaleString()}</p>
      <p><strong>Cuotas:</strong> ${sim.cuotas}</p>
      <p><strong>Interés aplicado:</strong> ${(sim.interes * 100).toFixed(2)}%</p>
      <p><strong>Monto total a pagar:</strong> $${Number(sim.total).toFixed(2)}</p>
      <p><strong>Valor por cuota:</strong> $${Number(sim.valorCuota).toFixed(2)}</p>
      <p style="color:var(--text-muted);font-size:.9rem">Fecha: ${sim.fecha}</p>
    </div>
  `;
}

// === COTIZACIONES ===
async function obtenerCotizaciones() {
  try {
    const resUSD = await axios.get('https://open.er-api.com/v6/latest/USD');
    const resEUR = await axios.get('https://open.er-api.com/v6/latest/EUR');

    const ratesUSD = resUSD.data?.rates;
    const ratesEUR = resEUR.data?.rates;

    if (!ratesUSD || !ratesEUR) throw new Error('Datos incompletos');

    const usdToArs = ratesUSD.ARS;
    const eurToArs = ratesEUR.ARS;
    const usdToEur = ratesUSD.EUR;
    const eurToUsd = ratesEUR.USD;

    dolarInfo.innerHTML = `
      <p>Dólar (USD → ARS): <strong>${usdToArs.toFixed(2)}</strong></p>
      <p>USD → EUR: ${usdToEur.toFixed(4)}</p>
      <p style="color:var(--text-muted);font-size:.9rem">Actualizado: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}</p>
    `;

    euroInfo.innerHTML = `
      <p>Euro (EUR → ARS): <strong>${eurToArs.toFixed(2)}</strong></p>
      <p>EUR → USD: ${eurToUsd.toFixed(4)}</p>
      <p style="color:var(--text-muted);font-size:.9rem">Actualizado: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}</p>
    `;

    window._RATES = { usdToArs, eurToArs };
  } catch (err) {
    console.error('Error al obtener cotizaciones:', err);
    dolarInfo.innerHTML = '<p class="placeholder">No se pudo obtener la cotización del dólar.</p>';
    euroInfo.innerHTML = '<p class="placeholder">No se pudo obtener la cotización del euro.</p>';
  }
}

// === CONVERSIONES ===
convertirBtn.addEventListener('click', () => {
  const pesos = Number(pesosInput.value);
  const tipo = tipoDolarSelect.value;
  const { usdToArs } = window._RATES || {};

  if (!usdToArs) {
    alert('No hay cotización cargada.');
    return;
  }

  let tasa = usdToArs;
  if (tipo === 'blue') tasa *= 1; //Posible ajuste para controlar la ganancia

  const usd = pesos / tasa;
  conversionResultado.innerHTML = `<p>${pesos} ARS ≈ ${usd.toFixed(4)} USD (${tipo})</p>`;
});

convertirAPesosBtn.addEventListener('click', () => {
  const dolares = Number(dolaresInput.value);
  const tipo = tipoDolarSelect.value;
  const { usdToArs } = window._RATES || {};

  if (!usdToArs) {
    alert('No hay cotización cargada.');
    return;
  }

  let tasa = usdToArs;
  if (tipo === 'blue') tasa *= 1;
  const ars = dolares * tasa;
  conversionAPesosResultado.innerHTML = `<p>${dolares} USD ≈ ${ars.toFixed(2)} ARS (${tipo})</p>`;
});

// EURO
convertirEuroBtn.addEventListener('click', () => {
  const pesos = Number(pesosEuroInput.value);
  const tipo = tipoEuroSelect.value;
  const { eurToArs } = window._RATES || {};

  if (!eurToArs) {
    alert('No hay cotización del euro cargada.');
    return;
  }

  let tasa = eurToArs;
  if (tipo === 'blue') tasa *= 1;
  const eur = pesos / tasa;
  conversionEuroResultado.innerHTML = `<p>${pesos} ARS ≈ ${eur.toFixed(4)} EUR (${tipo})</p>`;
});

convertirAEurosBtn.addEventListener('click', () => {
  const euros = Number(eurosInput.value);
  const { eurToArs } = window._RATES || {};

  if (!eurToArs) {
    alert('No hay cotización del euro cargada.');
    return;
  }

  const ars = euros * eurToArs;
  conversionAEurosResultado.innerHTML = `<p>${euros} EUR ≈ ${ars.toFixed(2)} ARS</p>`;
});

// === INICIO ===
(function init() {
  agregarBotonExportar();
  renderHistorial();
  obtenerCotizaciones();
  setInterval(obtenerCotizaciones, 5 * 60 * 1000);
})();
