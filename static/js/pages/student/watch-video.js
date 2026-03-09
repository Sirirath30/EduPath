/**
 * EduPath Student Watch Video Page
 * Your original code - exactly as you had it, with Flask template adjustments
 */

(function() {
    'use strict';

    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function() {
        const video = document.getElementById('videoPlayer');
        const modal = document.getElementById('questionModal');
        const questionText = document.getElementById('questionText');
        const optionsContainer = document.getElementById('optionsContainer');
        
        // Questions data from server - passed via data attribute instead of template
        const videoData = document.getElementById('video-data');
        let questions = [];
        
        if (videoData) {
            try {
                questions = JSON.parse(videoData.dataset.questions || '[]');
            } catch (e) {
                console.error('Error parsing questions:', e);
            }
        }
        
        let currentQuestion = null;
        let selectedOption = null;
        let answeredQuestions = new Set();
        let materialId = videoData?.dataset.materialId;
        let courseId = videoData?.dataset.courseId;
        
        // Check video time every second
        video.addEventListener('timeupdate', function() {
            const currentTime = Math.floor(video.currentTime);
            
            // Check if there's a question at this timestamp
            const question = questions.find(q => 
                Math.abs(q.timestamp_seconds - currentTime) < 1 && 
                !answeredQuestions.has(q.id)
            );
            
            if (question && !currentQuestion) {
                pauseVideoAndShowQuestion(question);
            }
        });
        
        function pauseVideoAndShowQuestion(question) {
            video.pause();
            currentQuestion = question;
            
            questionText.textContent = question.question;
            
            // Create options
            let optionsHtml = '';
            const options = [
                { letter: 'A', text: question.option_a },
                { letter: 'B', text: question.option_b }
            ];
            if (question.option_c) options.push({ letter: 'C', text: question.option_c });
            if (question.option_d) options.push({ letter: 'D', text: question.option_d });
            
            options.forEach(opt => {
                optionsHtml += `
                    <div class="option" onclick="window.selectOption('${opt.letter}')">
                        <strong>${opt.letter}.</strong> ${opt.text}
                    </div>
                `;
            });
            
            optionsContainer.innerHTML = optionsHtml;
            modal.classList.remove('hidden');
        }
        
        window.selectOption = function(letter) {
            selectedOption = letter;
            document.querySelectorAll('.option').forEach(opt => {
                opt.classList.remove('selected');
            });
            event.target.classList.add('selected');
        };
        
        window.submitAnswer = async function() {
            if (!selectedOption) {
                alert('Please select an answer');
                return;
            }
            
            const isCorrect = selectedOption === currentQuestion.correct_answer;
            
            // Save attempt to database
            await fetch('/api/save-video-quiz-attempt', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    question_id: currentQuestion.id,
                    answer: selectedOption,
                    is_correct: isCorrect
                })
            });
            
            // Show result
            alert(isCorrect ? '✅ Correct! +' + currentQuestion.points + ' points' : '❌ Incorrect. The correct answer was ' + currentQuestion.correct_answer);
            
            // Mark as answered and close modal
            answeredQuestions.add(currentQuestion.id);
            modal.classList.add('hidden');
            currentQuestion = null;
            selectedOption = null;
            
            // Resume video
            video.play();
        };
        
        window.markCompleted = async function() {
            await fetch(`/student/material/${materialId}/complete`, {
                method: 'POST'
            });
            alert('Video marked as completed!');
            window.location.href = `/student/course/${courseId}`;
        };
    });

})();