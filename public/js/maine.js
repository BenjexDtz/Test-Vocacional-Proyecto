document.addEventListener('DOMContentLoaded', function() {
  const header = document.getElementById('mainHeader');
  let lastScroll = 0;
  const scrollThreshold = 10;

  window.addEventListener('scroll', function() {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll <= 0) {
      header.classList.remove('hide');
      return;
    }
    
    const scrollingDown = currentScroll > lastScroll;
    
    if (scrollingDown && currentScroll > scrollThreshold && !header.classList.contains('hide')) {
      header.classList.add('hide');
    } else if (!scrollingDown && header.classList.contains('hide')) {
      header.classList.remove('hide');
    }
    
    lastScroll = currentScroll;
  });

  // Animación del logo
  const logo = document.querySelector('.logo-img');
  if(logo) {
    logo.addEventListener('mouseenter', function() {
      this.style.transform = 'translateX(-50%) scale(1.1)';
    });
    
    logo.addEventListener('mouseleave', function() {
      this.style.transform = 'translateX(-50%) scale(1)';
    });
    
    logo.addEventListener('click', function() {
      this.classList.add('animate__animated', 'animate__tada');
      setTimeout(() => {
        this.classList.remove('animate__animated', 'animate__tada');
      }, 1000);
    });
  }

  // Botón Guardar PDF
  document.getElementById('saveResults')?.addEventListener('click', function() {
    this.innerHTML = '<i class="bi bi-check-circle"></i> Generando PDF...';
    setTimeout(() => {
      alert('PDF generado exitosamente');
      this.innerHTML = '<i class="bi bi-download"></i> Guardar PDF';
    }, 1500);
  });
});