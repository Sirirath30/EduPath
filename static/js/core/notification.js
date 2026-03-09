/**
 * EduPath Notification System
 */

(function() {
    'use strict';
    
    class NotificationManager {
        constructor() {
            this.container = this.createContainer();
            this.notifications = new Map();
            this.counter = 0;
        }
        
        createContainer() {
            let container = document.getElementById('notification-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'notification-container';
                container.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 9999;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    max-width: 400px;
                `;
                document.body.appendChild(container);
            }
            return container;
        }
        
        /**
         * Show notification
         * @param {string} message
         * @param {string} type - success|error|warning|info
         * @param {number} duration
         * @returns {number} notification ID
         */
        show(message, type = 'info', duration = 5000) {
            const id = ++this.counter;
            const notification = this.createNotification(message, type, id);
            
            this.container.appendChild(notification);
            this.notifications.set(id, notification);
            
            if (duration > 0) {
                setTimeout(() => this.dismiss(id), duration);
            }
            
            return id;
        }
        
        createNotification(message, type, id) {
            const icons = {
                success: 'bi-check-circle-fill',
                error: 'bi-exclamation-circle-fill',
                warning: 'bi-exclamation-triangle-fill',
                info: 'bi-info-circle-fill'
            };
            
            const colors = {
                success: '#10b981',
                error: '#ef4444',
                warning: '#f59e0b',
                info: '#3b82f6'
            };
            
            const notification = document.createElement('div');
            notification.id = `notification-${id}`;
            notification.setAttribute('role', 'alert');
            notification.style.cssText = `
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                border-left: 4px solid ${colors[type]};
                animation: slideIn 0.3s ease;
                transform: translateX(0);
                transition: all 0.3s ease;
                cursor: pointer;
            `;
            
            notification.innerHTML = `
                <i class="bi ${icons[type]}" style="color: ${colors[type]}; font-size: 1.25rem;"></i>
                <span style="flex: 1; color: #1f2937;">${message}</span>
                <button class="notification-close" aria-label="Close" style="
                    background: none;
                    border: none;
                    color: #6b7280;
                    cursor: pointer;
                    padding: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">
                    <i class="bi bi-x-lg"></i>
                </button>
            `;
            
            // Close button
            const closeBtn = notification.querySelector('.notification-close');
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.dismiss(id);
            });
            
            // Click to dismiss
            notification.addEventListener('click', () => this.dismiss(id));
            
            return notification;
        }
        
        /**
         * Dismiss notification
         * @param {number} id
         */
        dismiss(id) {
            const notification = this.notifications.get(id);
            if (!notification) return;
            
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                    this.notifications.delete(id);
                }
            }, 300);
        }
        
        /**
         * Dismiss all notifications
         */
        dismissAll() {
            this.notifications.forEach((_, id) => this.dismiss(id));
        }
        
        /**
         * Success notification
         * @param {string} message
         * @param {number} duration
         */
        success(message, duration = 5000) {
            return this.show(message, 'success', duration);
        }
        
        /**
         * Error notification
         * @param {string} message
         * @param {number} duration
         */
        error(message, duration = 5000) {
            return this.show(message, 'error', duration);
        }
        
        /**
         * Warning notification
         * @param {string} message
         * @param {number} duration
         */
        warning(message, duration = 5000) {
            return this.show(message, 'warning', duration);
        }
        
        /**
         * Info notification
         * @param {string} message
         * @param {number} duration
         */
        info(message, duration = 5000) {
            return this.show(message, 'info', duration);
        }
    }
    
    // Add animation styles
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
    
    // Create global instance
    window.notification = new NotificationManager();
    
    // Alias for backward compatibility
    window.showNotification = (message, type) => notification.show(message, type);
})();