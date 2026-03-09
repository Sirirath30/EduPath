
/**
 * EduPath Teacher Dashboard
 * Handles tab switching, uploads, and content management
 * Version: 1.0.0
 */

(function() {
    'use strict';

    class TeacherDashboard {
        constructor() {
            this.questionCount = 0;
            this.quickQuestionCount = 0;
            this.currentDeleteId = null;
            this.currentDeleteType = null;
            
            this.init();
        }

        init() {
            this.initTabs();
            this.initQuestionBuilders();
            this.initDeleteModal();
            this.initFileUploads();
            this.initMobileMenu();
        }

        // ==================== TAB SWITCHING ====================

        initTabs() {
            // Check URL hash on load
            if (window.location.hash) {
                const hash = window.location.hash.substring(1);
                if (hash === 'upload-video' || hash === 'upload-document') {
                    this.showTab(hash);
                }
            }
        }

        showTab(tabName) {
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show selected tab
            const selectedTab = document.getElementById(tabName + '-tab');
            if (selectedTab) {
                selectedTab.classList.add('active');
            }
            
            // Update tab buttons
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.textContent.toLowerCase().includes(tabName.replace('-', ' '))) {
                    btn.classList.add('active');
                }
            });

            // Hide mobile menu if open
            const mobileMenu = document.getElementById('mobileMenu');
            if (mobileMenu) mobileMenu.hidden = true;
        }

        // ==================== UPLOAD TO COURSE ====================

        uploadToCourse(courseId, type) {
            this.showTab('upload-' + type);
            
            // Select the correct course in dropdown
            setTimeout(() => {
                const selectId = type === 'video' ? 'video_course_select' : 'document_course_select';
                const select = document.getElementById(selectId);
                
                if (select) {
                    for (let i = 0; i < select.options.length; i++) {
                        if (select.options[i].value == courseId) {
                            select.selectedIndex = i;
                            break;
                        }
                    }
                }
            }, 300);
        }

        createQuizForCourse(courseId) {
            this.showTab('upload-document');
            
            setTimeout(() => {
                const select = document.getElementById('quiz_course_select');
                if (select) {
                    for (let i = 0; i < select.options.length; i++) {
                        if (select.options[i].value == courseId) {
                            select.selectedIndex = i;
                            break;
                        }
                    }
                }
            }, 300);
        }

        // ==================== QUESTION BUILDERS ====================

        initQuestionBuilders() {
            // Make functions globally available
            window.addQuestionField = () => this.addQuestionField();
            window.removeQuestion = (id) => this.removeQuestion(id);
            window.addQuickQuestion = () => this.addQuickQuestion();
            window.removeQuickQuestion = (id) => this.removeQuickQuestion(id);
        }

        addQuestionField() {
            const container = document.getElementById('questions-container');
            if (!container) return;
            
            const id = this.questionCount;
            const html = `
                <div class="question-builder" id="q-${id}" style="margin-bottom: 1rem; padding: 1rem; background: var(--secondary); border-radius: var(--radius);">
                    <div class="question-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <strong>Question ${this.questionCount + 1}</strong>
                        <button type="button" class="btn-danger" onclick="removeQuestion(${id})" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">✕ Remove</button>
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label>Timestamp (seconds)</label>
                        <input type="number" name="questions[${id}][timestamp]" min="0" required class="form-control" placeholder="e.g., 120">
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label>Question</label>
                        <input type="text" name="questions[${id}][question]" class="form-control" placeholder="Enter your question" required>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1rem;">
                        <div>
                            <label>Option A</label>
                            <div style="display: flex; gap: 0.5rem;">
                                <input type="radio" name="questions[${id}][correct]" value="A" required>
                                <input type="text" name="questions[${id}][option_a]" class="form-control" placeholder="Option A" required>
                            </div>
                        </div>
                        <div>
                            <label>Option B</label>
                            <div style="display: flex; gap: 0.5rem;">
                                <input type="radio" name="questions[${id}][correct]" value="B">
                                <input type="text" name="questions[${id}][option_b]" class="form-control" placeholder="Option B" required>
                            </div>
                        </div>
                        <div>
                            <label>Option C (optional)</label>
                            <div style="display: flex; gap: 0.5rem;">
                                <input type="radio" name="questions[${id}][correct]" value="C">
                                <input type="text" name="questions[${id}][option_c]" class="form-control" placeholder="Option C">
                            </div>
                        </div>
                        <div>
                            <label>Option D (optional)</label>
                            <div style="display: flex; gap: 0.5rem;">
                                <input type="radio" name="questions[${id}][correct]" value="D">
                                <input type="text" name="questions[${id}][option_d]" class="form-control" placeholder="Option D">
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Points</label>
                        <input type="number" name="questions[${id}][points]" value="1" min="1" class="form-control">
                    </div>
                </div>
            `;
            
            container.insertAdjacentHTML('beforeend', html);
            this.questionCount++;
        }

        removeQuestion(id) {
            const element = document.getElementById(`q-${id}`);
            if (element) {
                element.style.transition = 'all 0.3s ease';
                element.style.opacity = '0';
                element.style.transform = 'translateX(20px)';
                setTimeout(() => element.remove(), 300);
            }
        }

        addQuickQuestion() {
            const container = document.getElementById('quick-questions-container');
            if (!container) return;
            
            const id = this.quickQuestionCount;
            const html = `
                <div class="question-builder" id="qq-${id}" style="margin-bottom: 1rem; padding: 1rem; background: var(--secondary); border-radius: var(--radius);">
                    <div class="question-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <strong>Question ${this.quickQuestionCount + 1}</strong>
                        <button type="button" class="btn-danger" onclick="removeQuickQuestion(${id})" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">✕ Remove</button>
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label>Question</label>
                        <input type="text" name="quick_questions[${id}][question]" class="form-control" placeholder="Enter your question" required>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1rem;">
                        <div>
                            <label>Option A</label>
                            <div style="display: flex; gap: 0.5rem;">
                                <input type="radio" name="quick_questions[${id}][correct]" value="A" required>
                                <input type="text" name="quick_questions[${id}][option_a]" class="form-control" placeholder="Option A" required>
                            </div>
                        </div>
                        <div>
                            <label>Option B</label>
                            <div style="display: flex; gap: 0.5rem;">
                                <input type="radio" name="quick_questions[${id}][correct]" value="B">
                                <input type="text" name="quick_questions[${id}][option_b]" class="form-control" placeholder="Option B" required>
                            </div>
                        </div>
                        <div>
                            <label>Option C (optional)</label>
                            <div style="display: flex; gap: 0.5rem;">
                                <input type="radio" name="quick_questions[${id}][correct]" value="C">
                                <input type="text" name="quick_questions[${id}][option_c]" class="form-control" placeholder="Option C">
                            </div>
                        </div>
                        <div>
                            <label>Option D (optional)</label>
                            <div style="display: flex; gap: 0.5rem;">
                                <input type="radio" name="quick_questions[${id}][correct]" value="D">
                                <input type="text" name="quick_questions[${id}][option_d]" class="form-control" placeholder="Option D">
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Points</label>
                        <input type="number" name="quick_questions[${id}][points]" value="1" min="1" class="form-control">
                    </div>
                </div>
            `;
            
            container.insertAdjacentHTML('beforeend', html);
            this.quickQuestionCount++;
        }

        removeQuickQuestion(id) {
            const element = document.getElementById(`qq-${id}`);
            if (element) {
                element.style.transition = 'all 0.3s ease';
                element.style.opacity = '0';
                element.style.transform = 'translateX(20px)';
                setTimeout(() => element.remove(), 300);
            }
        }

        // ==================== FILE UPLOAD LABELS ====================

        initFileUploads() {
            window.updateUploadLabel = (input, type) => {
                const uploadArea = input.previousElementSibling;
                if (!uploadArea) return;
                
                const fileName = input.files[0] ? input.files[0].name : 'No file chosen';
                const p = uploadArea.querySelector('p');
                if (p) {
                    p.textContent = 'Selected: ' + fileName;
                }
            };
        }

        // ==================== DELETE MODAL ====================

        initDeleteModal() {
            window.showDeleteModal = (id, title, type) => this.showDeleteModal(id, title, type);
            window.closeDeleteModal = () => this.closeDeleteModal();
            window.confirmDelete = () => this.confirmDelete();
        }

        showDeleteModal(id, title, type) {
            this.currentDeleteId = id;
            this.currentDeleteType = type;
            
            const modal = document.getElementById('deleteModal');
            const message = document.getElementById('deleteMessage');
            const details = document.getElementById('deleteDetails');
            
            if (!modal) return;
            
            let typeName = type;
            if (type === 'video_quiz') typeName = 'interactive video quiz';
            else if (type === 'quiz') typeName = 'quiz';
            else typeName = 'material';
            
            if (message) message.textContent = `Are you sure you want to delete "${title}"?`;
            if (details) details.textContent = `This ${typeName} will be permanently removed and cannot be undone.`;
            
            modal.style.display = 'flex';
        }

        closeDeleteModal() {
            const modal = document.getElementById('deleteModal');
            if (modal) modal.style.display = 'none';
            this.currentDeleteId = null;
            this.currentDeleteType = null;
        }

        async confirmDelete() {
            if (!this.currentDeleteId) return;
            
            const confirmBtn = document.getElementById('confirmDeleteBtn');
            const originalText = confirmBtn?.innerHTML || '';
            
            if (confirmBtn) {
                confirmBtn.innerHTML = '<i class="bi bi-spinner spinning"></i> Deleting...';
                confirmBtn.disabled = true;
            }
            
            // Determine endpoint
            let url = '';
            if (this.currentDeleteType === 'quiz') {
                url = `/teacher/quiz/${this.currentDeleteId}/delete`;
            } else if (this.currentDeleteType === 'video_quiz') {
                url = `/teacher/video-quiz/${this.currentDeleteId}/delete`;
            } else {
                url = `/teacher/material/${this.currentDeleteId}/delete`;
            }
            
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Remove item from DOM
                    const elementId = this.currentDeleteType === 'quiz' ? 
                        `quiz-${this.currentDeleteId}` : `material-${this.currentDeleteId}`;
                    const element = document.getElementById(elementId);
                    
                    if (element) {
                        element.classList.add('fade-out');
                        setTimeout(() => {
                            element.remove();
                            if (window.notification) {
                                window.notification.success('Item deleted successfully');
                            } else {
                                alert('✅ Item deleted successfully');
                            }
                        }, 300);
                    }
                    this.closeDeleteModal();
                } else {
                    if (window.notification) {
                        window.notification.error('Error: ' + data.error);
                    } else {
                        alert('❌ Error: ' + data.error);
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                if (window.notification) {
                    window.notification.error('Failed to delete item');
                } else {
                    alert('❌ Failed to delete item');
                }
            } finally {
                if (confirmBtn) {
                    confirmBtn.innerHTML = originalText;
                    confirmBtn.disabled = false;
                }
            }
        }

        // ==================== MOBILE MENU ====================

        initMobileMenu() {
            // Make toggleMenu globally available
            window.toggleMenu = () => {
                const menu = document.getElementById('mobileMenu');
                if (menu) {
                    menu.hidden = !menu.hidden;
                }
            };
            
            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                const menu = document.getElementById('mobileMenu');
                const toggle = document.querySelector('.mobile-toggle');
                
                if (menu && !menu.hidden && 
                    !menu.contains(e.target) && 
                    toggle && !toggle.contains(e.target)) {
                    menu.hidden = true;
                }
            });
        }
    }

    // Initialize on page load
    document.addEventListener('DOMContentLoaded', () => {
        // Make functions globally available for onclick events
        const dashboard = new TeacherDashboard();
        
        window.showTab = (tabName) => dashboard.showTab(tabName);
        window.uploadToCourse = (courseId, type) => dashboard.uploadToCourse(courseId, type);
        window.createQuizForCourse = (courseId) => dashboard.createQuizForCourse(courseId);
    });

})();
// /**
//  * EduPath Admin Dashboard
//  * Complete functionality for admin dashboard including teacher management
//  * Version: 1.0.0
//  */

// (function() {
//     'use strict';

//     /**
//      * Main Admin Dashboard Class
//      */
//     class AdminDashboard {
//         constructor() {
//             // Initialize all components
//             this.init();
//         }

//         /**
//          * Initialize all dashboard functionality
//          */
//         init() {
//             console.log('Admin Dashboard initializing...');
            
//             this.initViewToggle();
//             this.initSearch();
//             this.initFilters();
//             this.initAlerts();
//             this.initCharts();
//             this.initTeacherActions();
//             this.initMobileMenu();
//             this.initBulkActions();
//         }

//         // ==================== VIEW TOGGLE (GRID/TABLE) ====================

//         /**
//          * Initialize view toggle buttons
//          */
//         initViewToggle() {
//             const gridBtn = document.getElementById('gridViewBtn');
//             const tableBtn = document.getElementById('tableViewBtn');
            
//             if (!gridBtn || !tableBtn) return;
            
//             gridBtn.addEventListener('click', () => this.setView('grid'));
//             tableBtn.addEventListener('click', () => this.setView('table'));
            
//             // Load saved preference
//             const savedView = EduPath.storage.get('admin_view') || 'grid';
//             this.setView(savedView);
//         }

//         /**
//          * Set current view (grid or table)
//          * @param {string} view - 'grid' or 'table'
//          */
//         setView(view) {
//             const gridView = document.getElementById('gridView');
//             const tableView = document.getElementById('tableView');
//             const gridBtn = document.getElementById('gridViewBtn');
//             const tableBtn = document.getElementById('tableViewBtn');
            
//             if (view === 'grid') {
//                 if (gridView) gridView.style.display = 'grid';
//                 if (tableView) tableView.style.display = 'none';
//                 if (gridBtn) gridBtn.classList.add('active');
//                 if (tableBtn) tableBtn.classList.remove('active');
//                 EduPath.storage.set('admin_view', 'grid');
//             } else {
//                 if (gridView) gridView.style.display = 'none';
//                 if (tableView) tableView.style.display = 'block';
//                 if (tableBtn) tableBtn.classList.add('active');
//                 if (gridBtn) gridBtn.classList.remove('active');
//                 EduPath.storage.set('admin_view', 'table');
//             }
//         }

//         // ==================== SEARCH FUNCTIONALITY ====================

//         /**
//          * Initialize search input with debounce
//          */
//         initSearch() {
//             const searchInput = document.getElementById('searchInput');
//             if (!searchInput) return;
            
//             searchInput.addEventListener('keyup', EduPath.debounce((e) => {
//                 const term = e.target.value.toLowerCase().trim();
//                 this.performSearch(term);
//             }, 300));
//         }

//         /**
//          * Perform search across all cards and items
//          * @param {string} term - Search term
//          */
//         performSearch(term) {
//             // Select all searchable elements
//             const searchableItems = document.querySelectorAll(
//                 '.feedback-card, .user-card, .course-card, .registration-item, .teacher-item'
//             );
            
//             let visibleCount = 0;
            
//             searchableItems.forEach(item => {
//                 const text = item.textContent.toLowerCase();
//                 const matches = term === '' || text.includes(term);
                
//                 item.style.display = matches ? '' : 'none';
//                 if (matches) visibleCount++;
//             });
            
//             // Show/hide no results message
//             const noResults = document.getElementById('noResults');
//             if (noResults) {
//                 noResults.style.display = visibleCount === 0 ? 'block' : 'none';
//             }
//         }

//         // ==================== FILTERS ====================

//         /**
//          * Initialize filter tabs and buttons
//          */
//         initFilters() {
//             document.querySelectorAll('.filter-tab, .filter-btn').forEach(filter => {
//                 filter.addEventListener('click', (e) => {
//                     e.preventDefault();
//                     this.applyFilter(filter);
//                 });
//             });
//         }

//         /**
//          * Apply selected filter
//          * @param {HTMLElement} filter - Filter element clicked
//          */
//         applyFilter(filter) {
//             // Update active state
//             const container = filter.closest('.filter-tabs') || filter.parentElement;
//             if (container) {
//                 container.querySelectorAll('.filter-tab, .filter-btn').forEach(f => {
//                     f.classList.remove('active');
//                 });
//             }
//             filter.classList.add('active');
            
//             // Get filter value
//             const filterValue = filter.dataset.filter || filter.textContent.trim();
            
//             // Apply filter to cards
//             const cards = document.querySelectorAll('.feedback-card, .user-card, .teacher-item');
            
//             cards.forEach(card => {
//                 if (filterValue === 'All' || filterValue === 'all') {
//                     card.style.display = '';
//                 } else if (card.dataset.rating === filterValue) {
//                     card.style.display = '';
//                 } else if (card.dataset.status?.toLowerCase() === filterValue.toLowerCase()) {
//                     card.style.display = '';
//                 } else if (card.dataset.role?.toLowerCase() === filterValue.toLowerCase()) {
//                     card.style.display = '';
//                 } else if (card.dataset.subject === filterValue) {
//                     card.style.display = '';
//                 } else {
//                     card.style.display = 'none';
//                 }
//             });
//         }

//         // ==================== ALERTS ====================

//         /**
//          * Initialize auto-hiding alerts
//          */
//         initAlerts() {
//             document.querySelectorAll('.alert').forEach(alert => {
//                 // Auto hide after 5 seconds
//                 setTimeout(() => {
//                     if (alert.parentElement) {
//                         alert.style.transition = 'opacity 0.5s';
//                         alert.style.opacity = '0';
//                         setTimeout(() => {
//                             if (alert.parentElement) {
//                                 alert.remove();
//                             }
//                         }, 500);
//                     }
//                 }, 5000);
                
//                 // Add close button if not present
//                 if (!alert.querySelector('.close')) {
//                     const closeBtn = document.createElement('button');
//                     closeBtn.className = 'close';
//                     closeBtn.innerHTML = '&times;';
//                     closeBtn.setAttribute('aria-label', 'Close');
//                     closeBtn.addEventListener('click', () => alert.remove());
//                     alert.appendChild(closeBtn);
//                 }
//             });
//         }

//         // ==================== CHARTS ====================

//         /**
//          * Initialize charts if Chart.js is available
//          */
//         initCharts() {
//             if (typeof Chart === 'undefined') {
//                 console.log('Chart.js not loaded, skipping charts');
//                 return;
//             }
            
//             this.initUserChart();
//             this.initCourseChart();
//         }

//         /**
//          * Initialize user statistics chart
//          */
//         initUserChart() {
//             const userChart = document.getElementById('userChart');
//             if (!userChart) return;
            
//             // Get data from data attributes if available
//             const labels = userChart.dataset.labels?.split(',') || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
//             const data = userChart.dataset.data?.split(',').map(Number) || [12, 19, 3, 5, 2, 3];
            
//             new Chart(userChart, {
//                 type: 'line',
//                 data: {
//                     labels: labels,
//                     datasets: [{
//                         label: 'New Users',
//                         data: data,
//                         borderColor: '#3b82f6',
//                         backgroundColor: 'rgba(59, 130, 246, 0.1)',
//                         tension: 0.4,
//                         fill: true
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     maintainAspectRatio: false,
//                     plugins: {
//                         legend: {
//                             display: false
//                         }
//                     }
//                 }
//             });
//         }

//         /**
//          * Initialize course statistics chart
//          */
//         initCourseChart() {
//             const courseChart = document.getElementById('courseChart');
//             if (!courseChart) return;
            
//             // Get data from data attributes if available
//             const data = courseChart.dataset.data?.split(',').map(Number) || [65, 25, 10];
            
//             new Chart(courseChart, {
//                 type: 'doughnut',
//                 data: {
//                     labels: ['Active', 'Completed', 'Dropped'],
//                     datasets: [{
//                         data: data,
//                         backgroundColor: ['#10b981', '#3b82f6', '#ef4444'],
//                         borderWidth: 0
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     maintainAspectRatio: false,
//                     plugins: {
//                         legend: {
//                             position: 'bottom'
//                         }
//                     },
//                     cutout: '70%'
//                 }
//             });
//         }

//         // ==================== TEACHER ACTIONS ====================

//         /**
//          * Initialize teacher action buttons
//          */
//         initTeacherActions() {
//             // Make functions globally available for onclick events
//             window.sendTeacherReset = (teacherId) => this.sendTeacherReset(teacherId);
//             window.viewTeacherDetails = (teacherId) => this.viewTeacherDetails(teacherId);
//             window.editTeacher = (teacherId) => this.editTeacher(teacherId);
//             window.deleteTeacher = (teacherId) => this.deleteTeacher(teacherId);
//         }

//         /**
//          * Send password reset email to teacher
//          * @param {number} teacherId - Teacher ID
//          */
//         async sendTeacherReset(teacherId) {
//             if (!confirm('Send password reset email to this teacher? They will receive a link to set their password.')) {
//                 return;
//             }
            
//             const button = event?.currentTarget;
//             const originalHtml = button?.innerHTML || '<i class="bi bi-envelope-paper"></i>';
            
//             if (button) {
//                 button.innerHTML = '<i class="bi bi-spinner spinning"></i>';
//                 button.disabled = true;
//             }
            
//             try {
//                 const response = await fetch(`/admin/teacher/${teacherId}/send-reset`, {
//                     method: 'POST',
//                     headers: {
//                         'X-Requested-With': 'XMLHttpRequest',
//                         'Content-Type': 'application/json'
//                     }
//                 });
                
//                 const data = await response.json();
                
//                 if (data.success) {
//                     // Show success notification
//                     if (window.notification) {
//                         window.notification.success(data.message || 'Reset email sent!');
//                     } else {
//                         alert('✅ ' + (data.message || 'Reset email sent!'));
//                     }
                    
//                     // Visual feedback on button
//                     if (button) {
//                         button.style.color = 'var(--success)';
//                         setTimeout(() => {
//                             button.style.color = '';
//                         }, 3000);
//                     }
//                 } else {
//                     // Show error notification
//                     if (window.notification) {
//                         window.notification.error(data.error || 'Failed to send email');
//                     } else {
//                         alert('❌ ' + (data.error || 'Failed to send email'));
//                     }
//                 }
//             } catch (error) {
//                 console.error('Error sending reset email:', error);
                
//                 if (window.notification) {
//                     window.notification.error('Network error. Please try again.');
//                 } else {
//                     alert('❌ Network error. Please try again.');
//                 }
//             } finally {
//                 if (button) {
//                     button.innerHTML = originalHtml;
//                     button.disabled = false;
//                 }
//             }
//         }

//         /**
//          * View teacher details (placeholder)
//          * @param {number} teacherId - Teacher ID
//          */
//         viewTeacherDetails(teacherId) {
//             // You can implement a modal or redirect to teacher details page
//             if (window.notification) {
//                 window.notification.info(`Viewing teacher #${teacherId} - Coming soon!`);
//             } else {
//                 alert(`View teacher #${teacherId} - Coming soon!`);
//             }
//         }

//         /**
//          * Edit teacher (placeholder)
//          * @param {number} teacherId - Teacher ID
//          */
//         editTeacher(teacherId) {
//             if (window.notification) {
//                 window.notification.info(`Edit teacher #${teacherId} - Coming soon!`);
//             } else {
//                 alert(`Edit teacher #${teacherId} - Coming soon!`);
//             }
//         }

//         /**
//          * Delete teacher with confirmation
//          * @param {number} teacherId - Teacher ID
//          */
//         async deleteTeacher(teacherId) {
//             if (!confirm('⚠️ Are you sure you want to delete this teacher? This action cannot be undone.')) {
//                 return;
//             }
            
//             const button = event?.currentTarget;
//             const originalHtml = button?.innerHTML || '<i class="bi bi-trash"></i>';
            
//             if (button) {
//                 button.innerHTML = '<i class="bi bi-spinner spinning"></i>';
//                 button.disabled = true;
//             }
            
//             try {
//                 const response = await fetch(`/admin/teacher/${teacherId}/delete`, {
//                     method: 'POST',
//                     headers: {
//                         'X-Requested-With': 'XMLHttpRequest',
//                         'Content-Type': 'application/json'
//                     }
//                 });
                
//                 const data = await response.json();
                
//                 if (data.success) {
//                     // Remove teacher from DOM
//                     const teacherElement = document.getElementById(`teacher-${teacherId}`);
//                     if (teacherElement) {
//                         teacherElement.classList.add('fade-out');
//                         setTimeout(() => {
//                             teacherElement.remove();
                            
//                             // Update teacher count
//                             const teacherCount = document.querySelectorAll('.teacher-item').length;
//                             const countBadge = document.querySelector('.card-badge');
//                             if (countBadge) {
//                                 countBadge.textContent = `${teacherCount} total`;
//                             }
//                         }, 300);
//                     }
                    
//                     if (window.notification) {
//                         window.notification.success('Teacher deleted successfully');
//                     } else {
//                         alert('✅ Teacher deleted successfully');
//                     }
//                 } else {
//                     if (window.notification) {
//                         window.notification.error(data.error || 'Failed to delete teacher');
//                     } else {
//                         alert('❌ ' + (data.error || 'Failed to delete teacher'));
//                     }
//                 }
//             } catch (error) {
//                 console.error('Error deleting teacher:', error);
                
//                 if (window.notification) {
//                     window.notification.error('Network error. Please try again.');
//                 } else {
//                     alert('❌ Network error. Please try again.');
//                 }
//             } finally {
//                 if (button) {
//                     button.innerHTML = originalHtml;
//                     button.disabled = false;
//                 }
//             }
//         }

//         // ==================== BULK ACTIONS ====================

//         /**
//          * Initialize bulk action checkboxes
//          */
//         initBulkActions() {
//             const selectAll = document.getElementById('selectAll');
//             if (!selectAll) return;
            
//             selectAll.addEventListener('change', () => this.toggleSelectAll(selectAll.checked));
            
//             // Make bulk action functions globally available
//             window.selectAll = () => this.toggleSelectAll(true);
//             window.deselectAll = () => this.toggleSelectAll(false);
//             window.bulkAction = (action) => this.performBulkAction(action);
//         }

//         /**
//          * Toggle select all checkboxes
//          * @param {boolean} checked - Checked state
//          */
//         toggleSelectAll(checked) {
//             document.querySelectorAll('.select-item').forEach(cb => {
//                 cb.checked = checked;
//             });
//         }

//         /**
//          * Perform bulk action on selected items
//          * @param {string} action - Action to perform
//          */
//         performBulkAction(action) {
//             const selected = Array.from(document.querySelectorAll('.select-item:checked'))
//                 .map(cb => cb.value);
            
//             if (selected.length === 0) {
//                 if (window.notification) {
//                     window.notification.warning('Please select items');
//                 } else {
//                     alert('Please select items');
//                 }
//                 return;
//             }
            
//             const confirmMessage = `Are you sure you want to ${action} ${selected.length} item(s)?`;
            
//             if (!confirm(confirmMessage)) return;
            
//             // Log for now - implement actual bulk actions later
//             console.log('Bulk action:', action, selected);
            
//             if (window.notification) {
//                 window.notification.success(`Bulk ${action} completed (demo)`);
//             } else {
//                 alert(`✅ Bulk ${action} completed (demo)`);
//             }
//         }

//         // ==================== MOBILE MENU ====================

//         /**
//          * Initialize mobile menu functionality
//          */
//         initMobileMenu() {
//             // Make toggleMenu globally available if not already
//             if (typeof window.toggleMenu !== 'function') {
//                 window.toggleMenu = () => {
//                     const menu = document.getElementById('mobileMenu');
//                     if (menu) {
//                         menu.hidden = !menu.hidden;
//                     }
//                 };
//             }
            
//             // Close menu when clicking outside
//             document.addEventListener('click', (e) => {
//                 const menu = document.getElementById('mobileMenu');
//                 const toggle = document.querySelector('.mobile-toggle');
                
//                 if (menu && !menu.hidden && 
//                     !menu.contains(e.target) && 
//                     toggle && !toggle.contains(e.target)) {
//                     menu.hidden = true;
//                 }
//             });
//         }
//     }

//     // ==================== NOTIFICATION SYSTEM ====================

//     /**
//      * Simple notification system if not already available
//      */
//     if (!window.notification) {
//         window.notification = {
//             success: function(message) {
//                 this.show(message, 'success');
//             },
//             error: function(message) {
//                 this.show(message, 'error');
//             },
//             warning: function(message) {
//                 this.show(message, 'warning');
//             },
//             info: function(message) {
//                 this.show(message, 'info');
//             },
//             show: function(message, type) {
//                 const container = document.getElementById('notificationContainer') || this.createContainer();
                
//                 const notification = document.createElement('div');
//                 notification.className = `notification ${type}`;
//                 notification.innerHTML = `
//                     <div style="display: flex; align-items: center; gap: 0.5rem;">
//                         <i class="bi ${this.getIcon(type)}"></i>
//                         <span>${message}</span>
//                         <button onclick="this.parentElement.parentElement.remove()" 
//                                 style="background: none; border: none; color: inherit; margin-left: 1rem; cursor: pointer;">✕</button>
//                     </div>
//                 `;
                
//                 container.appendChild(notification);
                
//                 setTimeout(() => {
//                     if (notification.parentElement) {
//                         notification.style.animation = 'slideOut 0.3s ease';
//                         setTimeout(() => notification.remove(), 300);
//                     }
//                 }, 5000);
//             },
//             createContainer: function() {
//                 const container = document.createElement('div');
//                 container.id = 'notificationContainer';
//                 container.style.cssText = `
//                     position: fixed;
//                     top: 20px;
//                     right: 20px;
//                     z-index: 10001;
//                     display: flex;
//                     flex-direction: column;
//                     gap: 10px;
//                     max-width: 400px;
//                 `;
//                 document.body.appendChild(container);
//                 return container;
//             },
//             getIcon: function(type) {
//                 const icons = {
//                     success: 'bi-check-circle-fill',
//                     error: 'bi-exclamation-circle-fill',
//                     warning: 'bi-exclamation-triangle-fill',
//                     info: 'bi-info-circle-fill'
//                 };
//                 return icons[type] || 'bi-info-circle-fill';
//             }
//         };
        
//         // Add animation styles
//         const style = document.createElement('style');
//         style.textContent = `
//             @keyframes slideOut {
//                 from { transform: translateX(0); opacity: 1; }
//                 to { transform: translateX(100%); opacity: 0; }
//             }
//             .notification {
//                 padding: 1rem 1.5rem;
//                 border-radius: 0.5rem;
//                 background: white;
//                 box-shadow: 0 4px 12px rgba(0,0,0,0.15);
//                 animation: slideIn 0.3s ease;
//             }
//             .notification.success { background: #10b981; color: white; }
//             .notification.error { background: #ef4444; color: white; }
//             .notification.warning { background: #f59e0b; color: white; }
//             .notification.info { background: #3b82f6; color: white; }
//         `;
//         document.head.appendChild(style);
//     }

//     // ==================== INITIALIZATION ====================

//     // Initialize when DOM is ready
//     document.addEventListener('DOMContentLoaded', () => {
//         new AdminDashboard();
//     });

// })();