/* =====================================================================
   Love From Above NPO — site script
   Linked on every page via <script src="script.js" defer></script>.
   Each feature below checks the current page has the markup it needs
   before doing anything, so one file is safe to include everywhere.
   ===================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initScrollReveal();
  initStatsCounter();
  initLightbox();
  initUpdatesFeed();
  initServiceSearch();
  initFormValidation('#enquiry-form', enquiryFieldRules());
  initFormValidation('#contact-form', contactFieldRules());
  initContactMap();
});

/* =====================================================================
   1. MOBILE NAV TOGGLE
   Opens/closes the ☰ menu on phones, keeps aria-expanded in sync, and
   closes again on Escape, an outside click, or picking a link.
   ===================================================================== */
function initMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  if (!toggle || !nav) return;

  const closeNav = () => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  };

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeNav));

  document.addEventListener('click', (e) => {
    if (!nav.classList.contains('is-open')) return;
    if (!nav.contains(e.target) && !toggle.contains(e.target)) closeNav();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNav();
  });
}

/* =====================================================================
   2. SCROLL REVEAL
   Fades/slides cards and section intros into place as they enter the
   viewport. Skips the effect entirely for anyone who has asked their
   OS for reduced motion.
   ===================================================================== */
function initScrollReveal() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const targets = document.querySelectorAll(
    '.program-card, .service-card, .team-card, .involve-card, .stat-item, .page-header h1, .hero h1'
  );
  if (!targets.length) return;

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('reveal', 'is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  targets.forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = `${Math.min(i % 3, 2) * 80}ms`;
    observer.observe(el);
  });
}

/* =====================================================================
   2b. ANIMATED STAT COUNTERS (Home page "Our Impact")
   Each <span class="stat-number" data-count-to="500"> counts up from 0
   once it scrolls into view, using requestAnimationFrame with an
   ease-out curve. data-suffix (e.g. "+") is appended only once the
   count finishes, so it doesn't flicker mid-animation.
   ===================================================================== */
function initStatsCounter() {
  const numbers = document.querySelectorAll('.stat-number[data-count-to]');
  if (!numbers.length) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const animateCount = (el) => {
    const target = parseInt(el.dataset.countTo, 10);
    const suffix = el.dataset.suffix || '';
    if (Number.isNaN(target)) return;

    if (prefersReducedMotion) {
      el.textContent = target + suffix;
      return;
    }

    const duration = 1200;
    const startTime = performance.now();

    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic — starts fast, settles gently
      el.textContent = Math.round(eased * target);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target + suffix;
      }
    };
    requestAnimationFrame(step);
  };

  if (!('IntersectionObserver' in window)) {
    numbers.forEach(animateCount);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  numbers.forEach(el => observer.observe(el));
}

/* =====================================================================
   3. LIGHTBOX
   Click any photo inside the page content and it opens full-size in an
   overlay, with its alt text shown as a caption. Closes on the ✕
   button, clicking the backdrop, or Escape.
   ===================================================================== */
function initLightbox() {
  const images = document.querySelectorAll('main img');
  if (!images.length) return;

  const overlay = document.createElement('div');
  overlay.className = 'lightbox';
  overlay.innerHTML = `
    <button type="button" class="lightbox-close" aria-label="Close image">&times;</button>
    <figure class="lightbox-figure">
      <img class="lightbox-img" src="" alt="">
      <figcaption class="lightbox-caption"></figcaption>
    </figure>`;
  document.body.appendChild(overlay);

  const imgEl = overlay.querySelector('.lightbox-img');
  const captionEl = overlay.querySelector('.lightbox-caption');
  const closeBtn = overlay.querySelector('.lightbox-close');
  let lastFocused = null;

  const openLightbox = (src, alt) => {
    lastFocused = document.activeElement;
    imgEl.src = src;
    imgEl.alt = alt || '';
    captionEl.textContent = alt || '';
    overlay.classList.add('is-open');
    document.body.classList.add('lightbox-locked');
    closeBtn.focus();
  };

  const closeLightbox = () => {
    overlay.classList.remove('is-open');
    document.body.classList.remove('lightbox-locked');
    imgEl.src = '';
    if (lastFocused) lastFocused.focus();
  };

  images.forEach(img => {
    img.classList.add('has-lightbox');
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', 'View larger image' + (img.alt ? ': ' + img.alt : ''));
    img.addEventListener('click', () => openLightbox(img.currentSrc || img.src, img.alt));
    img.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(img.currentSrc || img.src, img.alt);
      }
    });
  });

  closeBtn.addEventListener('click', closeLightbox);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeLightbox(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeLightbox();
  });
}

/* =====================================================================
   4. DYNAMIC "LATEST UPDATES" FEED (Home page)
   Builds the update cards from a small data array with JavaScript,
   instead of writing them straight into the HTML. A real deployment
   would fetch this array from a server; here it's defined inline so
   the page still works with no backend.
   ===================================================================== */
function initUpdatesFeed() {
  const feed = document.getElementById('updates-feed');
  if (!feed) return;

  const updates = [
    { date: '2026-10-18', title: 'Spring grocery hampers delivered', body: 'We packed and dropped off 64 grocery hampers to child-headed households across Chrisville this month.' },
    { date: '2026-09-30', title: 'After-school tutoring reaches 40 learners', body: 'Our literacy support program welcomed ten new learners this term, thanks to two new volunteer tutors.' },
    { date: '2026-09-12', title: 'Thank you, Salvation Foundation', body: 'Our winter blanket drive with Salvation Foundation closed out having reached over 300 children.' },
  ];

  const formatter = new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });

  feed.innerHTML = updates.map(u => `
    <article class="update-card">
      <time class="update-date" datetime="${u.date}">${formatter.format(new Date(u.date))}</time>
      <h3>${u.title}</h3>
      <p>${u.body}</p>
    </article>
  `).join('');
}

/* =====================================================================
   5. SERVICE SEARCH / FILTER  (Services page)
   Filters the service cards as the person types, matching against each
   card's heading and paragraph text.
   ===================================================================== */
function initServiceSearch() {
  const input = document.getElementById('service-search');
  const cards = document.querySelectorAll('.service-card');
  const emptyMsg = document.getElementById('service-search-empty');
  const clearBtn = document.getElementById('service-search-clear');
  if (!input || !cards.length) return;

  const applyFilter = () => {
    const query = input.value.trim().toLowerCase();
    let visibleCount = 0;

    cards.forEach(card => {
      const text = card.textContent.toLowerCase();
      const matches = query === '' || text.includes(query);
      card.hidden = !matches;
      if (matches) visibleCount += 1;
    });

    if (emptyMsg) emptyMsg.hidden = visibleCount !== 0;
  };

  input.addEventListener('input', applyFilter);

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      applyFilter();
      input.focus();
    });
  }
}

/* =====================================================================
   6. FORM VALIDATION + SIMULATED SUBMISSION  (Enquiry / Contact)
   Validates each field on submit (and again as the person fixes an
   error), shows an inline message under the field, and — once
   everything passes — simulates sending the form asynchronously before
   showing a success message. There is no backend here, so nothing is
   actually emailed; wire the fetch() call in submitForm() up to a real
   endpoint when one exists.
   ===================================================================== */
function enquiryFieldRules() {
  return {
    first_name: { label: 'first name', validate: v => v.trim().length >= 1 || 'Please enter your first name.' },
    last_name: { label: 'last name', validate: v => v.trim().length >= 1 || 'Please enter your last name.' },
    email: { label: 'email', validate: v => isValidEmail(v) || 'Please enter a valid email address.' },
    phone: { label: 'phone', optional: true, validate: v => v === '' || isValidPhone(v) || 'Please enter a valid phone number, or leave this blank.' },
    enquiry_type: { label: 'enquiry type', validate: v => v !== '' || 'Please choose what you\u2019re enquiring about.' },
    message: { label: 'details', validate: v => v.trim().length >= 10 || 'Please add a few more details (at least 10 characters).' },
  };
}

function contactFieldRules() {
  return {
    first_name: { label: 'first name', validate: v => v.trim().length >= 1 || 'Please enter your first name.' },
    last_name: { label: 'last name', validate: v => v.trim().length >= 1 || 'Please enter your last name.' },
    email: { label: 'email', validate: v => isValidEmail(v) || 'Please enter a valid email address.' },
    message: { label: 'message', validate: v => v.trim().length >= 10 || 'Please add a few more details (at least 10 characters).' },
  };
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidPhone(value) {
  const digits = value.replace(/[\s()-]/g, '');
  return /^\+?\d{7,15}$/.test(digits);
}

function initFormValidation(selector, rules) {
  const form = document.querySelector(selector);
  if (!form) return;

  const fieldsWrap = document.createElement('div');
  fieldsWrap.className = 'form-fields';
  while (form.firstChild) fieldsWrap.appendChild(form.firstChild);
  form.appendChild(fieldsWrap);

  Object.keys(rules).forEach(name => {
    const field = form.elements[name];
    if (!field) return;
    const errorEl = document.createElement('p');
    errorEl.className = 'field-error';
    errorEl.id = `${field.id || name}-error`;
    errorEl.setAttribute('role', 'alert');
    field.insertAdjacentElement('afterend', errorEl);
    field.setAttribute('aria-describedby', errorEl.id);

    field.addEventListener('blur', () => validateField(field, rules[name], errorEl));
    field.addEventListener('input', () => {
      if (field.classList.contains('invalid')) validateField(field, rules[name], errorEl);
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let firstInvalid = null;
    let allValid = true;

    Object.keys(rules).forEach(name => {
      const field = form.elements[name];
      if (!field) return;
      const errorEl = document.getElementById(`${field.id || name}-error`);
      const valid = validateField(field, rules[name], errorEl);
      if (!valid) {
        allValid = false;
        if (!firstInvalid) firstInvalid = field;
      }
    });

    if (!allValid) {
      firstInvalid.focus();
      return;
    }

    submitForm(form, fieldsWrap);
  });
}

function validateField(field, rule, errorEl) {
  const result = rule.validate(field.value);
  const valid = result === true;
  field.classList.toggle('invalid', !valid);
  field.setAttribute('aria-invalid', String(!valid));
  if (errorEl) errorEl.textContent = valid ? '' : result;
  return valid;
}

function submitForm(form, fieldsWrap) {
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalLabel = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending…';

  // Simulated AJAX submission. Swap this Promise for a real fetch() call,
  // e.g. fetch(form.action, { method: 'POST', body: new FormData(form) }),
  // once there is a server endpoint to receive the form.
  const fakeNetworkRequest = new Promise(resolve => setTimeout(resolve, 700));

  fakeNetworkRequest.then(() => {
    fieldsWrap.hidden = true;
    submitBtn.hidden = true;

    const success = document.createElement('div');
    success.className = 'form-success';
    success.setAttribute('role', 'status');
    success.innerHTML = `
      <p><strong>Thank you — your message is on its way.</strong></p>
      <p>We read every enquiry and get back to people as soon as we can.</p>
      <button type="button" class="btn btn-secondary form-success-reset">Send another message</button>`;
    form.appendChild(success);

    success.querySelector('.form-success-reset').addEventListener('click', () => {
      form.reset();
      form.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
      form.querySelectorAll('.field-error').forEach(el => { el.textContent = ''; });
      success.remove();
      fieldsWrap.hidden = false;
      submitBtn.hidden = false;
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
      form.querySelector('input, select, textarea').focus();
    });
  });
}

/* =====================================================================
   7. INTERACTIVE MAP  (Contact page)
   Plots the office location with Leaflet + OpenStreetMap tiles. Needs
   an internet connection, same as any map on any website — if Leaflet
   hasn't loaded (e.g. offline), it falls back to a text note instead
   of leaving a blank box.
   ===================================================================== */
function initContactMap() {
  const mapEl = document.getElementById('contact-map');
  if (!mapEl) return;

  if (typeof L === 'undefined') {
    mapEl.textContent = 'Map unavailable right now — please check your internet connection.';
    return;
  }

  const officeLocation = [-26.262147, 28.024313]; // 23 Vivienne St, Chrisville, Johannesburg
  mapEl.textContent = '';
  mapEl.removeAttribute('role');
  mapEl.removeAttribute('aria-label');

  const map = L.map(mapEl, { scrollWheelZoom: false }).setView(officeLocation, 15);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  L.marker(officeLocation)
    .addTo(map)
    .bindPopup('<strong>Love From Above NPO</strong><br>23 Vivienne St, Chrisville, Johannesburg')
    .openPopup();
}
