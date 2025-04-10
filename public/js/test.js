// Cargar preguntas al iniciar la página
document.addEventListener('DOMContentLoaded', cargarPreguntas);

// Configurar evento de formulario
document.getElementById('formulario').addEventListener('submit', async function(event) {
    event.preventDefault();
    await enviarRespuestas();
});

// Función para cargar preguntas desde el backend
async function cargarPreguntas() {
    try {
        console.log("Iniciando carga de preguntas...");
        
        // Cambia a URL absoluta temporalmente para diagnóstico
        const response = await fetch('http://localhost:3001/api/preguntas');
        
        console.log("Estado de la respuesta:", response.status);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Datos recibidos:", data);
        
        if (!data.success) {
            throw new Error(data.error || 'Error en el formato de respuesta');
        }

        const container = document.getElementById('preguntas-container');
        container.innerHTML = '';
        
        // Verifica que data.categorias existe y tiene datos
        if (!data.categorias || !Array.isArray(data.categorias)) {
            throw new Error('Formato de datos inválido: categorías no encontradas');
        }

        // Procesar cada categoría
        data.categorias.forEach(categoria => {
            const categoriaDiv = document.createElement('div');
            categoriaDiv.className = 'categoria mb-4';
            categoriaDiv.innerHTML = `
                <h5 class="categoria-titulo bg-light p-2 rounded">
                    ${categoria.nombre}
                </h5>
                <div class="preguntas-container" id="cat-${categoria.id}"></div>
            `;
            container.appendChild(categoriaDiv);
            
            const preguntasContainer = document.getElementById(`cat-${categoria.id}`);
            
            // Verificar que hay preguntas
            if (!categoria.preguntas || !Array.isArray(categoria.preguntas)) {
                console.warn(`No hay preguntas para la categoría ${categoria.id}`);
                return;
            }
            
            categoria.preguntas.forEach(pregunta => {
                const preguntaDiv = document.createElement('div');
                preguntaDiv.className = 'pregunta mb-3 p-3 border rounded';
                preguntaDiv.innerHTML = `
                    <label class="form-label" for="pregunta${pregunta.id}">
                        <span class="badge bg-secondary me-2">${pregunta.id}</span>
                        ${pregunta.texto}
                    </label>
                    <select class="form-select mt-2" id="pregunta${pregunta.id}" required>
                        <option value="">Seleccione...</option>
                        <option value="1">1 - Muy en desacuerdo</option>
                        <option value="2">2 - En desacuerdo</option>
                        <option value="3">3 - Neutral</option>
                        <option value="4">4 - De acuerdo</option>
                        <option value="5">5 - Muy de acuerdo</option>
                    </select>
                `;
                preguntasContainer.appendChild(preguntaDiv);
            });
        });

        document.getElementById('btn-enviar').disabled = false;
        console.log("Preguntas cargadas correctamente");

    } catch (error) {
        console.error("Error al cargar preguntas:", error);
        mostrarResultado(`
            <div class="alert alert-danger">
                <h5>❌ Error al cargar el test</h5>
                <p>${error.message}</p>
                <p class="small mt-2">Verifica la consola para más detalles</p>
                <button onclick="location.reload()" class="btn btn-warning mt-2">
                    Recargar página
                </button>
            </div>
        `, 'error');
    }
}

// Función para mostrar mensajes
function mostrarResultado(mensaje, tipo = 'success') {
    const resultadoDiv = document.getElementById('resultado');
    resultadoDiv.innerHTML = '';
    resultadoDiv.classList.remove('d-none');
    
    let alertClass = 'alert-success';
    if (tipo === 'warning') alertClass = 'alert-warning';
    if (tipo === 'error') alertClass = 'alert-danger';
    if (tipo === 'info') alertClass = 'alert-info';
    
    resultadoDiv.innerHTML = `
        <div class="alert ${alertClass} alert-dismissible fade show">
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
}

// Función para mostrar el resultado final
function mostrarResultadoFinal(usuario, areaRecomendada) {
    const resultadoHTML = `
        <div class="card border-success mb-3">
            <div class="card-header bg-success text-white">
                <h4 class="mb-0">Resultado del Test Vocacional</h4>
            </div>
            <div class="card-body">
                <h5 class="card-title">¡Felicidades, ${usuario}!</h5>
                <p class="card-text">Según tus respuestas, tu área recomendada es:</p>
                <div class="alert alert-primary" role="alert">
                    <h4 class="alert-heading">${areaRecomendada}</h4>
                    <hr>
                    <p class="mb-0">Este resultado se basa en tus intereses y aptitudes.</p>
                </div>
                <div class="d-grid gap-2 d-md-flex justify-content-md-between">
                    <button onclick="intentarDeNuevo()" class="btn btn-warning">
                        <i class="bi bi-arrow-repeat"></i> Realizar test nuevamente
                    </button>
                    <button onclick="window.print()" class="btn btn-info">
                        <i class="bi bi-printer"></i> Imprimir resultado
                    </button>
                </div>
            </div>
        </div>
    `;
    mostrarResultado(resultadoHTML, 'success');
}

// Función para reiniciar el test
function intentarDeNuevo() {
    document.getElementById('formulario').reset();
    document.getElementById('resultado').classList.add('d-none');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Función principal para enviar respuestas
async function enviarRespuestas() {
    const usuario = document.getElementById('usuario').value.trim();
    const correo = document.getElementById('correo').value.trim();
    const respuestas = {};
    const puntajes = {};

    try {
        // Validar campos básicos
        if (!usuario || usuario.length < 3) {
            throw new Error('Por favor ingresa un nombre válido (mínimo 3 caracteres)');
        }

        if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
            throw new Error('Por favor ingresa un correo electrónico válido');
        }

        // Obtener todas las preguntas para validación
        const elementosPreguntas = document.querySelectorAll('[id^="pregunta"]');
        if (elementosPreguntas.length !== 66) {
            throw new Error('No se han cargado todas las preguntas correctamente');
        }

        // Mostrar estado de carga
        mostrarResultado(`
            <div class="text-center">
                <div class="spinner-border text-primary mb-2"></div>
                <p>Procesando tus respuestas...</p>
                <div class="progress">
                    <div class="progress-bar progress-bar-striped progress-bar-animated" 
                         style="width: 0%" id="progreso-envio"></div>
                </div>
            </div>
        `, 'info');

        // Procesar cada pregunta con validación
        let preguntasProcesadas = 0;
        for (const elemento of elementosPreguntas) {
            const idPregunta = elemento.id.replace('pregunta', '');
            const respuesta = parseInt(elemento.value);
            
            if (isNaN(respuesta) || respuesta < 1 || respuesta > 5) {
                elemento.classList.add('is-invalid');
                throw new Error(`Por favor selecciona una opción válida para la pregunta ${idPregunta}`);
            }
            
            respuestas[idPregunta] = respuesta;
            preguntasProcesadas++;
            
            // Actualizar barra de progreso
            document.getElementById('progreso-envio').style.width = 
                `${Math.round((preguntasProcesadas / 66) * 100)}%`;
        }

        // Enviar al servidor
        const response = await fetch('/api/guardar-respuestas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, correo, respuestas })
        });

        const responseData = await response.json();
        
        if (!response.ok) {
            throw new Error(responseData.error || 'Error al guardar respuestas');
        }

        // Obtener y mostrar resultados
        const resultadoResponse = await fetch(`/resultado/${responseData.usuarioId}`);
        const resultadoData = await resultadoResponse.json();
        
        if (!resultadoData.success) {
            throw new Error(resultadoData.error || 'Error al obtener resultados');
        }

        mostrarResultadoFinal(usuario, resultadoData.area_recomendada);

    } catch (error) {
        console.error('Error:', error);
        mostrarResultado(`
            <div class="alert alert-danger">
                <h5>❌ Error en el proceso</h5>
                <p>${error.message}</p>
                ${error.message.includes('pregunta') ? `
                <button onclick="document.getElementById('pregunta${error.message.match(/\d+/)[0]}').scrollIntoView({ behavior: 'smooth', block: 'center' })" 
                        class="btn btn-sm btn-warning mt-2">
                    Ir a la pregunta
                </button>
                ` : ''}
            </div>
        `, 'error');
    }
}