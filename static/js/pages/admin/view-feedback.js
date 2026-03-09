/**
 * EduPath Admin View Feedback Page
 */

(function() {
    'use strict';

    window.setView = function(view) {
      const gridView = document.getElementById('gridView');
      const tableView = document.getElementById('tableView');
      const gridBtn = document.getElementById('gridViewBtn');
      const tableBtn = document.getElementById('tableViewBtn');
      
      if (view === 'grid') {
        gridView.style.display = 'grid';
        tableView.style.display = 'none';
        gridBtn.classList.add('active');
        tableBtn.classList.remove('active');
      } else {
        gridView.style.display = 'none';
        tableView.style.display = 'block';
        tableBtn.classList.add('active');
        gridBtn.classList.remove('active');
      }
    };

    document.addEventListener('DOMContentLoaded', function() {
      const searchInput = document.getElementById('searchInput');
      if (searchInput) {
        searchInput.addEventListener('keyup', function(e) {
          const searchTerm = e.target.value.toLowerCase();
          const cards = document.querySelectorAll('.feedback-card');
          
          cards.forEach(card => {
            const message = card.querySelector('.feedback-message')?.textContent.toLowerCase() || '';
            const userName = card.querySelector('.user-info h4')?.textContent.toLowerCase() || '';
            
            if (message.includes(searchTerm) || userName.includes(searchTerm)) {
              card.style.display = '';
            } else {
              card.style.display = 'none';
            }
          });
        });
      }

      document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', function(e) {
          e.preventDefault();
          const rating = this.textContent.trim().split(' ')[0];
          
          document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
          this.classList.add('active');
          
          if (rating === 'All') {
            document.querySelectorAll('.feedback-card').forEach(c => c.style.display = '');
          } else {
            document.querySelectorAll('.feedback-card').forEach(c => {
              const cardRating = c.dataset.rating;
              if (cardRating === rating) {
                c.style.display = '';
              } else {
                c.style.display = 'none';
              }
            });
          }
        });
      });
    });

})();