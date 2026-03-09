/**
 * EduPath Rate Page - Clean Version
 */

document.addEventListener("DOMContentLoaded", function () {

  /* =========================
     MOBILE MENU
  ==========================*/
  window.toggleMenu = function () {
    const menu = document.getElementById("mobileMenu");
    if (menu) {
      menu.hidden = !menu.hidden;
    }
  };


  /* =========================
     STAR RATING SYSTEM
  ==========================*/

  let currentRating = 0;

  const stars = document.querySelectorAll("#stars span");
  const ratingLabel = document.getElementById("ratingLabel");
  const ratingError = document.getElementById("ratingError");

  function highlightStars(value) {
    stars.forEach(star => {
      const starValue = parseInt(star.dataset.value);
      star.classList.toggle("filled", starValue <= value);
    });
  }

  function updateRatingLabel() {
    const messages = {
      1: "We're sorry to hear that. We'll work hard to improve!",
      2: "Thank you for your honest feedback. We'll do better!",
      3: "Thanks for the feedback! We're working to improve.",
      4: "We're glad you're enjoying EduPath!",
      5: "We're thrilled you love EduPath! Thank you!"
    };

    ratingLabel.textContent = messages[currentRating] || "";
  }

  stars.forEach(star => {
    star.addEventListener("mouseover", () => {
      highlightStars(parseInt(star.dataset.value));
    });

    star.addEventListener("mouseout", () => {
      highlightStars(currentRating);
    });

    star.addEventListener("click", () => {
      currentRating = parseInt(star.dataset.value);
      highlightStars(currentRating);
      updateRatingLabel();

      if (ratingError) ratingError.hidden = true;
    });
  });


  /* =========================
     CHARACTER COUNTER
  ==========================*/

  const feedbackInput = document.getElementById("feedback");
  const charCounter = document.getElementById("charCounter");

  if (feedbackInput && charCounter) {
    feedbackInput.addEventListener("input", function () {
      const length = this.value.length;
      charCounter.textContent = `${length}/1000`;

      if (length >= 950) {
        charCounter.style.color = "#dc3545";
      } else if (length >= 800) {
        charCounter.style.color = "#ffc107";
      } else {
        charCounter.style.color = "#6c757d";
      }
    });
  }


  /* =========================
     FORM SUBMISSION
  ==========================*/

  const form = document.getElementById("rateForm");
  const formError = document.getElementById("formError");
  const formSuccess = document.getElementById("formSuccess");
  const submitBtn = document.getElementById("submitBtn");

  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (formError) formError.hidden = true;
    if (formSuccess) formSuccess.hidden = true;

    /* ---- Check Rating ---- */
    if (currentRating === 0) {
      if (ratingError) ratingError.hidden = false;
      return;
    }

    /* ---- Validate Feedback ---- */
    const feedback = feedbackInput.value.trim();
    if (!feedback || feedback.length < 10) {
      showError("Please provide at least 10 characters of feedback.");
      return;
    }

    /* ---- Honeypot ---- */
    const honeypot = document.getElementById("website");
    if (honeypot && honeypot.value.trim() !== "") {
      console.warn("Bot detected.");
      return;
    }

    /* ---- Disable Button ---- */
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="bi bi-spinner spinning"></i> Submitting...';

    /* ---- Prepare Data ---- */
    const formData = {
      name: document.getElementById("name").value.trim() || "Anonymous",
      email: document.getElementById("email").value.trim() || "",
      feedback: feedback,
      rating: currentRating,
      category: document.getElementById("category").value,
      csrfToken: document.getElementById("csrfToken").value
    };

    try {
      const response = await fetch("/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        // Show success message FIRST
        formSuccess.textContent = result.message || "Thank you for your feedback!";
        formSuccess.hidden = false;
        formSuccess.scrollIntoView({ behavior: "smooth" });

        form.reset();
        currentRating = 0;
        highlightStars(0);
        ratingLabel.textContent = "";
        charCounter.textContent = "0/1000";

      } else {
        showError(result.error || "Submission failed.");
      }

    } catch (err) {
      console.error(err);
      showError("Server error. Please try again.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  });


  /* =========================
     HELPER FUNCTIONS
  ==========================*/

  function showError(message) {
    if (!formError) return;
    formError.textContent = message;
    formError.hidden = false;
  }

  function showSuccess(message) {
    if (!formSuccess) return;
    formSuccess.textContent = message;
    formSuccess.hidden = false;
  }


  /* =========================
     SPINNER ANIMATION
  ==========================*/

  const style = document.createElement("style");
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .spinning {
      animation: spin 1s linear infinite;
      display: inline-block;
    }
  `;
  document.head.appendChild(style);

  // Simple mobile menu toggle
  function toggleMenu() {
    const menu = document.getElementById("mobileMenu");
    menu.hidden = !menu.hidden;
  }

});