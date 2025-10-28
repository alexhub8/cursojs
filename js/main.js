const TASAS_INTERES = {
  3: 1.10,
  6: 1.25,
  12: 1.50,
  24: 2.00
};

const STORAGE_KEY = 'simulacionesPrestamo_v1';

function formatearMoneda(valor){
  return Number(valor).toLocaleString('es-AR', {minimumFractionDigits:2, maximumFractionDigits:2});
}

function leerHistorial(){
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function guardarHistorial(historial){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(historial));
}

function calcularPrestamo(monto, cuotas){
  const tasa = TASAS_INTERES[cuotas] ?? null;
  if(!tasa) throw new Error('Cantidad de cuotas inválida.');
  const montoFinal = monto * tasa;
  const valorCuota = montoFinal / cuotas;
  return { montoFinal: Number(montoFinal.toFixed(2)), valorCuota: Number(valorCuota.toFixed(2)), tasa };
}

const form = document.getElementById('simuladorForm');
const resultadoContainer = document.getElementById('resultadoContainer');
const historialList = document.getElementById('historialList');
const limpiarBtn = document.getElementById('limpiarBtn');

const exportarBtn = document.createElement('button');
exportarBtn.type = 'button';
exportarBtn.textContent = 'Exportar historial';
exportarBtn.id = 'exportarBtn';
document.querySelector('.actions').appendChild(exportarBtn);

function mostrarResultado(nombre, monto, cuotas, resultado){
  resultadoContainer.innerHTML = `
    <div class="resultado">
      <p><strong>${nombre}</strong>, solicitaste <strong>$${formatearMoneda(monto)}</strong> en <strong>${cuotas} cuotas</strong>.</p>
      <p class="smallMuted">Tasa aplicada: x${resultado.tasa} — Monto final: <strong>$${formatearMoneda(resultado.montoFinal)}</strong></p>
      <p><strong>Valor por cuota:</strong> $${formatearMoneda(resultado.valorCuota)}</p>
    </div>
  `;
}

function renderizarHistorial(){
  const historial = leerHistorial();
  historialList.innerHTML = '';
  if(historial.length === 0){
    historialList.innerHTML = '<li class="placeholder smallMuted">No hay simulaciones guardadas.</li>';
    return;
  }
  historial.forEach((sim, index) => {
    const li = document.createElement('li');
    li.className = 'histItem';
    li.dataset.index = index;
    li.innerHTML = `
      <div class="histMeta">
        <div><strong>${sim.nombre}</strong> — $${formatearMoneda(sim.monto)} / ${sim.cuotas} cuotas</div>
        <div class="smallMuted">Total: $${formatearMoneda(sim.montoFinal)} / cuota: $${formatearMoneda(sim.valorCuota)}</div>
      </div>
      <div class="histActions">
        <button class="removeBtn" data-index="${index}" title="Eliminar">Eliminar</button>
      </div>
    `;
    historialList.appendChild(li);
  });
}

function agregarSimulacionAlHistorial(simulacion){
  const historial = leerHistorial();
  historial.unshift(simulacion);
  guardarHistorial(historial);
  renderizarHistorial();
}

form.addEventListener('submit', function(event){
  event.preventDefault();
  try{
    const nombre = form.nombre.value.trim() || 'Anonimo';
    const monto = Number(form.monto.value);
    const cuotas = Number(form.cuotas.value);

    if(!nombre || isNaN(monto) || monto <= 0 || ![3,6,12,24].includes(cuotas)){
      resultadoContainer.innerHTML = '<p class="placeholder smallMuted">Por favor complete correctamente todos los campos.</p>';
      return;
    }

    const resultado = calcularPrestamo(monto, cuotas);
    mostrarResultado(nombre, monto, cuotas, resultado);

    const simulacion = {
      id: Date.now(),
      fecha: new Date().toISOString(),
      nombre,
      monto,
      cuotas,
      montoFinal: resultado.montoFinal,
      valorCuota: resultado.valorCuota,
      tasa: resultado.tasa
    };
    agregarSimulacionAlHistorial(simulacion);
    form.monto.value = '';
    form.cuotas.value = '';
  }catch(err){
    resultadoContainer.innerHTML = `<p class="placeholder smallMuted">Ocurrió un error: ${err.message}</p>`;
  }
});

historialList.addEventListener('click', function(e){
  const btn = e.target.closest('.removeBtn');
  if(!btn) return;
  const index = Number(btn.dataset.index);
  const historial = leerHistorial();
  if(index >= 0 && index < historial.length){
    historial.splice(index,1);
    guardarHistorial(historial);
    renderizarHistorial();
  }
});

limpiarBtn.addEventListener('click', function(){
  if(confirm('¿Eliminar todo el historial de simulaciones?')){
    localStorage.removeItem(STORAGE_KEY);
    renderizarHistorial();
    resultadoContainer.innerHTML = '<p class="placeholder smallMuted">Historial eliminado.</p>';
  }
});

exportarBtn.addEventListener('click', function(){
  const historial = leerHistorial();
  if(historial.length === 0){
    alert('No hay historial para exportar.');
    return;
  }
  const blob = new Blob([JSON.stringify(historial, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'historial.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

renderizarHistorial();

function ejecutarPruebas(){
  const pruebas = [];
  try{
    const r = calcularPrestamo(1000,3);
    if(r.montoFinal === 1100 && r.valorCuota === 366.67){
      pruebas.push('Prueba 1 OK');
    }else{
      pruebas.push('Prueba 1 FALLÓ');
    }
  }catch(e){
    pruebas.push('Prueba 1 ERROR: ' + e.message);
  }

  try{
    const h = leerHistorial();
    if(Array.isArray(h)){
      pruebas.push('Prueba 2 OK');
    }else{
      pruebas.push('Prueba 2 FALLÓ');
    }
  }catch(e){
    pruebas.push('Prueba 2 ERROR: ' + e.message);
  }

  const foot = document.querySelector('.foot');
  const ul = document.createElement('ul');
  ul.className = 'smallMuted';
  pruebas.forEach(p=>{
    const li = document.createElement('li');
    li.textContent = p;
    ul.appendChild(li);
  });
  foot.appendChild(ul);
}
// === COTIZACIÓN DEL DÓLAR ===
const dolarInfo = document.getElementById('dolarInfo');
const tipoDolarSelect = document.getElementById('tipoDolar');
const pesosInput = document.getElementById('pesos');
const convertirBtn = document.getElementById('convertirBtn');
const conversionResultado = document.getElementById('conversionResultado');

const dolaresInput = document.getElementById('dolares');
const convertirAPesosBtn = document.getElementById('convertirAPesosBtn');
const conversionAPesosResultado = document.getElementById('conversionAPesosResultado');

let cotizaciones = { oficial: 0, blue: 0 };

// Obtener cotizaciones desde dolarapi.com
async function obtenerCotizaciones() {
  try {
    const [oficialRes, blueRes] = await Promise.all([
      fetch('https://dolarapi.com/v1/dolares/oficial'),
      fetch('https://dolarapi.com/v1/dolares/blue')
    ]);

    const oficial = await oficialRes.json();
    const blue = await blueRes.json();

    cotizaciones.oficial = oficial.venta;
    cotizaciones.blue = blue.venta;

    dolarInfo.innerHTML = `
      <p><strong>Dólar Oficial:</strong> $${oficial.venta.toFixed(2)} ARS</p>
      <p><strong>Dólar Blue:</strong> $${blue.venta.toFixed(2)} ARS</p>
      <p class="smallMuted">Última actualización: ${new Date(oficial.fechaActualizacion).toLocaleString()}</p>
    `;
  } catch (error) {
    dolarInfo.innerHTML = `<p style="color:red;">No se pudieron obtener las cotizaciones.</p>`;
    console.error('Error al obtener las cotizaciones:', error);
  }
}

// Conversión de pesos a dólares
convertirBtn.addEventListener('click', () => {
  const pesos = parseFloat(pesosInput.value);
  const tipo = tipoDolarSelect.value;
  const cotizacion = cotizaciones[tipo];

  if (!cotizacion) {
    conversionResultado.innerHTML = `<p style="color:red;">Esperando cotizaciones...</p>`;
    return;
  }
  if (isNaN(pesos) || pesos <= 0) {
    conversionResultado.innerHTML = `<p style="color:red;">Ingresa un monto válido en pesos.</p>`;
    return;
  }

  const dolares = pesos / cotizacion;
  conversionResultado.innerHTML = `
    <p>${pesos.toFixed(2)} ARS equivalen a <strong>${dolares.toFixed(2)} USD</strong></p>
    <p class="smallMuted">Usando cotización ${tipo} de $${cotizacion.toFixed(2)} ARS/USD</p>
  `;
});

// Conversión de dólares a pesos
convertirAPesosBtn.addEventListener('click', () => {
  const dolares = parseFloat(dolaresInput.value);
  const tipo = tipoDolarSelect.value;
  const cotizacion = cotizaciones[tipo];

  if (!cotizacion) {
    conversionAPesosResultado.innerHTML = `<p style="color:red;">Esperando cotizaciones...</p>`;
    return;
  }
  if (isNaN(dolares) || dolares <= 0) {
    conversionAPesosResultado.innerHTML = `<p style="color:red;">Ingresa un monto válido en dólares.</p>`;
    return;
  }

  const pesos = dolares * cotizacion;
  conversionAPesosResultado.innerHTML = `
    <p>${dolares.toFixed(2)} USD equivalen a <strong>${pesos.toFixed(2)} ARS</strong></p>
    <p class="smallMuted">Usando cotización ${tipo} de $${cotizacion.toFixed(2)} ARS/USD</p>
  `;
});

// Cargar cotizaciones al iniciar
obtenerCotizaciones();

// === COTIZACIÓN DEL EURO ===
const euroInfo = document.getElementById('euroInfo');
const tipoEuroSelect = document.getElementById('tipoEuro');
const pesosEuroInput = document.getElementById('pesosEuro');
const convertirEuroBtn = document.getElementById('convertirEuroBtn');
const conversionEuroResultado = document.getElementById('conversionEuroResultado');

const eurosInput = document.getElementById('euros');
const convertirAEurosBtn = document.getElementById('convertirAEurosBtn');
const conversionAEurosResultado = document.getElementById('conversionAEurosResultado');

let cotizacionesEuro = { oficial: 0, blue: 0 };

// Obtener cotizaciones del euro
async function obtenerCotizacionesEuro() {
  try {
    const res = await fetch('https://api.bluelytics.com.ar/v2/latest');
    const data = await res.json();

    const euroOficial = data.oficial_euro.value_sell;
    const euroBlue = data.blue_euro.value_sell;

    cotizacionesEuro.oficial = euroOficial;
    cotizacionesEuro.blue = euroBlue;

    euroInfo.innerHTML = `
      <p><strong>Euro Oficial:</strong> $${euroOficial.toFixed(2)} ARS</p>
      <p><strong>Euro Blue:</strong> $${euroBlue.toFixed(2)} ARS</p>
      <p class="smallMuted">Fuente: bluelytics.com.ar</p>
    `;
  } catch (error) {
    euroInfo.innerHTML = `<p style="color:red;">No se pudieron obtener las cotizaciones del euro.</p>`;
    console.error('Error al obtener las cotizaciones del euro:', error);
  }
}

// Conversión de pesos a euros
convertirEuroBtn.addEventListener('click', () => {
  const pesos = parseFloat(pesosEuroInput.value);
  const tipo = tipoEuroSelect.value;
  const cotizacion = cotizacionesEuro[tipo];

  if (!cotizacion) {
    conversionEuroResultado.innerHTML = `<p style="color:red;">Esperando cotizaciones...</p>`;
    return;
  }
  if (isNaN(pesos) || pesos <= 0) {
    conversionEuroResultado.innerHTML = `<p style="color:red;">Ingresa un monto válido en pesos.</p>`;
    return;
  }

  const euros = pesos / cotizacion;
  conversionEuroResultado.innerHTML = `
    <p>${pesos.toFixed(2)} ARS equivalen a <strong>${euros.toFixed(2)} EUR</strong></p>
    <p class="smallMuted">Usando cotización ${tipo} de $${cotizacion.toFixed(2)} ARS/EUR</p>
  `;
});

// Conversión de euros a pesos
convertirAEurosBtn.addEventListener('click', () => {
  const euros = parseFloat(eurosInput.value);
  const tipo = tipoEuroSelect.value;
  const cotizacion = cotizacionesEuro[tipo];

  if (!cotizacion) {
    conversionAEurosResultado.innerHTML = `<p style="color:red;">Esperando cotizaciones...</p>`;
    return;
  }
  if (isNaN(euros) || euros <= 0) {
    conversionAEurosResultado.innerHTML = `<p style="color:red;">Ingresa un monto válido en euros.</p>`;
    return;
  }

  const pesos = euros * cotizacion;
  conversionAEurosResultado.innerHTML = `
    <p>${euros.toFixed(2)} EUR equivalen a <strong>${pesos.toFixed(2)} ARS</strong></p>
    <p class="smallMuted">Usando cotización ${tipo} de $${cotizacion.toFixed(2)} ARS/EUR</p>
  `;
});

// Cargar cotizaciones al iniciar
obtenerCotizacionesEuro();


ejecutarPruebas();