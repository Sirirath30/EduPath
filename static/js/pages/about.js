/**
 * EduPath About Page
 * Handles team display and animations
 */

(function() {
    'use strict';

    class AboutPage {
        constructor() {
            this.init();
        }

        init() {
            this.animateStats();
            this.initTeamHover();
            this.loadTestimonials();
        }

        animateStats() {
            const stats = document.querySelectorAll('.stat-number');
            stats.forEach(stat => {
                const value = stat.textContent;
                if (!isNaN(parseInt(value))) {
                    this.animateValue(stat, 0, parseInt(value), 2000);
                }
            });
        }

        animateValue(element, start, end, duration) {
            const range = end - start;
            const increment = range / (duration / 16);
            let current = start;

            const timer = setInterval(() => {
                current += increment;
                if (current >= end) {
                    element.textContent = end;
                    clearInterval(timer);
                } else {
                    element.textContent = Math.floor(current);
                }
            }, 16);
        }

        initTeamHover() {
            document.querySelectorAll('.team-card').forEach(card => {
                card.addEventListener('mouseenter', () => {
                    card.style.transform = 'translateY(-10px)';
                });
                card.addEventListener('mouseleave', () => {
                    card.style.transform = 'translateY(0)';
                });
            });
        }

        async loadTestimonials() {
            // Load testimonials from API
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        new AboutPage();
    });
})();