/**
 * EduPath Admin Approvals Page
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

    // close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
      const menu = document.getElementById('mobileMenu');
      const toggle = document.querySelector('.mobile-toggle');
      if (!menu.hidden && !menu.contains(e.target) && !toggle.contains(e.target)) {
        menu.hidden = true;
      }
    });

    //auto-hide alerts after 5 seconds
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