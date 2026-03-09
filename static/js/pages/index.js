/**
 * EduPath Index/Home Page
 * Handles dynamic content loading and animations
 */

(function() {
    'use strict';

    class IndexPage {
        constructor() {
            this.init();
        }

        init() {
            this.loadCourses();
            this.initTestimonialsSlider();
            this.animateStats();
            this.initSmoothScroll();
        }

        async loadCourses() {
            const grid = document.getElementById('coursesGrid');
            if (!grid) return;

            try {
                const response = await fetch('/api/courses/popular');
                const data = await response.json();

                if (data.courses && data.courses.length) {
                    let html = '';
                    data.courses.forEach(course => {
                        html += `
                            <div class="course-card">
                                <div class="course-image">
                                    <img src="${course.image || '/images/default-course.jpg'}" alt="${course.title}">
                                </div>
                                <div class="course-content">
                                    <h3>${course.title}</h3>
                                    <p>${course.description.substring(0, 100)}...</p>
                                    <div class="course-meta">
                                        <span><i class="bi bi-person"></i> ${course.instructor}</span>
                                        <span><i class="bi bi-star"></i> ${course.rating}</span>
                                    </div>
                                    <a href="/course/${course.id}" class="btn-secondary">Learn More</a>
                                </div>
                            </div>
                        `;
                    });
                    grid.innerHTML = html;
                }
            } catch (error) {
                console.error('Failed to load courses:', error);
                grid.innerHTML = '<p class="error">Failed to load courses</p>';
            }
        }

        initTestimonialsSlider() {
            // Simple slider implementation
        }

        animateStats() {
            // Animate counting numbers
        }

        initSmoothScroll() {
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function(e) {
                    e.preventDefault();
                    const target = document.querySelector(this.getAttribute('href'));
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            });
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        new IndexPage();
    });
})();