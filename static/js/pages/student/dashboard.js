/**
 * EduPath Student Dashboard Page
 */

(function() {
    'use strict';

    //toggleMenu function
    function toggleMenu() {
      const menu = document.getElementById('mobileMenu');
      menu.hidden = !menu.hidden;
    }
    window.toggleMenu = toggleMenu;

    //lose menu when clicking outside
    document.addEventListener('click', function(event) {
      const menu = document.getElementById('mobileMenu');
      const toggle = document.querySelector('.mobile-toggle');
      
      if (!menu.hidden && !menu.contains(event.target) && !toggle.contains(event.target)) {
        menu.hidden = true;
      }
    });

    // smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    // add active class to nav links on scroll
    window.addEventListener('scroll', function() {
      const sections = document.querySelectorAll('div[id]');
      const navLinks = document.querySelectorAll('.nav-links a');
      
      let current = '';
      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (pageYOffset >= sectionTop - 100) {
          current = section.getAttribute('id');
        }
      });

      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
          link.classList.add('active');
        }
      });
    });

})();