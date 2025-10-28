// CONFIGURACIÓN INICIAL
// Tasas de interés según cantidad de cuotas.
const TASAS_INTERES = {
  3: 1.10,
  6: 1.25,
  12: 1.50,
  24: 2.00
};

// Clave para identificar los datos guardados en localStorage
const STORAGE_KEY = 'simulacionesPrestamo_v1';

// FUNCIONES UTILITARIAS
// Formatea un número a formato moneda con separador decimal local (Argentina)
function formatearMoneda(valor){
  return Number(valor).toLocaleString('es-AR', {minimumFractionDigits:2, maximumFractionDigits:2});
}

// Lee el historial de simulaciones guardadas en localStorage
function leerHistorial(){
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : []; // Devuelve un array vacío si no hay datos
}

// Guarda el historial actualizado en localStorage
function guardarHistorial(historial){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(historial));
}

// Calcula los valores del préstamo según monto y cuotas seleccionadas
function calcularPrestamo(monto, cuotas){
  const tasa = TASAS_INTERES[cuotas] ?? null;
  if(!tasa) throw new Error('Cantidad de cuotas inválida.');

  const montoFinal = monto * tasa;           // Monto total a pagar
  const valorCuota = montoFinal / cuotas;    // Valor por cuota
  return { 
    montoFinal: Number(montoFinal.toFixed(2)), 
    valorCuota: Number(valorCuota.toFixed(2)), 
    tasa 
  };
}

// REFERENCIAS AL DOM
const form = document.getElementById('simuladorForm');
const resultadoContainer = document.getElementById('resultadoContainer');
const historialList = document.getElementById('historialList');
const limpiarBtn = document.getElementById('limpiarBtn');

// Agregar dinámicamente un botón para exportar historial
const exportarBtn = document.createElement('button');
exportarBtn.type = 'button';
exportarBtn.textContent = 'Exportar historial';
exportarBtn.id = 'exportarBtn';
document.querySelector('.actions').appendChild(exportarBtn);

// FUNCIONES DE INTERFAZ
// Muestra el resultado de la simulación actual en pantalla
function mostrarResultado(nombre, monto, cuotas, resultado){
  resultadoContainer.innerHTML = `
    <div class="resultado">
      <p><strong>${nombre}</strong>, solicitaste <strong>$${formatearMoneda(monto)}</strong> en <strong>${cuotas} cuotas</strong>.</p>
      <p class="smallMuted">Tasa aplicada: x${resultado.tasa} — Monto final: <strong>$${formatearMoneda(resultado.montoFinal)}</strong></p>
      <p><strong>Valor por cuota:</strong> $${formatearMoneda(resultado.valorCuota)}</p>
    </div>
  `;
}

// Renderiza (dibuja) el historial de simulaciones guardadas
function renderizarHistorial(){
  const historial = leerHistorial();
  historialList.innerHTML = '';

  // Si no hay datos guardados, muestra un mensaje
  if(historial.length === 0){
    historialList.innerHTML = '<li class="placeholder smallMuted">No hay simulaciones guardadas.</li>';
    return;
  }

  // Recorre el historial y genera cada item del listado
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

// Agrega una nueva simulación al historial y actualiza el listado
function agregarSimulacionAlHistorial(simulacion){
  const historial = leerHistorial();
  historial.unshift(simulacion); // Agrega al inicio del array
  guardarHistorial(historial);
  renderizarHistorial();
}

// EVENTOS PRINCIPALES DEL FORMULARIO
// Envío del formulario principal
form.addEventListener('submit', function(event){
  event.preventDefault(); // Evita recargar la página

  try{
    const nombre = form.nombre.value.trim() || 'Anonimo';
    const monto = Number(form.monto.value);
    const cuotas = Number(form.cuotas.value);

    // Validaciones básicas de entrada
    if(!nombre || isNaN(monto) || monto <= 0 || ![3,6,12,24].includes(cuotas)){
      resultadoContainer.innerHTML = '<p class="placeholder smallMuted">Por favor complete correctamente todos los campos.</p>';
      return;
    }

    // Cálculo del préstamo y muestra de resultados
    const resultado = calcularPrestamo(monto, cuotas);
    mostrarResultado(nombre, monto, cuotas, resultado);

    // Guarda la simulación en el historial
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

    // Limpieza de campos del formulario
    form.monto.value = '';
    form.cuotas.value = '';
  }catch(err){
    resultadoContainer.innerHTML = `<p class="placeholder smallMuted">Ocurrió un error: ${err.message}</p>`;
  }
});

// Evento: eliminar simulación individual desde el historial
historialList.addEventListener('click', function(e){
  const btn = e.target.closest('.removeBtn');
  if(!btn) return;

  const index = Number(btn.dataset.index);
  const historial = leerHistorial();

  if(index >= 0 && index < historial.length){
    historial.splice(index,1); // Elimina por índice
    guardarHistorial(historial);
    renderizarHistorial();
  }
});

// Evento: limpiar todo el historial
limpiarBtn.addEventListener('click', function(){
  if(confirm('¿Eliminar todo el historial de simulaciones?')){
    localStorage.removeItem(STORAGE_KEY);
    renderizarHistorial();
    resultadoContainer.innerHTML = '<p class="placeholder smallMuted">Historial eliminado.</p>';
  }
});

// Evento: exportar el historial en formato JSON descargable
exportarBtn.addEventListener('click', function(){
  const historial = leerHistorial();
  if(historial.length === 0){
    alert('No hay historial para exportar.');
    return;
  }

  // Crea un archivo JSON con los datos
  const blob = new Blob([JSON.stringify(historial, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);

  // Crea un enlace temporal para descargar el archivo
  const a = document.createElement('a');
  a.href = url;
  a.download = 'historial.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// Renderiza el historial al iniciar la página
renderizarHistorial();

// FUNCIONES DE PRUEBAS AUTOMÁTICAS
// Ejecuta pruebas simples para validar funcionamiento básico del código
function ejecutarPruebas(){
  const pruebas = [];

  // Prueba 1: cálculo de préstamo
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

  // Prueba 2: lectura de historial
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

  // Muestra los resultados de las pruebas en el pie de página
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

// SECCIÓN: COTIZACIÓN DEL DÓLAR
const dolarInfo = document.getElementById('dolarInfo');
const tipoDolarSelect = document.getElementById('tipoDolar');
const pesosInput = document.getElementById('pesos');
const convertirBtn = document.getElementById('convertirBtn');
const conversionResultado = document.getElementById('conversionResultado');

const dolaresInput = document.getElementById('dolares');
const convertirAPesosBtn = document.getElementById('convertirAPesosBtn');
const conversionAPesosResultado = document.getElementById('conversionAPesosResultado');

// Objeto para almacenar las cotizaciones actuales
let cotizaciones = { oficial: 0, blue: 0 };

// Consulta la API dolarapi.com para obtener las cotizaciones actualizadas
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

    // Muestra las cotizaciones en pantalla
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

  // Validaciones de entrada y disponibilidad
  if (!cotizacion) {
    conversionResultado.innerHTML = `<p style="color:red;">Esperando cotizaciones...</p>`;
    return;
  }
  if (isNaN(pesos) || pesos <= 0) {
    conversionResultado.innerHTML = `<p style="color:red;">Ingresa un monto válido en pesos.</p>`;
    return;
  }

  // Cálculo y visualización del resultado
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

// Cargar cotizaciones del dólar al iniciar
obtenerCotizaciones();

// SECCIÓN: COTIZACIÓN DEL EURO
const euroInfo = document.getElementById('euroInfo');
const tipoEuroSelect = document.getElementById('tipoEuro');
const pesosEuroInput = document.getElementById('pesosEuro');
const convertirEuroBtn = document.getElementById('convertirEuroBtn');
const conversionEuroResultado = document.getElementById('conversionEuroResultado');

const eurosInput = document.getElementById('euros');
const convertirAEurosBtn = document.getElementById('convertirAEurosBtn');
const conversionAEurosResultado = document.getElementById('conversionAEurosResultado');

let cotizacionesEuro = { oficial: 0, blue: 0 };

// Consulta la API bluelytics.com.ar para obtener cotizaciones del euro
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

// Cargar cotizaciones del euro al iniciar
obtenerCotizacionesEuro();

// Ejecutar pruebas al final del script
ejecutarPruebas();