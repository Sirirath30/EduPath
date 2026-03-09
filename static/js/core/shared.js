/**
 * EduPath - Core Library
 * Version: 1.0.0
 * Author: EduPath Team
 */

(function(global) {
    'use strict';
    
    // ==================== CONFIGURATION ====================
    const CONFIG = {
        API_TIMEOUT: 30000,
        MAX_UPLOAD_SIZE: 100 * 1024 * 1024, // 100MB
        RATE_LIMIT: {
            FEEDBACK: 5000, // 5 seconds
            FORGOT_PASSWORD: 30000, // 30 seconds
            LOGIN_ATTEMPTS: 3,
            LOCKOUT_TIME: 15 * 60 * 1000 // 15 minutes
        },
        NOTIFICATION_DURATION: 5000,
        PASSWORD_MIN_LENGTH: 8,
        MAX_QUESTIONS: 50
    };

    // ==================== UTILITIES ====================
    const EduPath = {
        version: '1.0.0',
        config: CONFIG,
        
        // Cache for DOM elements
        _cache: new Map(),
        
        /**
         * Get DOM element with caching
         * @param {string} id - Element ID
         * @returns {HTMLElement|null}
         */
        getEl: function(id) {
            if (!this._cache.has(id)) {
                this._cache.set(id, document.getElementById(id));
            }
            return this._cache.get(id);
        },
        
        /**
         * Clear element cache
         */
        clearCache: function() {
            this._cache.clear();
        },
        
        /**
         * Format date
         * @param {Date|string|number} date
         * @param {Object} options - Intl.DateTimeFormat options
         * @returns {string}
         */
        formatDate: function(date, options = {}) {
            const defaultOptions = {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            
            return new Date(date).toLocaleDateString(
                'en-US', 
                { ...defaultOptions, ...options }
            );
        },
        
        /**
         * Sanitize user input to prevent XSS
         * @param {string} str - Input string
         * @returns {string}
         */
        sanitize: function(str) {
            if (!str) return '';
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        },
        
        /**
         * Debounce function
         * @param {Function} func - Function to debounce
         * @param {number} wait - Wait time in ms
         * @returns {Function}
         */
        debounce: function(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },
        
        /**
         * Throttle function
         * @param {Function} func - Function to throttle
         * @param {number} limit - Limit in ms
         * @returns {Function}
         */
        throttle: function(func, limit) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },
        
        /**
         * Generate secure token
         * @param {number} length - Token length
         * @returns {string}
         */
        generateToken: function(length = 32) {
            const array = new Uint8Array(length);
            crypto.getRandomValues(array);
            return Array.from(array, byte => 
                byte.toString(16).padStart(2, '0')
            ).join('');
        },
        
        /**
         * Check if element is in viewport
         * @param {HTMLElement} el
         * @returns {boolean}
         */
        isInViewport: function(el) {
            const rect = el.getBoundingClientRect();
            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
        },
        
        /**
         * Scroll to element smoothly
         * @param {HTMLElement} el
         */
        scrollTo: function(el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        },
        
        /**
         * Get URL parameters
         * @returns {URLSearchParams}
         */
        getUrlParams: function() {
            return new URLSearchParams(window.location.search);
        },
        
        /**
         * Set URL parameter without reload
         * @param {string} key
         * @param {string} value
         */
        setUrlParam: function(key, value) {
            const url = new URL(window.location.href);
            url.searchParams.set(key, value);
            window.history.replaceState({}, '', url);
        },
        
        /**
         * Remove URL parameter
         * @param {string} key
         */
        removeUrlParam: function(key) {
            const url = new URL(window.location.href);
            url.searchParams.delete(key);
            window.history.replaceState({}, '', url);
        },
        
        /**
         * Copy text to clipboard
         * @param {string} text
         * @returns {Promise<boolean>}
         */
        copyToClipboard: async function(text) {
            try {
                await navigator.clipboard.writeText(text);
                this.notify('Copied to clipboard!', 'success');
                return true;
            } catch (err) {
                console.error('Copy failed:', err);
                this.notify('Failed to copy', 'error');
                return false;
            }
        },
        
        /**
         * Download file
         * @param {Blob} blob
         * @param {string} filename
         */
        downloadFile: function(blob, filename) {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        },
        
        /**
         * Parse JSON safely
         * @param {string} str
         * @param {*} fallback
         * @returns {*}
         */
        safeJSONParse: function(str, fallback = null) {
            try {
                return JSON.parse(str);
            } catch {
                return fallback;
            }
        }
    };

    // ==================== API CLIENT ====================
    EduPath.api = {
        /**
         * Base fetch wrapper
         * @param {string} url
         * @param {Object} options
         * @returns {Promise<Object>}
         */
        async request(url, options = {}) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);
            
            try {
                const response = await fetch(url, {
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Content-Type': 'application/json',
                        ...options.headers
                    },
                    signal: controller.signal,
                    ...options
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                if (!data.success && data.error) {
                    throw new Error(data.error);
                }
                
                return data;
            } catch (error) {
                if (error.name === 'AbortError') {
                    throw new Error('Request timeout');
                }
                throw error;
            }
        },
        
        /**
         * GET request
         * @param {string} url
         * @returns {Promise<Object>}
         */
        get(url) {
            return this.request(url, { method: 'GET' });
        },
        
        /**
         * POST request
         * @param {string} url
         * @param {Object} data
         * @returns {Promise<Object>}
         */
        post(url, data) {
            return this.request(url, {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },
        
        /**
         * POST with FormData
         * @param {string} url
         * @param {FormData} formData
         * @returns {Promise<Object>}
         */
        postForm(url, formData) {
            return fetch(url, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            }).then(res => res.json());
        },
        
        /**
         * Upload file with progress
         * @param {string} url
         * @param {FormData} formData
         * @param {Function} onProgress
         * @returns {Promise<Object>}
         */
        upload(url, formData, onProgress) {
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable && onProgress) {
                        const percent = (e.loaded / e.total) * 100;
                        onProgress(percent);
                    }
                });
                
                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            resolve(JSON.parse(xhr.responseText));
                        } catch {
                            resolve({ success: true });
                        }
                    } else {
                        reject(new Error(`Upload failed: ${xhr.status}`));
                    }
                });
                
                xhr.addEventListener('error', () => reject(new Error('Upload failed')));
                xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));
                
                xhr.open('POST', url);
                xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                xhr.send(formData);
            });
        }
    };

    // ==================== STORAGE UTILITIES ====================
    EduPath.storage = {
        /**
         * Set item with expiration
         * @param {string} key
         * @param {*} value
         * @param {number} ttl - Time to live in ms
         */
        set(key, value, ttl = null) {
            const item = {
                value,
                timestamp: Date.now()
            };
            
            if (ttl) {
                item.expires = Date.now() + ttl;
            }
            
            localStorage.setItem(key, JSON.stringify(item));
        },
        
        /**
         * Get item
         * @param {string} key
         * @returns {*}
         */
        get(key) {
            const item = localStorage.getItem(key);
            if (!item) return null;
            
            try {
                const parsed = JSON.parse(item);
                
                if (parsed.expires && Date.now() > parsed.expires) {
                    localStorage.removeItem(key);
                    return null;
                }
                
                return parsed.value;
            } catch {
                return null;
            }
        },
        
        /**
         * Remove item
         * @param {string} key
         */
        remove(key) {
            localStorage.removeItem(key);
        },
        
        /**
         * Clear all expired items
         */
        clearExpired() {
            Object.keys(localStorage).forEach(key => {
                try {
                    const item = JSON.parse(localStorage.getItem(key));
                    if (item.expires && Date.now() > item.expires) {
                        localStorage.removeItem(key);
                    }
                } catch {
                    // Ignore invalid JSON
                }
            });
        }
    };

    // ==================== VALIDATION ====================
    EduPath.validate = {
        /**
         * Validate email
         * @param {string} email
         * @returns {boolean}
         */
        email: function(email) {
            const re = /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/i;
            return re.test(email);
        },
        
        /**
         * Validate name
         * @param {string} name
         * @returns {boolean}
         */
        name: function(name) {
            return !name || /^[A-Za-z\s\-']{0,100}$/.test(name);
        },
        
        /**
         * Validate password strength
         * @param {string} password
         * @returns {Object}
         */
        password: function(password) {
            const checks = {
                length: password.length >= CONFIG.PASSWORD_MIN_LENGTH,
                uppercase: /[A-Z]/.test(password),
                lowercase: /[a-z]/.test(password),
                number: /\d/.test(password),
                special: /[@$!%*?&]/.test(password)
            };
            
            const strength = Object.values(checks).filter(Boolean).length;
            const isValid = strength >= 4 && checks.length && checks.uppercase && 
                           checks.lowercase && checks.number;
            
            return {
                isValid,
                strength,
                checks,
                score: strength / 5
            };
        },
        
        /**
         * Validate required field
         * @param {string} value
         * @returns {boolean}
         */
        required: function(value) {
            return value && value.trim().length > 0;
        },
        
        /**
         * Validate min length
         * @param {string} value
         * @param {number} min
         * @returns {boolean}
         */
        minLength: function(value, min) {
            return value && value.trim().length >= min;
        },
        
        /**
         * Validate max length
         * @param {string} value
         * @param {number} max
         * @returns {boolean}
         */
        maxLength: function(value, max) {
            return !value || value.length <= max;
        },
        
        /**
         * Validate URL
         * @param {string} url
         * @returns {boolean}
         */
        url: function(url) {
            try {
                new URL(url);
                return true;
            } catch {
                return false;
            }
        },
        
        /**
         * Validate file type
         * @param {File} file
         * @param {Array} allowedTypes
         * @returns {boolean}
         */
        fileType: function(file, allowedTypes) {
            return allowedTypes.some(type => file.type === type);
        },
        
        /**
         * Validate file size
         * @param {File} file
         * @param {number} maxSize
         * @returns {boolean}
         */
        fileSize: function(file, maxSize = CONFIG.MAX_UPLOAD_SIZE) {
            return file.size <= maxSize;
        }
    };

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        // Clear expired storage items
        EduPath.storage.clearExpired();
        
        // Set CSRF token for all AJAX requests
        const token = document.querySelector('meta[name="csrf-token"]')?.content;
        if (token) {
            EduPath.csrfToken = token;
        }
    });

    // Export to global
    global.EduPath = EduPath;

})(window);