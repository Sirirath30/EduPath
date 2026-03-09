/**
 * EduPath Reset Password Page
 * With strict password validation matching register page
 */

(function() {
    'use strict';

    // Toggle mobile menu
    function toggleMenu() {
      const menu = document.getElementById('mobileMenu');
      menu.hidden = !menu.hidden;
    }
    window.toggleMenu = toggleMenu;

    // Toggle password visibility
    function togglePassword(fieldId) {
      const input = document.getElementById(fieldId);
      const icon = document.getElementById(fieldId === 'password' ? 'togglePasswordIcon' : 'toggleConfirmIcon');
      
      if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('bi-eye');
        icon.classList.add('bi-eye-slash');
      } else {
        input.type = 'password';
        icon.classList.remove('bi-eye-slash');
        icon.classList.add('bi-eye');
      }
    }
    window.togglePassword = togglePassword;

    // Check password strength (matching register page)
    function checkPasswordStrength(password) {
      const strengthBar = document.getElementById('passwordStrength');
      if (!strengthBar) return;
      
      // Define requirements
      const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[@$!%*?&]/.test(password)
      };
      
      // Update requirement checks
      const reqLength = document.getElementById('req-length');
      const reqUppercase = document.getElementById('req-uppercase');
      const reqLowercase = document.getElementById('req-lowercase');
      const reqNumber = document.getElementById('req-number');
      const reqSpecial = document.getElementById('req-special');
      
      // Helper function to update requirement
      function updateRequirement(element, isValid) {
        if (!element) return;
        
        const icon = element.querySelector('i');
        element.className = isValid ? 'valid' : '';
        
        if (icon) {
          if (isValid) {
            icon.classList.remove('bi-circle');
            icon.classList.add('bi-check-circle-fill');
          } else {
            icon.classList.remove('bi-check-circle-fill');
            icon.classList.add('bi-circle');
          }
        }
      }
      
      updateRequirement(reqLength, requirements.length);
      updateRequirement(reqUppercase, requirements.uppercase);
      updateRequirement(reqLowercase, requirements.lowercase);
      updateRequirement(reqNumber, requirements.number);
      updateRequirement(reqSpecial, requirements.special);
      
      // Calculate strength (0-5)
      const strengthCount = Object.values(requirements).filter(Boolean).length;
      
      // Define strength levels with colors
      const strengthLevels = [
        { text: 'Very Weak', color: '#ef4444' },
        { text: 'Weak', color: '#f59e0b' },
        { text: 'Fair', color: '#3b82f6' },
        { text: 'Good', color: '#10b981' },
        { text: 'Strong', color: '#10b981' },
        { text: 'Very Strong', color: '#059669' }
      ];
      
      const level = strengthLevels[strengthCount] || strengthLevels[0];
      
      // Update strength bar
      if (password.length > 0) {
        strengthBar.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.25rem;">
            <span style="font-weight: 600; color: ${level.color};">${level.text}</span>
            <span style="font-size: 0.75rem; color: var(--muted-foreground);">${strengthCount}/5</span>
          </div>
          <div style="width: 100%; height: 6px; background: var(--border); border-radius: 3px; overflow: hidden;">
            <div style="width: ${(strengthCount / 5) * 100}%; height: 100%; background: ${level.color}; transition: width 0.3s ease;"></div>
          </div>
        `;
        strengthBar.style.display = 'block';
      } else {
        strengthBar.style.display = 'none';
      }
      
      return requirements;
    }
    window.checkPasswordStrength = checkPasswordStrength;

    // Check if passwords match
    function checkPasswordMatch() {
      const password = document.getElementById('password').value;
      const confirm = document.getElementById('confirm_password').value;
      const confirmError = document.getElementById('confirmError');
      const confirmInput = document.getElementById('confirm_password');
      
      if (confirm && confirm !== password) {
        confirmError.textContent = 'Passwords do not match';
        confirmError.hidden = false;
        confirmInput.classList.add('invalid');
        return false;
      } else {
        confirmError.hidden = true;
        confirmInput.classList.remove('invalid');
        return true;
      }
    }

    // Initialize on page load
    document.addEventListener('DOMContentLoaded', function() {
      const resetForm = document.getElementById('resetForm');
      const passwordInput = document.getElementById('password');
      const confirmInput = document.getElementById('confirm_password');
      const submitBtn = document.getElementById('submitBtn');

      // Real-time password strength validation
      if (passwordInput) {
        passwordInput.addEventListener('input', function() {
          checkPasswordStrength(this.value);
          if (confirmInput.value) checkPasswordMatch();
        });
        
        // Initial check if password is pre-filled
        if (passwordInput.value) {
          checkPasswordStrength(passwordInput.value);
        }
      }

      // Real-time password match validation
      if (confirmInput) {
        confirmInput.addEventListener('input', checkPasswordMatch);
      }

      // Validate form on submit
      if (resetForm) {
        resetForm.addEventListener('submit', function(e) {
          const password = document.getElementById('password').value;
          const confirm = document.getElementById('confirm_password').value;
          
          // Check password strength
          const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /\d/.test(password),
            special: /[@$!%*?&]/.test(password)
          };
          
          const isValid = requirements.length && requirements.uppercase && 
                         requirements.lowercase && requirements.number && requirements.special;
          
          if (!isValid) {
            e.preventDefault();
            alert('Please meet all password requirements');
            return;
          }
          
          if (password !== confirm) {
            e.preventDefault();
            const confirmError = document.getElementById('confirmError');
            confirmError.textContent = 'Passwords do not match';
            confirmError.hidden = false;
            return;
          }
          
          // Disable button to prevent double submission
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="bi bi-spinner spinning"></i> Resetting...';
          }
        });
      }

      // Close mobile menu when clicking outside
      document.addEventListener('click', function(e) {
        const menu = document.getElementById('mobileMenu');
        const toggle = document.querySelector('.mobile-toggle');
        if (menu && !menu.hidden && !menu.contains(e.target) && toggle && !toggle.contains(e.target)) {
          menu.hidden = true;
        }
      });
    });

})();