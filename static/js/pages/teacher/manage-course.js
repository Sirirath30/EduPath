/**
 * EduPath Teacher Manage Course Page
 * Your original code - exactly as you had it
 */

(function() {
    'use strict';

    // Global variables
    let currentLessonId = null;
    let videoQuestionCount = 0;
    let docQuestionCount = 0;
    let quizQuestionCount = 0;

    // Modal functions
    function showAddLessonModal() {
      document.getElementById('addLessonModal').style.display = 'flex';
    }
    window.showAddLessonModal = showAddLessonModal;

    function addVideo(lessonId) {
      currentLessonId = lessonId;
      document.getElementById('videoLessonId').value = lessonId;
      document.getElementById('addVideoModal').style.display = 'flex';
    }
    window.addVideo = addVideo;

    function addDocument(lessonId) {
      currentLessonId = lessonId;
      document.getElementById('docLessonId').value = lessonId;
      document.getElementById('addDocumentModal').style.display = 'flex';
    }
    window.addDocument = addDocument;

    function addQuiz(lessonId) {
      currentLessonId = lessonId;
      document.getElementById('quizLessonId').value = lessonId;
      document.getElementById('addQuizModal').style.display = 'flex';
    }
    window.addQuiz = addQuiz;

    function closeModal() {
      document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
      });
      // Reset question counts when closing
      videoQuestionCount = 0;
      docQuestionCount = 0;
      quizQuestionCount = 0;
      document.getElementById('videoQuestions').innerHTML = '';
      document.getElementById('docQuestions').innerHTML = '';
      document.getElementById('quizQuestions').innerHTML = '';
    }
    window.closeModal = closeModal;

    // Toggle quiz options
    function toggleQuizOptions(checkbox) {
      document.getElementById('quizOptions').style.display = checkbox.checked ? 'block' : 'none';
    }
    window.toggleQuizOptions = toggleQuizOptions;

    function toggleDocQuizOptions(checkbox) {
      document.getElementById('docQuizOptions').style.display = checkbox.checked ? 'block' : 'none';
    }
    window.toggleDocQuizOptions = toggleDocQuizOptions;

    // Question functions
    function addVideoQuestion() {
      const container = document.getElementById('videoQuestions');
      const questionId = videoQuestionCount;
      const html = `
        <div class="question-block" id="vq-${questionId}">
          <div class="question-header">
            <h5>Question ${questionId + 1}</h5>
            <button type="button" class="remove-question" onclick="removeQuestion('vq-${questionId}')">
              <i class="bi bi-trash"></i> Remove
            </button>
          </div>
          <div class="form-group">
            <label>Timestamp (seconds)</label>
            <input type="number" name="video_questions[${questionId}][timestamp]" min="0" required placeholder="e.g., 30">
          </div>
          <div class="form-group">
            <label>Question</label>
            <input type="text" name="video_questions[${questionId}][question]" required placeholder="Enter your question">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Option A</label>
              <input type="text" name="video_questions[${questionId}][option_a]" required>
            </div>
            <div class="form-group">
              <label>Option B</label>
              <input type="text" name="video_questions[${questionId}][option_b]" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Option C</label>
              <input type="text" name="video_questions[${questionId}][option_c]">
            </div>
            <div class="form-group">
              <label>Option D</label>
              <input type="text" name="video_questions[${questionId}][option_d]">
            </div>
          </div>
          <div class="form-group">
            <label>Correct Answer</label>
            <select name="video_questions[${questionId}][correct]" required>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </div>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', html);
      videoQuestionCount++;
    }
    window.addVideoQuestion = addVideoQuestion;

    function addDocQuestion() {
      const container = document.getElementById('docQuestions');
      const questionId = docQuestionCount;
      const html = `
        <div class="question-block" id="dq-${questionId}">
          <div class="question-header">
            <h5>Question ${questionId + 1}</h5>
            <button type="button" class="remove-question" onclick="removeQuestion('dq-${questionId}')">
              <i class="bi bi-trash"></i> Remove
            </button>
          </div>
          <div class="form-group">
            <label>Question</label>
            <input type="text" name="doc_questions[${questionId}][question]" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Option A</label>
              <input type="text" name="doc_questions[${questionId}][option_a]" required>
            </div>
            <div class="form-group">
              <label>Option B</label>
              <input type="text" name="doc_questions[${questionId}][option_b]" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Option C</label>
              <input type="text" name="doc_questions[${questionId}][option_c]">
            </div>
            <div class="form-group">
              <label>Option D</label>
              <input type="text" name="doc_questions[${questionId}][option_d]">
            </div>
          </div>
          <div class="form-group">
            <label>Correct Answer</label>
            <select name="doc_questions[${questionId}][correct]" required>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </div>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', html);
      docQuestionCount++;
    }
    window.addDocQuestion = addDocQuestion;

    function addQuizQuestion() {
      const container = document.getElementById('quizQuestions');
      const questionId = quizQuestionCount;
      const html = `
        <div class="question-block" id="qq-${questionId}">
          <div class="question-header">
            <h5>Question ${questionId + 1}</h5>
            <button type="button" class="remove-question" onclick="removeQuestion('qq-${questionId}')">
              <i class="bi bi-trash"></i> Remove
            </button>
          </div>
          <div class="form-group">
            <label>Question</label>
            <input type="text" name="quiz_questions[${questionId}][question]" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Option A</label>
              <input type="text" name="quiz_questions[${questionId}][option_a]" required>
            </div>
            <div class="form-group">
              <label>Option B</label>
              <input type="text" name="quiz_questions[${questionId}][option_b]" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Option C</label>
              <input type="text" name="quiz_questions[${questionId}][option_c]">
            </div>
            <div class="form-group">
              <label>Option D</label>
              <input type="text" name="quiz_questions[${questionId}][option_d]">
            </div>
          </div>
          <div class="form-group">
            <label>Correct Answer</label>
            <select name="quiz_questions[${questionId}][correct]" required>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </div>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', html);
      quizQuestionCount++;
    }
    window.addQuizQuestion = addQuizQuestion;

    function removeQuestion(id) {
      const element = document.getElementById(id);
      if (element) {
        element.remove();
      }
    }
    window.removeQuestion = removeQuestion;

    // Edit and Delete functions (to be implemented with routes)
    function editLesson(lessonId) {
      // Implement edit functionality
      console.log('Edit lesson:', lessonId);
    }
    window.editLesson = editLesson;

    function deleteLesson(lessonId) {
      if (confirm('Are you sure you want to delete this lesson? This action cannot be undone.')) {
        // Implement delete functionality
        console.log('Delete lesson:', lessonId);
      }
    }
    window.deleteLesson = deleteLesson;

    function editMaterial(materialId) {
      // Implement edit functionality
      console.log('Edit material:', materialId);
    }
    window.editMaterial = editMaterial;

    function deleteMaterial(materialId) {
      if (confirm('Are you sure you want to delete this material?')) {
        // Implement delete functionality
        console.log('Delete material:', materialId);
      }
    }
    window.deleteMaterial = deleteMaterial;

    // Close modal when clicking outside
    window.onclick = function(event) {
      if (event.target.classList.contains('modal')) {
        closeModal();
      }
    };

})();