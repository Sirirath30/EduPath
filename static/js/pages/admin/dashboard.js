/**
 * EduPath Admin Dashboard
 */

(function() {
    'use strict';
    
    class AdminDashboard {
        constructor() {
            this.init();
        }
        
        init() {
            this.initViewToggle();
            this.initSearch();
            this.initFilters();
            this.initAlerts();
            this.initCharts();
        }
        
        initViewToggle() {
            const gridBtn = document.getElementById('gridViewBtn');
            const tableBtn = document.getElementById('tableViewBtn');
            
            if (gridBtn && tableBtn) {
                gridBtn.addEventListener('click', () => this.setView('grid'));
                tableBtn.addEventListener('click', () => this.setView('table'));
            }
        }
        
        setView(view) {
            const gridView = document.getElementById('gridView');
            const tableView = document.getElementById('tableView');
            const gridBtn = document.getElementById('gridViewBtn');
            const tableBtn = document.getElementById('tableViewBtn');
            
            if (view === 'grid') {
                if (gridView) gridView.style.display = 'grid';
                if (tableView) tableView.style.display = 'none';
                if (gridBtn) gridBtn.classList.add('active');
                if (tableBtn) tableBtn.classList.remove('active');
                EduPath.storage.set('admin_view', 'grid');
            } else {
                if (gridView) gridView.style.display = 'none';
                if (tableView) tableView.style.display = 'block';
                if (tableBtn) tableBtn.classList.add('active');
                if (gridBtn) gridBtn.classList.remove('active');
                EduPath.storage.set('admin_view', 'table');
            }
        }
        
        initSearch() {
            const searchInput = document.getElementById('searchInput');
            if (!searchInput) return;
            
            searchInput.addEventListener('keyup', EduPath.debounce((e) => {
                const term = e.target.value.toLowerCase();
                const cards = document.querySelectorAll('.feedback-card, .user-card, .course-card');
                
                cards.forEach(card => {
                    const text = card.textContent.toLowerCase();
                    card.style.display = text.includes(term) ? '' : 'none';
                });
                
                // Show no results message
                const visible = Array.from(cards).filter(c => c.style.display !== 'none').length;
                const noResults = document.getElementById('noResults');
                if (noResults) {
                    noResults.style.display = visible === 0 ? 'block' : 'none';
                }
            }, 300));
        }
        
        initFilters() {
            document.querySelectorAll('.filter-tab, .filter-btn').forEach(filter => {
                filter.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    // Update active state
                    filter.parentElement.querySelectorAll('.filter-tab, .filter-btn').forEach(f => {
                        f.classList.remove('active');
                    });
                    filter.classList.add('active');
                    
                    const filterValue = filter.dataset.filter || filter.textContent.trim();
                    this.applyFilter(filterValue);
                });
            });
        }
        
        applyFilter(filter) {
            const cards = document.querySelectorAll('.feedback-card, .user-card');
            
            cards.forEach(card => {
                if (filter === 'All' || filter === 'all') {
                    card.style.display = '';
                } else if (card.dataset.rating === filter) {
                    card.style.display = '';
                } else if (card.dataset.status === filter.toLowerCase()) {
                    card.style.display = '';
                } else if (card.dataset.role === filter.toLowerCase()) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        }
        
        initAlerts() {
            document.querySelectorAll('.alert').forEach(alert => {
                setTimeout(() => {
                    alert.style.transition = 'opacity 0.5s';
                    alert.style.opacity = '0';
                    setTimeout(() => alert.remove(), 500);
                }, 5000);
                
                // Close button
                const closeBtn = alert.querySelector('.close');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => alert.remove());
                }
            });
        }
        
        initCharts() {
            // Initialize charts if Chart.js is available
            if (typeof Chart === 'undefined') return;
            
            const userChart = document.getElementById('userChart');
            if (userChart) {
                new Chart(userChart, {
                    type: 'line',
                    data: {
                        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                        datasets: [{
                            label: 'New Users',
                            data: [12, 19, 3, 5, 2, 3],
                            borderColor: '#3b82f6',
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false
                    }
                });
            }

            async function sendTeacherAccess(teacherId) {
                if (!confirm('Send access email to this teacher? They will receive login and reset options.')) {
                    return;
                }
                
                const button = event.currentTarget;
                const originalHtml = button.innerHTML;
                button.innerHTML = '<i class="bi bi-spinner spinning"></i>';
                button.disabled = true;
                
                try {
                    const response = await fetch(`/admin/teacher/${teacherId}/send-access`, {
                        method: 'POST',
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest',
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        notification.success(data.message || 'Access email sent!');
                        button.style.color = 'var(--success)';
                        setTimeout(() => {
                            button.style.color = '';
                        }, 3000);
                    } else {
                        notification.error(data.error || 'Failed to send email');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    notification.error('Network error. Please try again.');
                } finally {
                    button.innerHTML = originalHtml;
                    button.disabled = false;
                }
            }

            // Add this to your admin/dashboard.js


            async function sendStudentReset(studentId) {
                if (!confirm('Send password reset email to this student?')) {
                    return;
                }
                
                const button = event?.currentTarget;
                const originalHtml = button?.innerHTML || '<i class="bi bi-envelope-paper"></i>';
                
                if (button) {
                    button.innerHTML = '<i class="bi bi-spinner spinning"></i>';
                    button.disabled = true;
                }
                
                try {
                    const response = await fetch(`/admin/student/${studentId}/send-reset`, {
                        method: 'POST',
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest',
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        if (window.notification) {
                            window.notification.success('Reset email sent!');
                        } else {
                            alert('✅ Reset email sent!');
                        }
                        
                        if (button) {
                            button.style.color = 'var(--success)';
                            setTimeout(() => {
                                button.style.color = '';
                            }, 3000);
                        }
                    } else {
                        if (window.notification) {
                            window.notification.error(data.error || 'Failed to send email');
                        } else {
                            alert('❌ ' + (data.error || 'Failed to send email'));
                        }
                    }
                } catch (error) {
                    console.error('Error:', error);
                    if (window.notification) {
                        window.notification.error('Network error. Please try again.');
                    } else {
                        alert('❌ Network error. Please try again.');
                    }
                } finally {
                    if (button) {
                        button.innerHTML = originalHtml;
                        button.disabled = false;
                    }
                }
            }

            // Make it globally available
            window.sendStudentReset = sendStudentReset;

            // Add this to your AdminDashboard class
            
            const courseChart = document.getElementById('courseChart');
            if (courseChart) {
                new Chart(courseChart, {
                    type: 'doughnut',
                    data: {
                        labels: ['Active', 'Completed', 'Dropped'],
                        datasets: [{
                            data: [65, 25, 10],
                            backgroundColor: ['#10b981', '#3b82f6', '#ef4444']
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false
                    }
                });
            }
        }
        
        // Bulk actions
        selectAll() {
            const checkboxes = document.querySelectorAll('.select-item');
            const selectAll = document.getElementById('selectAll');
            
            checkboxes.forEach(cb => {
                cb.checked = selectAll.checked;
            });
        }
        
        bulkAction(action) {
            const selected = Array.from(document.querySelectorAll('.select-item:checked'))
                .map(cb => cb.value);
            
            if (selected.length === 0) {
                notification.warning('Please select items');
                return;
            }
            
            if (confirm(`Are you sure you want to ${action} ${selected.length} item(s)?`)) {
                // Implement bulk action
                console.log('Bulk action:', action, selected);
                notification.success(`Bulk ${action} completed`);
            }
        }
    }
    
    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
        new AdminDashboard();
    });
})();