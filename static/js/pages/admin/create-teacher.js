/**
 * EduPath Admin Create Teacher Page
 */

(function() {
    'use strict';

    //toggleMenu function
    function toggleMenu() {
      const menu = document.getElementById('mobileMenu');
      menu.hidden = !menu.hidden;
    }

    // Make it globally available
    window.toggleMenu = toggleMenu;

    //close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
      const menu = document.getElementById('mobileMenu');
      const toggle = document.querySelector('.mobile-toggle');
      if (!menu.hidden && !menu.contains(e.target) && !toggle.contains(e.target)) {
        menu.hidden = true;
      }
    });

    // form submission handler
    document.getElementById('teacherForm').addEventListener('submit', function(e) {
      const grade11 = document.getElementById('grade11');
      const grade12 = document.getElementById('grade12');
      const submitBtn = document.getElementById('submitBtn');
      
      if (!grade11.checked && !grade12.checked) {
        e.preventDefault();
        alert('Please select at least one grade level');
        return;
      }
      
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="bi bi-spinner spinning"></i> Creating...';
    });

    //auto-hide alerts
    document.addEventListener('DOMContentLoaded', function() {
      const alerts = document.querySelectorAll('.alert');
      alerts.forEach(alert => {
        setTimeout(() => {
          alert.style.transition = 'opacity 0.5s';
          alert.style.opacity = '0';
          setTimeout(() => alert.remove(), 500);
        }, 5000);
      });
    });

})();