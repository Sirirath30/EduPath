/**
 * EduPath Student Quiz Page
 */

(function() {
    'use strict';

    // toggleMenu function
    function toggleMenu() {
        const mobileMenu = document.getElementById('mobileMenu');
        mobileMenu.classList.toggle('show');
        
        const toggleButton = document.querySelector('.mobile-toggle');
        if (toggleButton) {
            const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';
            toggleButton.setAttribute('aria-expanded', !isExpanded);
        }
    }
    window.toggleMenu = toggleMenu;

    // Run quiz timer logic when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        // 1. Grab the time limit from the HTML data attribute
        const quizDataElement = document.getElementById('quiz-data');
        if (!quizDataElement) return;
        
        const timeLimitMinutes = parseInt(quizDataElement.getAttribute('data-time-limit'), 10);

        // 2. Only run the timer logic if the time limit is greater than 0
        if (timeLimitMinutes > 0) {
            let timeLeft = timeLimitMinutes * 60; 
            const timerElement = document.getElementById('timer');
            const quizForm = document.getElementById('quizForm');
            let timerInterval;
            
            function updateTimer() {
                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;
                timerElement.textContent = `⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}`;
                
                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    quizForm.submit();
                } else {
                    timeLeft--;
                }
            }
            
            updateTimer(); 
            timerInterval = setInterval(updateTimer, 1000);
        }

        // Confirm submission
        document.getElementById('quizForm').addEventListener('submit', function(e) {
            if (!confirm('Are you sure you want to submit your quiz?')) {
                e.preventDefault();
            }
        });
    });

})();