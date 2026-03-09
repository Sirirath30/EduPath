/**
 * EduPath Teacher Upload Content Page
 */

(function() {
    'use strict';

    //question counter
    let questionCount = 0;

    // showTab function
    function showTab(tab) {
      document.getElementById('video-tab').style.display = 'none';
      document.getElementById('quiz-tab').style.display = 'none';
      document.getElementById('assessment-tab').style.display = 'none';
      
      if (tab === 'video') {
        document.getElementById('video-tab').style.display = 'block';
        document.getElementById('upload-type').value = 'video';
      } else if (tab === 'document') {
        document.getElementById('video-tab').style.display = 'block';
        document.getElementById('upload-type').value = 'document';
      } else if (tab === 'quiz') {
        document.getElementById('quiz-tab').style.display = 'block';
      } else if (tab === 'assessment') {
        document.getElementById('assessment-tab').style.display = 'block';
      }
    }
    window.showTab = showTab;

    //addQuestion function
    function addQuestion() {
      const container = document.getElementById('questions-container');
      const questionHtml = `
        <div class="question-block" style="margin-bottom: 2rem; padding: 1rem; background: var(--background); border-radius: var(--radius);">
          <div class="form-group">
            <label>Question ${questionCount + 1}</label>
            <input type="text" name="questions[]" placeholder="Enter question" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>A</label>
              <input type="text" name="option_a_${questionCount}" placeholder="Option A" required>
            </div>
            <div class="form-group">
              <label>B</label>
              <input type="text" name="option_b_${questionCount}" placeholder="Option B" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>C</label>
              <input type="text" name="option_c_${questionCount}" placeholder="Option C" required>
            </div>
            <div class="form-group">
              <label>D</label>
              <input type="text" name="option_d_${questionCount}" placeholder="Option D" required>
            </div>
          </div>
          <div class="form-group">
            <label>Correct Answer</label>
            <select name="correct_${questionCount}" required>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </div>
        </div>
      `;
      
      container.insertAdjacentHTML('beforeend', questionHtml);
      questionCount++;
    }
    window.addQuestion = addQuestion;

    //toggleMenu function
    function toggleMenu() {
      const mobileMenu = document.getElementById('mobileMenu');
      if (mobileMenu) {
        mobileMenu.classList.toggle('open');
      }
    }
    window.toggleMenu = toggleMenu;

    // Show video tab by default when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
      showTab('video');
    });

})();