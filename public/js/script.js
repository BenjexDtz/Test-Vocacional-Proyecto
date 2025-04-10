// Configuración base (colócalo al principio del archivo)
const API_BASE_URL = window.location.origin; // Obtiene la URL actual (http://localhost:3000 o tu dominio)

document.getElementById('formulario').addEventListener('submit', async function(event) {
    event.preventDefault();

    const usuario = document.getElementById('usuario').value.trim();
    const respuesta1 = document.getElementById('pregunta1').value;
    const respuesta2 = document.getElementById('pregunta2').value;

    if (!usuario || !respuesta1 || !respuesta2) {
        mostrarMensaje('Por favor, complete todos los campos.', 'danger');
        return;
    }

    const respuestas = [
        { usuario, pregunta_id: 1, respuesta: respuesta1 },
        { usuario, pregunta_id: 2, respuesta: respuesta2 }
    ];    

    try {
        // Guardar respuestas en el backend (usando API_BASE_URL)
        const response = await fetch(`${API_BASE_URL}/respuestas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(respuestas)
        });

        const result = await response.json();
        console.debug('Respuesta del servidor (POST):', result); // Debug en lugar de log

        if (response.ok && result.success) {
            mostrarMensaje(`Respuestas guardadas correctamente. Obteniendo resultado...`, 'success');
            setTimeout(() => obtenerResultado(usuario), 1000);
        } else {
            mostrarMensaje(result.message || 'Error al procesar las respuestas', 'danger');
        }

    } catch (error) {
        console.error('Error en la solicitud:', error);
        mostrarMensaje('Hubo un error al enviar las respuestas.', 'danger');
    }
});

// Función optimizada para obtener resultados
async function obtenerResultado(usuario) {
    try {
        const response = await fetch(`${API_BASE_URL}/resultado/${usuario}`);
        const data = await response.json();
        
        console.debug('Datos del servidor (GET):', data); // Debug en lugar de log

        if (response.ok) {
            mostrarMensaje(`Gracias ${usuario}, tu área recomendada es: <strong>${data.area_recomendada}</strong>.`, 'success');
        } else {
            mostrarMensaje(data.error || 'No se pudo obtener el resultado.', 'danger');
        }
    } catch (error) {
        console.error('Error al obtener el resultado:', error);
        mostrarMensaje('Hubo un error al obtener el resultado.', 'danger');
    }
}

// Función para mostrar mensajes (sin cambios)
function mostrarMensaje(mensaje, tipo) {
    const resultado = document.getElementById('resultado');
    resultado.innerHTML = mensaje;
    resultado.className = `mt-4 alert alert-${tipo}`;
    resultado.classList.remove('d-none');
}