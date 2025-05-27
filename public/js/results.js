document.addEventListener('DOMContentLoaded', function() {
  // Obtener resultados (ejemplo con parámetros de URL)
  const urlParams = new URLSearchParams(window.location.search);
  let resultados;
  
  try {
    resultados = JSON.parse(urlParams.get('data')) || JSON.parse(localStorage.getItem('resultadosTest')) || {
      carreras: [
        { nombre: "Ingeniería de Software", puntaje: 92 },
        { nombre: "Psicología", puntaje: 85 }
      ],
      habilidades: [85, 70, 65, 90, 75, 60]
    };
  } catch (e) {
    resultados = {
      carreras: [
        { nombre: "Ingeniería de Software", puntaje: 92 },
        { nombre: "Psicología", puntaje: 85 }
      ],
      habilidades: [85, 70, 65, 90, 75, 60]
    };
  }

  // Ordenar carreras por puntaje
  resultados.carreras.sort((a, b) => b.puntaje - a.puntaje);

  // Mostrar carreras dinámicamente
  const careersContainer = document.getElementById('careersResults');
  careersContainer.innerHTML = '';

  resultados.carreras.forEach((carrera, index) => {
    const carreraData = carreras[carrera.nombre] || {
      imagen: 'default.jpg',
      descripcion: 'Esta carrera muestra gran compatibilidad con tu perfil vocacional.',
      habilidades: ["Habilidad 1", "Habilidad 2"]
    };

    const careerCard = document.createElement('div');
    careerCard.className = 'career-card';
    careerCard.innerHTML = `
      <div class="career-image">
        <img src="img/careers/${carreraData.imagen}" alt="${carrera.nombre}" onerror="this.src='img/careers/default.jpg'">
      </div>
      <div class="career-info">
        <h3>${index + 1}. ${carrera.nombre}</h3>
        <div class="compatibility">
          <span class="percentage">${carrera.puntaje}%</span>
          <div class="progress-bar">
            <div class="progress" style="width: ${carrera.puntaje}%"></div>
          </div>
        </div>
        <p class="description">${carreraData.descripcion}</p>
        <div class="habilidades">
          <strong>Habilidades clave:</strong>
          ${carreraData.habilidades.map(h => `<span class="habilidad">${h}</span>`).join(' ')}
        </div>
        <a href="#" class="btn-details">Ver detalles completos</a>
      </div>
    `;
    
    // Destacar la primera recomendación
    if(index === 0) {
      const badge = document.createElement('div');
      badge.className = 'top-badge';
      badge.textContent = 'MEJOR OPCIÓN';
      careerCard.appendChild(badge);
    }
    
    careersContainer.appendChild(careerCard);
  });

  // Configurar gráfico radar
  const ctx = document.getElementById('careerChart').getContext('2d');
  new Chart(ctx, {
    type: 'radar',
    data: {
      labels: habilidadesChart,
      datasets: [{
        label: 'Tu Perfil',
        data: resultados.habilidades,
        backgroundColor: 'rgba(90, 155, 198, 0.2)',
        borderColor: 'rgba(44, 95, 139, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(244, 162, 97, 1)',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      scales: {
        r: {
          angleLines: { color: 'rgba(44, 95, 139, 0.1)' },
          suggestedMin: 0,
          suggestedMax: 100,
          ticks: { stepSize: 20 }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: 'rgba(44, 95, 139, 0.8)'
          }
        }
      }
    }
  });

  // Botón Repetir Test
  document.getElementById('retakeTest')?.addEventListener('click', function() {
    this.innerHTML = '<i class="bi bi-arrow-repeat"></i> Preparando...';
    setTimeout(() => {
      window.location.href = 'test.html';
    }, 800);
  });

  // Botón Comparar
  document.getElementById('compareResults')?.addEventListener('click', function() {
    this.innerHTML = '<i class="bi bi-people-fill"></i> Cargando...';
    setTimeout(() => {
      alert('Función de comparación en desarrollo');
      this.innerHTML = '<i class="bi bi-people-fill"></i> Comparar';
    }, 1000);
  });
});