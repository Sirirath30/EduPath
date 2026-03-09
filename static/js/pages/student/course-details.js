/**
 * EduPath Student Course Details Page
 * Your original code - exactly as you had it
 */

(function() {
    'use strict';

    // ==================== UTILITY FUNCTIONS ====================
    function toggleMenu() {
      const menu = document.getElementById('mobileMenu');
      if (menu) menu.hidden = !menu.hidden;
    }
    window.toggleMenu = toggleMenu;

    function showNotification(message, type) {
      const notification = document.createElement('div');
      notification.className = `notification-toast alert-${type}`;
      notification.innerHTML = message;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
      }, 3000);
    }

    // ==================== MATERIAL COMPLETION ====================
    async function completeMaterial(materialId) {
      try {
        console.log('Completing material:', materialId);
        const response = await fetch(`/student/material/${materialId}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        console.log('Response:', data);
        
        if (response.ok) {
          showNotification('Material marked as complete!', 'success');
          
          // Update UI immediately
          const materialCard = document.getElementById(`material-${materialId}`);
          if (materialCard) {
            const statusBadge = materialCard.querySelector('.material-meta .badge');
            if (statusBadge) {
              statusBadge.className = 'badge badge-success';
              statusBadge.innerHTML = '<i class="bi bi-check-circle-fill"></i> Completed';
            }
            
            // Remove mark complete button
            const markCompleteBtn = materialCard.querySelector('.action-btn:last-child');
            if (markCompleteBtn && markCompleteBtn.textContent.includes('Mark')) {
              markCompleteBtn.remove();
            }
          }
          
          // Reload after 2 seconds to update stats
          setTimeout(() => location.reload(), 2000);
        } else {
          showNotification('Failed to mark material as complete: ' + (data.error || 'Unknown error'), 'error');
        }
      } catch (error) {
        console.error('Error:', error);
        showNotification('An error occurred. Check console for details.', 'error');
      }
    }
    window.completeMaterial = completeMaterial;

    function toggleMaterial(materialId) {
      const content = document.getElementById('content-' + materialId);
      if (content) {
        content.style.display = content.style.display === 'none' ? 'block' : 'none';
      }
    }
    window.toggleMaterial = toggleMaterial;

    // ==================== VIDEO PLAYER ====================
    let videoPlayer = null;
    let currentVideo = null;
    let currentVideoQuestions = [];

    function openVideoPlayer(materialId, filePath, questions) {
      try {
        currentVideoQuestions = typeof questions === 'string' ? JSON.parse(questions) : (questions || []);
      } catch (e) {
        console.error('Error parsing questions:', e);
        currentVideoQuestions = [];
      }
      
      currentVideo = {
        id: materialId,
        questions: currentVideoQuestions,
        answeredQuestions: new Set()
      };
      
      const modal = document.getElementById('videoModal');
      const videoSource = document.getElementById('modalVideoSource');
      const videoTitle = document.getElementById('videoModalTitle');
      const materialCard = document.getElementById(`material-${materialId}`);
      
      videoSource.src = '/static/uploads/' + filePath;
      videoTitle.textContent = materialCard ? materialCard.querySelector('h3').textContent : 'Video Player';
      
      modal.style.display = 'flex';
      
      videoPlayer = document.getElementById('modalVideo');
      videoPlayer.load();
      
      if (currentVideoQuestions.length > 0) {
        videoPlayer.answeredQuestions = new Set();
        videoPlayer.addEventListener('timeupdate', checkVideoTime);
      }
      
      videoPlayer.play().catch(e => console.log('Autoplay prevented:', e));
    }
    window.openVideoPlayer = openVideoPlayer;

    function closeVideoPlayer() {
      const modal = document.getElementById('videoModal');
      modal.style.display = 'none';
      if (videoPlayer) {
        videoPlayer.pause();
        videoPlayer.removeEventListener('timeupdate', checkVideoTime);
        videoPlayer.currentTime = 0;
      }
    }
    window.closeVideoPlayer = closeVideoPlayer;

    // ==================== INTERACTIVE VIDEO QUIZ ====================
    let currentQuestion = null;
    let questionTimer = null;

    function checkVideoTime() {
      if (!videoPlayer || !currentVideoQuestions || !currentVideoQuestions.length) return;
      
      const currentTime = Math.floor(videoPlayer.currentTime);
      
      const question = currentVideoQuestions.find(q => 
        q && Math.abs(q.timestamp_seconds - currentTime) < 1 && 
        !videoPlayer.answeredQuestions.has(q.id)
      );
      
      if (question) {
        console.log('Question found at timestamp:', currentTime, question);
        videoPlayer.pause();
        showQuestionModal(question);
      }
    }

    function showQuestionModal(question) {
      if (videoPlayer.answeredQuestions && videoPlayer.answeredQuestions.has(question.id)) {
        videoPlayer.play();
        return;
      }
      
      currentQuestion = question;
      
      const modal = document.getElementById('questionModal');
      const questionEl = document.getElementById('modalQuestion');
      const optionsEl = document.getElementById('modalOptions');
      const submitBtn = document.getElementById('submitAnswerBtn');
      const closeBtn = document.getElementById('closeModalBtn');
      const timerEl = document.getElementById('questionTimer');
      
      questionEl.textContent = question.question;
      timerEl.innerHTML = '⏱️ <span>30</span> seconds remaining';
      
      let optionsHtml = '';
      const options = [
        { letter: 'A', text: question.option_a },
        { letter: 'B', text: question.option_b }
      ];
      if (question.option_c) options.push({ letter: 'C', text: question.option_c });
      if (question.option_d) options.push({ letter: 'D', text: question.option_d });
      
      options.forEach(opt => {
        optionsHtml += `
          <div class="option-item" onclick="selectOption(this, '${opt.letter}')">
            <strong>${opt.letter}.</strong> ${opt.text}
          </div>
        `;
      });
      
      optionsEl.innerHTML = optionsHtml;
      submitBtn.style.display = 'block';
      closeBtn.style.display = 'none';
      modal.style.display = 'flex';
      
      if (questionTimer) clearInterval(questionTimer);
      
      let timeLeft = 30;
      const timerSpan = timerEl.querySelector('span');
      
      questionTimer = setInterval(() => {
        timeLeft--;
        if (timerSpan) timerSpan.textContent = timeLeft;
        if (timeLeft <= 0) {
          clearInterval(questionTimer);
          handleQuestionTimeout();
        }
      }, 1000);
    }

    function selectOption(element, letter) {
      document.querySelectorAll('.option-item').forEach(opt => opt.classList.remove('selected'));
      element.classList.add('selected');
      window.selectedAnswer = letter;
    }
    window.selectOption = selectOption;

    async function submitAnswer() {
      const selectedOption = document.querySelector('.option-item.selected');
      
      if (!selectedOption) {
        alert("Please select an answer.");
        return;
      }

      clearInterval(questionTimer);
      const answer = window.selectedAnswer;
      const isCorrect = answer === currentQuestion.correct_answer;
      
      // Show correct/incorrect styling
      document.querySelectorAll('.option-item').forEach(opt => {
        const letter = opt.querySelector('strong').textContent.replace('.', '');
        if (letter === currentQuestion.correct_answer) {
          opt.classList.add('correct');
        } else if (letter === answer && !isCorrect) {
          opt.classList.add('incorrect');
        }
      });

      // Mark as answered
      if (videoPlayer) {
        if (!videoPlayer.answeredQuestions) videoPlayer.answeredQuestions = new Set();
        videoPlayer.answeredQuestions.add(currentQuestion.id);
      }

      try {
        const response = await fetch('/api/save-video-quiz-attempt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question_id: currentQuestion.id,
            answer: answer,
            is_correct: isCorrect,
            material_id: currentVideo?.id
          })
        });
        
        const data = await response.json();
        console.log('Quiz attempt saved:', data);
        
        if (response.ok) {
          document.getElementById('submitAnswerBtn').style.display = 'none';
          document.getElementById('closeModalBtn').style.display = 'block';
          
          const timerEl = document.getElementById('questionTimer');
          if (isCorrect) {
            timerEl.innerHTML = '✅ Correct! +' + (currentQuestion.points || 1) + ' points';
            timerEl.style.color = 'var(--success)';
          } else {
            timerEl.innerHTML = '❌ Incorrect. Correct answer: ' + currentQuestion.correct_answer;
            timerEl.style.color = 'var(--danger)';
          }
          
          document.querySelectorAll('.option-item').forEach(opt => opt.style.pointerEvents = 'none');
          showNotification('Quiz answer recorded! Refresh to see grades.', 'info');
        }
      } catch (error) {
        console.error('Error saving answer:', error);
        alert('Failed to save answer.');
      }
    }
    window.submitAnswer = submitAnswer;

    function handleQuestionTimeout() {
      document.querySelectorAll('.option-item').forEach(opt => {
        opt.style.pointerEvents = 'none';
      });
      
      document.getElementById('submitAnswerBtn').style.display = 'none';
      document.getElementById('closeModalBtn').style.display = 'block';
      document.getElementById('questionTimer').innerHTML = '⏰ Time\'s up!';
      
      if (videoPlayer) {
        if (!videoPlayer.answeredQuestions) videoPlayer.answeredQuestions = new Set();
        videoPlayer.answeredQuestions.add(currentQuestion.id);
      }
      
      fetch('/api/save-video-quiz-attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: currentQuestion.id,
          answer: 'timeout',
          is_correct: false,
          material_id: currentVideo?.id
        })
      }).catch(e => console.log('Error saving timeout:', e));
    }

    function closeQuestionModal() {
      document.getElementById('questionModal').style.display = 'none';
      window.selectedAnswer = null;
      currentQuestion = null;
      
      if (videoPlayer) videoPlayer.play().catch(e => console.log('Play error:', e));
      if (questionTimer) clearInterval(questionTimer);
    }
    window.closeQuestionModal = closeQuestionModal;

    // ==================== INITIALIZATION ====================
    document.addEventListener('DOMContentLoaded', function() {
      console.log('DOM loaded, initializing interactive videos');
      
      // Initialize interactive videos
      const interactiveVideos = document.querySelectorAll('.interactive-video');
      console.log('Found', interactiveVideos.length, 'interactive videos');
      
      interactiveVideos.forEach((video, index) => {
        try {
          const questionsData = video.dataset.questions;
          console.log(`Video ${index} questions data:`, questionsData);
          
          const questions = JSON.parse(questionsData || '[]');
          console.log(`Video ${index} parsed questions:`, questions);
          
          if (questions.length > 0) {
            video.questions = questions;
            video.answeredQuestions = new Set();
            
            // Add timeupdate listener
            video.addEventListener('timeupdate', function() {
              if (!this.questions || !this.questions.length) return;
              
              const currentTime = Math.floor(this.currentTime);
              
              const question = this.questions.find(q => 
                Math.abs(q.timestamp_seconds - currentTime) < 1 && 
                !this.answeredQuestions.has(q.id)
              );
              
              if (question) {
                console.log('Question triggered at time:', currentTime, question);
                this.pause();
                currentVideo = this;
                currentVideoQuestions = this.questions;
                videoPlayer = this;
                showQuestionModal(question);
              }
            });
            
            console.log(`Video ${index} initialized with ${questions.length} questions`);
          }
        } catch (e) {
          console.error('Error parsing questions for video:', e);
        }
      });
    });

    // Close modals on outside click
    window.onclick = function(event) {
      const videoModal = document.getElementById('videoModal');
      const questionModal = document.getElementById('questionModal');
      if (event.target === videoModal) closeVideoPlayer();
      if (event.target === questionModal) closeQuestionModal();
    };

})();