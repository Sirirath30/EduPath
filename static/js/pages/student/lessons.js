/**
 * EduPath Student Course Lessons Page
 */

(function() {
    'use strict';

    //toggleLesson function
    function toggleLesson(id) {
        const content = document.getElementById(`lesson-${id}`);
        const chevron = document.getElementById(`chevron-${id}`);

        content.classList.toggle('active');
        chevron.style.transform =
            content.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
    }
    window.toggleLesson = toggleLesson;

    //markLessonComplete function
    async function markLessonComplete(id) {
        try {
            const response = await fetch(`/student/lesson/${id}/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Show success message
                const notification = document.createElement('div');
                notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: var(--success);
                    color: white;
                    padding: 1rem 2rem;
                    border-radius: var(--radius);
                    z-index: 9999;
                    animation: slideIn 0.3s ease;
                `;
                notification.innerHTML = '✅ Lesson marked as complete!';
                document.body.appendChild(notification);
                
                setTimeout(() => {
                    notification.remove();
                    location.reload();
                }, 1500);
            } else {
                alert('Failed to mark lesson as complete. Please try again.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        }
    }
    window.markLessonComplete = markLessonComplete;

    //animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);

})();