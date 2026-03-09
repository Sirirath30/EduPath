/**
 * EduPath Login Page
 */

(function() {
    'use strict';

    // Toggle password visibility
    function togglePasswordVisibility() {
      const passwordInput = document.getElementById('password');
      const toggleIcon = document.getElementById('togglePasswordIcon');
      
      if (passwordInput && toggleIcon) {
        if (passwordInput.type === 'password') {
          passwordInput.type = 'text';
          toggleIcon.classList.remove('bi-eye');
          toggleIcon.classList.add('bi-eye-slash');
        } else {
          passwordInput.type = 'password';
          toggleIcon.classList.remove('bi-eye-slash');
          toggleIcon.classList.add('bi-eye');
        }
      }
    }
    window.togglePasswordVisibility = togglePasswordVisibility;

    // Mobile menu toggle
    function toggleMenu() {
      const menu = document.getElementById('mobileMenu');
      const toggle = document.querySelector('.mobile-toggle');
      if (menu && toggle) {
        menu.hidden = !menu.hidden;
        toggle.setAttribute('aria-expanded', !menu.hidden);
      }
    }
    window.toggleMenu = toggleMenu;

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
      const menu = document.getElementById('mobileMenu');
      const toggle = document.querySelector('.mobile-toggle');
      if (menu && !menu.hidden && !menu.contains(e.target) && !toggle.contains(e.target)) {
        menu.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
      }
    });

    // Set form timestamp for rate limiting
    document.addEventListener('DOMContentLoaded', function() {
      const timestampInput = document.getElementById('formTimestamp');
      if (timestampInput) {
        timestampInput.value = Date.now();
      }
    });

    // Your existing login handler
    async function handleLogin(e) {
      e.preventDefault();

      const loginError = document.getElementById('loginError');
      loginError.hidden = true;
      loginError.textContent = '';

      const email = document.getElementById('email');
      const password = document.getElementById('password');
      const rememberMe = document.getElementById('rememberMe');
      const csrfToken = document.getElementById('csrfToken')?.value || '';

      // Honeypot check
      const honeypot = document.getElementById('website');
      if (honeypot && honeypot.value.trim() !== '') {
        loginError.textContent = "Bot detected";
        loginError.hidden = false;
        return;
      }

      // Validate fields
      if (!email.value || !password.value) {
        loginError.textContent = "Please fill in all fields";
        loginError.hidden = false;
        return;
      }

      const loginBtn = document.getElementById('loginBtn');
      const originalBtnText = loginBtn.innerHTML;
      loginBtn.disabled = true;
      loginBtn.innerHTML = '<i class="bi bi-spinner spinning"></i> Logging in...';

      const formData = new FormData();
      formData.append('email', email.value.trim().toLowerCase());
      formData.append('password', password.value);
      formData.append('rememberMe', rememberMe.checked ? 'on' : '');
      formData.append('csrf_token', csrfToken);

      try {
        const response = await fetch('/login', {
          method: 'POST',
          body: formData,
          headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });

        const data = await response.json();

        if (data.redirect) {
          window.location.href = data.redirect;
          return;
        }

        if (data.error) {
          loginError.textContent = data.error;
          loginError.hidden = false;

          // Handle lockout
          if (data.locked) {
            loginError.textContent += " (Account temporarily locked)";
          }
        }

      } catch (err) {
        console.error(err);
        loginError.textContent = "Server connection error. Try again.";
        loginError.hidden = false;
      } finally {
        loginBtn.disabled = false;
        loginBtn.innerHTML = originalBtnText;
        password.value = '';
      }
    }
    window.handleLogin = handleLogin;

})();