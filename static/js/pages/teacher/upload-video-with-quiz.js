/**
 * EduPath Teacher Upload Video with Quiz Page
 */

(function() {
    'use strict';

    // question counter
    let questionCount = 0;
    
    //addQuestionField function
    function addQuestionField() {
      const container = document.getElementById('questions-container');
      const html = `
        <div class="question-block" style="border:1px solid #ccc; padding:15px; margin:10px 0;">
          <h4>Question ${questionCount + 1}</h4>
          
          <div class="form-group">
            <label>Timestamp (in seconds)</label>
            <input type="number" name="questions[${questionCount}][timestamp]" min="0" step="1" required>
            <small>At what second should this question appear?</small>
          </div>
          
          <div class="form-group">
            <label>Question</label>
            <input type="text" name="questions[${questionCount}][question]" required>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Option A</label>
              <input type="text" name="questions[${questionCount}][option_a]" required>
            </div>
            <div class="form-group">
              <label>Option B</label>
              <input type="text" name="questions[${questionCount}][option_b]" required>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Option C (optional)</label>
              <input type="text" name="questions[${questionCount}][option_c]">
            </div>
            <div class="form-group">
              <label>Option D (optional)</label>
              <input type="text" name="questions[${questionCount}][option_d]">
            </div>
          </div>
          
          <div class="form-group">
            <label>Correct Answer</label>
            <select name="questions[${questionCount}][correct]" required>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Points</label>
            <input type="number" name="questions[${questionCount}][points]" value="1" min="1" max="10">
          </div>
          
          <button type="button" onclick="this.parentElement.remove()" class="btn-danger">Remove</button>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', html);
      questionCount++;
    }
    
    // Make function globally available
    window.addQuestionField = addQuestionField;

    // Optional: Add first question by default when page loads
    document.addEventListener('DOMContentLoaded', function() {
      // Check if container exists and has no questions yet
      const container = document.getElementById('questions-container');
      if (container && container.children.length === 0) {
        addQuestionField();
      }
    });

})();