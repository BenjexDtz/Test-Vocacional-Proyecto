document.getElementById('formulario').addEventListener('submit', async function(event) {
    event.preventDefault();
    await enviarRespuestas();
});

async function enviarRespuestas() {
    const usuario = document.getElementById('usuario').value.trim();
    const respuestas = {
        1: document.getElementById('pregunta1').value,
        2: document.getElementById('pregunta2').value
    };

    // Validación de campos vacíos
    if (!usuario) {
        mostrarResultado('⚠️ Por favor ingresa tu nombre o identificador', 'warning');
        return;
    }

    if (Object.values(respuestas).some(v => !v)) {
        mostrarResultado('⚠️ Por favor responde todas las preguntas', 'warning');
        return;
    }

    try {
        // Mostrar mensaje de carga mientras se procesan las respuestas
        mostrarResultado('<div class="text-center"><div class="spinner-border"></div> Analizando tus respuestas...</div>', 'info');

        // Enviar respuestas al servidor
        const response = await fetch('/api/guardar-respuestas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ usuario, respuestas })
        });

        // Verificar que la respuesta sea válida antes de intentar parsearla como JSON
        if (!response.ok) {
            const errorData = await response.json(); // Si la respuesta es errónea, obtener el error del servidor
            throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
        }

        // Obtener el resultado después de guardar las respuestas
        const resultado = await obtenerResultado(usuario);

        // Mostrar el resultado final al usuario
        mostrarResultadoFinal(usuario, resultado.area_recomendada);

    } catch (error) {
        console.error('Error completo:', error);
        mostrarResultado(`
            <div class="alert alert-danger">
                <h5 class="alert-heading">❌ Error en el proceso</h5>
                <p>${error.message}</p>
                <button onclick="intentarDeNuevo()" class="btn btn-warning mt-2">
                    <i class="bi bi-arrow-clockwise"></i> Reintentar
                </button>
            </div>
        `, 'danger');
    }
}

async function obtenerResultado(usuario) {
    try {
        // Solicitar resultado de la evaluación al servidor
        const response = await fetch(`/resultado/${usuario}`);
        if (!response.ok) {
            throw new Error(`Error ${response.status} al obtener resultados`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error al obtener resultado:', error);
        return { area_recomendada: "General" }; // Devolver un valor predeterminado si ocurre un error
    }
}

function mostrarResultadoFinal(usuario, area) {
    // Mapeo de las áreas recomendadas con estilos
    const areasConEstilos = {
        "tecnologia": "Tecnología e Informática",
        "humanidades": "Humanidades y Artes",
        "sociales": "Ciencias Sociales",
        "individual": "Trabajos Individuales",
        "General": "Varias Áreas"
    };

    const areaFormateada = areasConEstilos[area] || area;

    // Mostrar el resultado final con un formato estético
    document.getElementById('test-container').innerHTML = `
        <div class="alert alert-success">
            <h4 class="alert-heading">¡Test Completado!</h4>
            <hr>
            <p class="mb-1"><strong>Usuario:</strong> ${usuario}</p>
            <p class="mb-1"><strong>Área recomendada:</strong></p>
            <h3 class="text-primary mt-2">${areaFormateada}</h3>
            <hr>
            <p class="mb-0">Gracias por completar el test vocacional.</p>
        </div>
        <button onclick="location.reload()" class="btn btn-outline-primary w-100 mt-3">
            <i class="bi bi-arrow-repeat"></i> Realizar otro test
        </button>
    `;
}

function intentarDeNuevo() {
    // Permitir al usuario intentar de nuevo después de un error
    document.getElementById('resultado').classList.add('d-none');
}

function mostrarResultado(mensaje, tipo) {
    // Mostrar resultados intermedios como mensajes informativos o de error
    const div = document.getElementById('resultado');
    div.innerHTML = `<div class="alert alert-${tipo}">${mensaje}</div>`;
    div.classList.remove('d-none');

    // Ocultar el mensaje después de 5 segundos si no es un error o advertencia
    if (tipo !== 'danger' && tipo !== 'warning') {
        setTimeout(() => div.classList.add('d-none'), 5000);
    }
}
