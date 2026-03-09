/**
 * EduPath Password Handler
 */

(function() {
    'use strict';
    
    class PasswordHandler {
        constructor() {
            this.init();
        }
        
        init() {
            // Initialize all password toggle buttons
            document.querySelectorAll('[data-toggle="password"]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = btn.getAttribute('data-target');
                    this.togglePassword(targetId);
                });
            });
            
            // Initialize password strength checkers
            document.querySelectorAll('[data-password-strength]').forEach(input => {
                input.addEventListener('input', () => {
                    this.checkStrength(input);
                });
            });
            
            // Initialize confirm password checkers
            document.querySelectorAll('[data-confirm-password]').forEach(input => {
                input.addEventListener('input', () => {
                    this.checkConfirm(input);
                });
            });
        }
        
        /**
         * Toggle password visibility
         * @param {string} fieldId
         */
        togglePassword(fieldId) {
            const input = document.getElementById(fieldId);
            const icon = document.getElementById(`toggle${fieldId.charAt(0).toUpperCase()}Icon`);
            
            if (!input || !icon) return;
            
            const type = input.type === 'password' ? 'text' : 'password';
            input.type = type;
            
            icon.classList.toggle('bi-eye', type === 'password');
            icon.classList.toggle('bi-eye-slash', type === 'text');
        }
        
        /**
         * Check password strength
         * @param {HTMLInputElement} input
         */
        checkStrength(input) {
            const password = input.value;
            const result = EduPath.validate.password(password);
            
            // Update requirement indicators
            Object.keys(result.checks).forEach(key => {
                const el = document.getElementById(`req-${key}`);
                if (el) {
                    el.className = result.checks[key] ? 'valid' : '';
                    const icon = el.querySelector('i');
                    if (icon) {
                        icon.className = result.checks[key] ? 
                            'bi bi-check-circle-fill' : 'bi bi-circle';
                    }
                }
            });
            
            // Update strength bar
            const strengthBar = document.getElementById('passwordStrength');
            if (strengthBar) {
                if (password.length > 0) {
                    const levels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
                    const colors = ['#ef4444', '#ef4444', '#f59e0b', '#10b981', '#10b981', '#10b981'];
                    
                    strengthBar.textContent = `Password Strength: ${levels[result.strength]}`;
                    strengthBar.style.color = colors[result.strength];
                    strengthBar.hidden = false;
                    
                    // Add visual indicator
                    strengthBar.style.position = 'relative';
                    strengthBar.style.paddingLeft = '0';
                    
                    // Create or update progress bar
                    let progress = document.getElementById('strength-progress');
                    if (!progress) {
                        progress = document.createElement('div');
                        progress.id = 'strength-progress';
                        progress.style.cssText = `
                            height: 4px;
                            background: #e5e7eb;
                            border-radius: 2px;
                            margin-top: 4px;
                            overflow: hidden;
                        `;
                        strengthBar.parentNode.insertBefore(progress, strengthBar.nextSibling);
                    }
                    
                    let fill = progress.querySelector('.strength-fill');
                    if (!fill) {
                        fill = document.createElement('div');
                        fill.className = 'strength-fill';
                        fill.style.cssText = `
                            height: 100%;
                            transition: width 0.3s ease, background-color 0.3s ease;
                        `;
                        progress.appendChild(fill);
                    }
                    
                    const width = (result.strength / 5) * 100;
                    fill.style.width = width + '%';
                    fill.style.backgroundColor = colors[result.strength];
                    
                } else {
                    strengthBar.hidden = true;
                    const progress = document.getElementById('strength-progress');
                    if (progress) progress.remove();
                }
            }
            
            return result;
        }
        
        /**
         * Check confirm password
         * @param {HTMLInputElement} input
         */
        checkConfirm(input) {
            const passwordId = input.getAttribute('data-confirm-password');
            const password = document.getElementById(passwordId)?.value;
            const errorDiv = document.getElementById('confirmPasswordError');
            
            if (input.value && input.value !== password) {
                if (errorDiv) {
                    errorDiv.textContent = 'Passwords do not match';
                    errorDiv.hidden = false;
                }
                return false;
            } else if (errorDiv) {
                errorDiv.hidden = true;
            }
            
            return true;
        }
        
        /**
         * Generate secure password
         * @param {number} length
         * @returns {string}
         */
        generatePassword(length = 16) {
            const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const lowercase = 'abcdefghijklmnopqrstuvwxyz';
            const numbers = '0123456789';
            const symbols = '@$!%*?&';
            
            const all = uppercase + lowercase + numbers + symbols;
            let password = '';
            
            // Ensure at least one of each type
            password += uppercase[Math.floor(Math.random() * uppercase.length)];
            password += lowercase[Math.floor(Math.random() * lowercase.length)];
            password += numbers[Math.floor(Math.random() * numbers.length)];
            password += symbols[Math.floor(Math.random() * symbols.length)];
            
            // Fill the rest
            for (let i = password.length; i < length; i++) {
                password += all[Math.floor(Math.random() * all.length)];
            }
            
            // Shuffle
            return password.split('').sort(() => 0.5 - Math.random()).join('');
        }
    }
    
    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        window.passwordHandler = new PasswordHandler();
    });
    
    // Global functions for backward compatibility
    window.togglePassword = (fieldId) => window.passwordHandler?.togglePassword(fieldId);
    window.checkPasswordStrength = (password) => {
        const input = { value: password };
        return window.passwordHandler?.checkStrength(input);
    };
})();