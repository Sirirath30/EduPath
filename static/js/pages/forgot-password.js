/**
 * EduPath Forgot Password Page
 */

(function() {
    'use strict';
    
    class ForgotPasswordPage {
        constructor() {
            this.form = document.getElementById('forgotPasswordForm');
            if (!this.form) return;
            
            this.attempts = 0;
            this.lockoutUntil = 0;
            
            this.init();
        }
        
        init() {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
            
            // Load attempts
            this.loadAttempts();
            
            // Email validation
            const email = document.getElementById('email');
            if (email) {
                email.addEventListener('input', () => this.validateEmail());
            }
        }
        
        loadAttempts() {
            const stored = EduPath.storage.get('forgot_attempts');
            if (stored) {
                this.attempts = stored.attempts || 0;
                this.lockoutUntil = stored.lockoutUntil || 0;
            }
        }
        
        saveAttempts() {
            EduPath.storage.set('forgot_attempts', {
                attempts: this.attempts,
                lockoutUntil: this.lockoutUntil
            }, 24 * 60 * 60 * 1000);
        }
        
        isLocked() {
            if (this.lockoutUntil > Date.now()) {
                const minutes = Math.ceil((this.lockoutUntil - Date.now()) / 60000);
                this.showError(`Too many attempts. Please try again in ${minutes} minutes.`);
                return true;
            }
            return false;
        }
        
        trackAttempt() {
            this.attempts++;
            
            if (this.attempts >= 3) {
                this.lockoutUntil = Date.now() + (15 * 60 * 1000);
            }
            
            this.saveAttempts();
        }
        
        resetAttempts() {
            this.attempts = 0;
            this.lockoutUntil = 0;
            this.saveAttempts();
        }
        
        validateEmail() {
            const email = document.getElementById('email');
            const error = document.getElementById('emailError');
            
            if (!email.value.trim()) {
                error.textContent = 'Email is required';
                error.classList.remove('hidden');
                return false;
            }
            
            if (!EduPath.validate.email(email.value)) {
                error.textContent = 'Please enter a valid email address';
                error.classList.remove('hidden');
                return false;
            }
            
            error.classList.add('hidden');
            return true;
        }
        
        showError(message) {
            const errorDiv = document.getElementById('formError');
            if (errorDiv) {
                errorDiv.textContent = message;
                errorDiv.classList.remove('hidden');
                setTimeout(() => errorDiv.classList.add('hidden'), 5000);
            }
        }
        
        showSuccess(message) {
            const successDiv = document.getElementById('formSuccess');
            if (successDiv) {
                successDiv.textContent = message;
                successDiv.classList.remove('hidden');
            }
        }
        
        async handleSubmit(e) {
            e.preventDefault();
            
            document.getElementById('formError')?.classList.add('hidden');
            document.getElementById('formSuccess')?.classList.add('hidden');
            
            // Check lockout
            if (this.isLocked()) return;
            
            // Honeypot check
            const honeypot = document.getElementById('website');
            if (honeypot?.value.trim()) {
                console.warn('Bot detected');
                return;
            }
            
            // Rate limiting
            const timestamp = document.getElementById('formTimestamp');
            const now = Date.now();
            if (timestamp?.value && (now - parseInt(timestamp.value)) < 30000) {
                this.showError('Please wait 30 seconds before requesting another reset link');
                return;
            }
            
            // Validate email
            if (!this.validateEmail()) return;
            
            // Disable button
            const submitBtn = document.getElementById('submitBtn');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="bi bi-spinner spinning"></i> Sending...';
            
            const email = document.getElementById('email').value.trim().toLowerCase();
            const csrfToken = document.getElementById('csrfToken')?.value;
            
            try {
                const formData = new FormData();
                formData.append('email', email);
                formData.append('csrf_token', csrfToken);
                
                const response = await fetch('/forgot-password', {
                    method: 'POST',
                    body: formData,
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
                });
                
                const data = await response.json();
                
                if (data.success) {
                    this.showSuccess(data.message);
                    this.resetAttempts();
                    this.form.reset();
                    
                    if (timestamp) {
                        timestamp.value = Date.now().toString();
                    }
                } else {
                    this.trackAttempt();
                    this.showError(data.error || 'An error occurred');
                }
                
            } catch (error) {
                console.error('Error:', error);
                this.showError('Server connection error. Please try again.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        }
    }
    
    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
        new ForgotPasswordPage();
    });
})();