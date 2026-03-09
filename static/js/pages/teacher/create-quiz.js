/**
 * EduPath Teacher Create Quiz Page
 */

(function() {
    'use strict';

    //question counter
    let questionCount = 0;

    //addQuestion function
    function addQuestion() {
      const container = document.getElementById('questions');
      const questionHtml = `
        <div class="question-block" style="margin-bottom: 2rem; padding: 1rem; background: var(--background); border-radius: var(--radius);">
          <h4>Question ${questionCount + 1}</h4>
          <div class="form-group">
            <label>Question Text</label>
            <input type="text" name="questions[${questionCount}]" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Option A</label>
              <input type="text" name="options[${questionCount}][a]" required>
            </div>
            <div class="form-group">
              <label>Option B</label>
              <input type="text" name="options[${questionCount}][b]" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Option C</label>
              <input type="text" name="options[${questionCount}][c]" required>
            </div>
            <div class="form-group">
              <label>Option D</label>
              <input type="text" name="options[${questionCount}][d]" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Correct Answer</label>
              <select name="correct[${questionCount}]" required>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
            <div class="form-group">
              <label>Points</label>
              <input type="number" name="points[${questionCount}]" value="1" min="1" max="10">
            </div>
          </div>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', questionHtml);
      questionCount++;
    }
    window.addQuestion = addQuestion;

    // toggleMenu function
    function toggleMenu() {
      const mobileMenu = document.getElementById('mobileMenu');
      if (mobileMenu) {
        mobileMenu.classList.toggle('open');
      }
    }
    window.toggleMenu = toggleMenu;

    // Add first question by default
    document.addEventListener('DOMContentLoaded', function() {
      addQuestion();
    });

})();