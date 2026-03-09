/**
 * EduPath Mobile Menu
 */

(function() {
    'use strict';
    
    class MobileMenu {
        constructor() {
            this.menu = document.getElementById('mobileMenu');
            this.toggle = document.querySelector('.mobile-toggle');
            this.isOpen = false;
            
            if (!this.menu || !this.toggle) return;
            
            this.init();
        }
        
        init() {
            // Make toggleMenu globally available
            window.toggleMenu = () => this.toggleMenu();
            
            // Toggle button click
            this.toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMenu();
            });
            
            // Close on outside click
            document.addEventListener('click', (e) => {
                if (this.isOpen && 
                    !this.menu.contains(e.target) && 
                    !this.toggle.contains(e.target)) {
                    this.close();
                }
            });
            
            // Close on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            });
            
            // Set initial ARIA attributes
            this.toggle.setAttribute('aria-expanded', 'false');
            this.toggle.setAttribute('aria-label', 'Toggle navigation menu');
        }
        
        toggleMenu() {
            if (this.isOpen) {
                this.close();
            } else {
                this.open();
            }
        }
        
        open() {
            this.menu.hidden = false;
            this.toggle.setAttribute('aria-expanded', 'true');
            this.isOpen = true;
        }
        
        close() {
            this.menu.hidden = true;
            this.toggle.setAttribute('aria-expanded', 'false');
            this.isOpen = false;
        }
    }
    
    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        new MobileMenu();
    });
    
})();