/* ==========================================================================
   Ever After by Mirai — site behavior
   PRD refs: §9.3 (language), §10.2–10.3 (attribution, form), §12.4 (components),
             §15 (event taxonomy), §19 (accessibility).

   Design constraint (PRD §14 Resilience): every feature here is an ENHANCEMENT.
   With JavaScript disabled the page still renders all copy, prices, FAQ answers
   and a working form that posts natively to the thank-you page.
   ========================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------------
     1. Analytics event layer (PRD §15)

     Pushes to window.dataLayer. No analytics or Meta script is loaded here —
     PRD §15 requires the consent approach to be configured first. Wire your
     tag manager to these dataLayer events when that decision is made.

     HARD RULE (PRD §15): never pass names, emails, phone numbers, free-text
     messages, or any other personal data as an event parameter. `track()`
     strips anything not on the allow-list below as a second line of defense.
     ---------------------------------------------------------------------- */

  var ALLOWED_PARAMS = [
    "locale", "page_type", "package_id", "displayed_price", "campaign",
    "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
    "field_name", "error_type", "channel", "page_section",
    "from_locale", "to_locale", "faq_id", "asset_type", "asset_id"
  ];

  window.dataLayer = window.dataLayer || [];

  function track(eventName, params) {
    var payload = { event: eventName };
    if (params) {
      Object.keys(params).forEach(function (key) {
        if (ALLOWED_PARAMS.indexOf(key) === -1) return;      // drop unknown keys
        var value = params[key];
        if (value === undefined || value === null || value === "") return;
        payload[key] = value;
      });
    }
    window.dataLayer.push(payload);
  }

  // Exposed so page-level scripts (e.g. thank-you) can use the same guard rails.
  window.eaTrack = track;

  var LOCALE = document.documentElement.getAttribute("lang") || "en-US";
  var PAGE_TYPE = document.body.getAttribute("data-page-type") || "landing";

  /* ------------------------------------------------------------------------
     2. Campaign attribution (PRD §10.2)

     UTMs arrive on the first pageview but the visitor may scroll, switch
     language, or come back later before submitting. Persist them in
     sessionStorage so attribution survives navigation, then stamp them into
     the form's hidden fields.
     ---------------------------------------------------------------------- */

  var UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  var STORE_KEY = "ea_attribution";

  function safeStorage(action, key, value) {
    // Private-mode Safari throws on setItem; attribution is not worth a crash.
    try {
      if (action === "get") return window.sessionStorage.getItem(key);
      if (action === "set") return window.sessionStorage.setItem(key, value);
      if (action === "remove") return window.sessionStorage.removeItem(key);
    } catch (e) { return null; }
  }

  function getAttribution() {
    var stored = {};
    var raw = safeStorage("get", STORE_KEY);
    if (raw) {
      try { stored = JSON.parse(raw) || {}; } catch (e) { stored = {}; }
    }

    var params = new URLSearchParams(window.location.search);
    var sawUtmThisVisit = false;

    UTM_KEYS.forEach(function (key) {
      var value = params.get(key);
      if (value) { stored[key] = value.slice(0, 200); sawUtmThisVisit = true; }
    });

    // Only overwrite referrer/landing page on the session's first touch, so a
    // later internal navigation does not overwrite the true entry point.
    if (sawUtmThisVisit || !stored.landing_page) {
      stored.landing_page = window.location.pathname;
      stored.referrer = document.referrer ? document.referrer.slice(0, 300) : "";
    }
    stored.locale = LOCALE;

    safeStorage("set", STORE_KEY, JSON.stringify(stored));
    return stored;
  }

  var attribution = getAttribution();

  function campaignLabel() {
    return attribution.utm_campaign || "(none)";
  }

  track("page_view", {
    locale: LOCALE,
    page_type: PAGE_TYPE,
    utm_source: attribution.utm_source,
    utm_medium: attribution.utm_medium,
    utm_campaign: attribution.utm_campaign,
    utm_content: attribution.utm_content,
    utm_term: attribution.utm_term
  });

  /* ------------------------------------------------------------------------
     3. Header: mobile menu + language switcher (PRD §7.1)
     ---------------------------------------------------------------------- */

  var menuToggle = document.querySelector("[data-menu-toggle]");
  var mobileNav = document.getElementById("mobile-nav");

  if (menuToggle && mobileNav) {
    menuToggle.addEventListener("click", function () {
      var isOpen = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", String(!isOpen));
      mobileNav.hidden = isOpen;
    });

    mobileNav.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        menuToggle.setAttribute("aria-expanded", "false");
        mobileNav.hidden = true;
      }
    });
  }

  var langToggle = document.querySelector("[data-lang-toggle]");
  var langMenu = document.getElementById("lang-menu");

  function closeLangMenu() {
    if (!langToggle || !langMenu) return;
    langToggle.setAttribute("aria-expanded", "false");
    langMenu.hidden = true;
  }

  if (langToggle && langMenu) {
    langToggle.addEventListener("click", function (event) {
      event.stopPropagation();
      var isOpen = langToggle.getAttribute("aria-expanded") === "true";
      langToggle.setAttribute("aria-expanded", String(!isOpen));
      langMenu.hidden = isOpen;
    });

    document.addEventListener("click", function (event) {
      if (!event.target.closest(".lang-switcher")) closeLangMenu();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeLangMenu();
        if (langToggle) langToggle.focus();
      }
    });
  }

  /* Language switching (PRD §9.3)
     Never auto-redirect by browser language, and never change language without
     an explicit action — this only runs on a real click. UTM parameters carry
     across so attribution is not lost at the language boundary. */
  document.querySelectorAll("[data-lang-link]").forEach(function (link) {
    link.addEventListener("click", function (event) {
      var target = link.getAttribute("data-lang-link");
      if (target === LOCALE) { event.preventDefault(); closeLangMenu(); return; }

      track("language_switch", {
        from_locale: LOCALE,
        to_locale: target,
        page_section: link.closest("footer") ? "footer" : "header"
      });

      var search = window.location.search;
      if (search && link.href.indexOf("?") === -1) {
        event.preventDefault();
        window.location.href = link.href + search;
      }
    });
  });

  /* ------------------------------------------------------------------------
     4. Sticky mobile inquiry bar (PRD §12.4)
     Appears only after the hero has scrolled out of view.
     ---------------------------------------------------------------------- */

  var stickyBar = document.querySelector("[data-sticky-cta]");
  var hero = document.querySelector("[data-hero]");

  if (stickyBar && hero && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      stickyBar.classList.toggle("is-visible", !entries[0].isIntersecting);
    }, { rootMargin: "-120px 0px 0px 0px" }).observe(hero);
  }

  /* ------------------------------------------------------------------------
     5. Package selection (PRD §6.1, FR-004)
     A package CTA prefills the Experience field, then moves focus to the form.
     ---------------------------------------------------------------------- */

  var form = document.querySelector("[data-inquiry-form]");
  var packageField = document.getElementById("experience");

  document.querySelectorAll("[data-package-select]").forEach(function (button) {
    button.addEventListener("click", function () {
      var packageId = button.getAttribute("data-package-select");
      var price = button.getAttribute("data-package-price") || "";

      track("package_select", {
        package_id: packageId,
        displayed_price: price,
        locale: LOCALE
      });

      if (packageField) {
        packageField.value = packageId;
        // Native change listeners (validation, hidden mirror) must still run.
        packageField.dispatchEvent(new Event("change", { bubbles: true }));
      }

      var hidden = document.querySelector('[name="selected_package"]');
      if (hidden) hidden.value = packageId;

      // Focus lands on the form heading so screen-reader users are told where
      // they were moved to, rather than being dropped mid-form.
      var anchor = document.getElementById("inquiry-heading");
      if (anchor) {
        window.setTimeout(function () { anchor.focus({ preventScroll: true }); }, 400);
      }
    });
  });

  /* package_view — fires once per card when it reaches the view threshold */
  if ("IntersectionObserver" in window) {
    var cardObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        track("package_view", {
          package_id: entry.target.getAttribute("data-package-id"),
          locale: LOCALE
        });
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.5 });

    document.querySelectorAll("[data-package-id]").forEach(function (card) {
      cardObserver.observe(card);
    });
  }

  /* ------------------------------------------------------------------------
     6. FAQ, gallery and contact tracking (PRD §15)
     ---------------------------------------------------------------------- */

  document.querySelectorAll("[data-faq-id]").forEach(function (item) {
    item.addEventListener("toggle", function () {
      if (!item.open) return;
      track("faq_open", { faq_id: item.getAttribute("data-faq-id"), locale: LOCALE });
    });
  });

  document.querySelectorAll("[data-contact-channel]").forEach(function (link) {
    link.addEventListener("click", function () {
      track("contact_click", {
        channel: link.getAttribute("data-contact-channel"),
        page_section: link.getAttribute("data-section") || "unknown",
        locale: LOCALE
      });
    });
  });

  document.querySelectorAll("[data-gallery-asset]").forEach(function (item) {
    item.addEventListener("click", function () {
      track("gallery_engage", {
        asset_type: item.getAttribute("data-asset-type") || "image",
        asset_id: item.getAttribute("data-gallery-asset"),
        locale: LOCALE
      });
    });
  });

  /* ------------------------------------------------------------------------
     7. Inquiry form (PRD §10.3, §19)
     ---------------------------------------------------------------------- */

  if (!form) return;

  var messages = {
    required: form.getAttribute("data-msg-required") || "This field is required.",
    email: form.getAttribute("data-msg-email") || "Enter a valid email address.",
    tel: form.getAttribute("data-msg-tel") || "Enter a valid phone number.",
    date: form.getAttribute("data-msg-date") || "Choose a date, or check “My date is flexible.”",
    summary: form.getAttribute("data-msg-summary") || "Please fix the following before sending:",
    network: form.getAttribute("data-msg-network") ||
      "We could not send your inquiry. Please try again, or contact us directly using the buttons below.",
    sending: form.getAttribute("data-msg-sending") || "Sending…"
  };

  /* 7a. Stamp attribution into the hidden fields (PRD §10.2) */
  function stampHiddenFields() {
    UTM_KEYS.concat(["landing_page", "referrer", "locale"]).forEach(function (key) {
      var input = form.querySelector('[name="' + key + '"]');
      if (input) input.value = attribution[key] || "";
    });
    var stamp = form.querySelector('[name="submission_timestamp"]');
    if (stamp) stamp.value = new Date().toISOString();

    // Re-sync from the visible field so selected_package can never disagree
    // with what the visitor actually chose, however they last changed it.
    var selected = form.querySelector('[name="selected_package"]');
    if (selected && packageField) selected.value = packageField.value;
  }
  stampHiddenFields();

  if (packageField) {
    packageField.addEventListener("change", function () {
      var hidden = form.querySelector('[name="selected_package"]');
      if (hidden) hidden.value = packageField.value;
    });
  }

  /* 7b. lead_form_start — first interaction only (PRD §15) */
  var formStarted = false;
  form.addEventListener("focusin", function () {
    if (formStarted) return;
    formStarted = true;
    track("lead_form_start", {
      package_id: packageField ? packageField.value : "",
      locale: LOCALE,
      campaign: campaignLabel()
    });
  });

  /* 7c. "Flexible date" relaxes the required date field */
  var dateInput = document.getElementById("preferred-date");
  var flexibleInput = document.getElementById("date-flexible");

  function syncDateRequirement() {
    if (!dateInput || !flexibleInput) return;
    if (flexibleInput.checked) {
      dateInput.removeAttribute("required");
      clearFieldError(dateInput);
    } else {
      dateInput.setAttribute("required", "");
    }
  }
  if (flexibleInput) flexibleInput.addEventListener("change", syncDateRequirement);

  // A date in the past is almost always a typo, not an intent.
  if (dateInput && !dateInput.getAttribute("min")) {
    dateInput.setAttribute("min", new Date().toISOString().split("T")[0]);
  }

  /* 7d. Character counter for the free-text field (PRD §10.1: 1,000 max) */
  var vision = document.getElementById("vision");
  var visionCount = document.getElementById("vision-count");
  if (vision && visionCount) {
    var updateCount = function () {
      visionCount.textContent = vision.value.length + " / " + (vision.maxLength || 1000);
    };
    vision.addEventListener("input", updateCount);
    updateCount();
  }

  /* 7e. Validation.
     Inline, non-destructive: an error never clears a valid value (PRD §19). */

  var errorSummary = document.getElementById("form-error-summary");
  var errorSummaryList = document.getElementById("form-error-summary-list");

  function fieldWrapper(input) {
    return input.closest(".field") || input.closest("fieldset");
  }

  function fieldLabel(input) {
    var wrapper = fieldWrapper(input);
    if (!wrapper) return input.name;
    var label = wrapper.querySelector("label, legend, .label");
    if (!label) return input.name;
    // Strip the required marker, hint text, and the screen-reader-only
    // "(required)" — the summary already says what is wrong with each field.
    var clone = label.cloneNode(true);
    clone.querySelectorAll(".req, .field__hint, .visually-hidden").forEach(function (n) {
      n.remove();
    });
    var text = clone.textContent.trim().replace(/\s+/g, " ");
    // Long consent-style labels make the summary unscannable.
    return text.length > 60 ? text.slice(0, 57).trim() + "…" : text;
  }

  function showFieldError(input, message) {
    var wrapper = fieldWrapper(input);
    if (!wrapper) return;
    wrapper.classList.add("is-invalid");
    input.setAttribute("aria-invalid", "true");

    var errorEl = wrapper.querySelector(".field__error");
    if (errorEl) {
      errorEl.textContent = message;
      if (!errorEl.id) errorEl.id = (input.id || input.name) + "-error";
      input.setAttribute("aria-describedby", errorEl.id);
    }
  }

  function clearFieldError(input) {
    var wrapper = fieldWrapper(input);
    if (!wrapper) return;
    wrapper.classList.remove("is-invalid");
    input.removeAttribute("aria-invalid");
  }

  function validateField(input) {
    if (input.type === "hidden" || input.disabled) return null;

    var value = (input.value || "").trim();

    if (input.hasAttribute("required")) {
      if (input.type === "radio") {
        var group = form.querySelectorAll('[name="' + input.name + '"]');
        var anyChecked = Array.prototype.some.call(group, function (r) { return r.checked; });
        if (!anyChecked) return messages.required;
        return null;
      }
      if (input.type === "checkbox" && !input.checked) return messages.required;
      if (input.type !== "checkbox" && !value) {
        return input.type === "date" ? messages.date : messages.required;
      }
    }

    if (!value) return null;   // optional and empty — nothing more to check

    if (input.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      return messages.email;
    }
    // Permissive on purpose: international and formatted numbers must pass.
    if (input.type === "tel" && value.replace(/[^\d]/g, "").length < 10) {
      return messages.tel;
    }
    return null;
  }

  function collectControls() {
    var seenRadioGroups = {};
    return Array.prototype.filter.call(
      form.querySelectorAll("input, select, textarea"),
      function (input) {
        if (input.type === "hidden" || input.disabled) return false;
        if (input.name === "bot-field") return false;
        if (input.type === "radio") {
          if (seenRadioGroups[input.name]) return false;
          seenRadioGroups[input.name] = true;
        }
        return true;
      }
    );
  }

  function validateForm() {
    var errors = [];

    collectControls().forEach(function (input) {
      var message = validateField(input);
      if (message) {
        showFieldError(input, message);
        errors.push({ input: input, label: fieldLabel(input), message: message });
        track("lead_form_error", {
          field_name: input.name,          // field NAME only — never the value
          error_type: message === messages.required ? "required" : "format",
          locale: LOCALE
        });
      } else {
        clearFieldError(input);
      }
    });

    return errors;
  }

  function renderErrorSummary(errors) {
    if (!errorSummary || !errorSummaryList) return;

    if (!errors.length) {
      errorSummary.hidden = true;
      errorSummaryList.innerHTML = "";
      return;
    }

    errorSummaryList.innerHTML = "";
    errors.forEach(function (error) {
      var li = document.createElement("li");
      var link = document.createElement("a");
      link.href = "#" + (error.input.id || error.input.name);
      link.textContent = error.label + " — " + error.message;
      link.addEventListener("click", function (event) {
        event.preventDefault();
        error.input.focus();
      });
      li.appendChild(link);
      errorSummaryList.appendChild(li);
    });

    errorSummary.hidden = false;
    errorSummary.focus();
  }

  // Re-validate on blur, but only once a field has already failed — validating
  // a field the visitor has not finished with yet is hostile.
  form.addEventListener("blur", function (event) {
    var input = event.target;
    if (!input.name || input.type === "hidden") return;
    var wrapper = fieldWrapper(input);
    if (!wrapper || !wrapper.classList.contains("is-invalid")) return;
    var message = validateField(input);
    if (message) { showFieldError(input, message); } else { clearFieldError(input); }
  }, true);

  /* 7f. Submission.

     Netlify accepts a urlencoded POST containing `form-name`. Submitting over
     fetch lets us distinguish a real success from a failure and show a retry
     path — PRD §14 requires that no inquiry ever fails silently.

     If fetch is unavailable the listener bails out and the browser performs the
     form's native POST to the action URL, which Netlify also handles. */

  var submitButton = form.querySelector('[type="submit"]');
  var submitDefaultText = submitButton ? submitButton.textContent : "";
  var networkError = document.getElementById("form-network-error");
  var isSubmitting = false;

  form.addEventListener("submit", function (event) {
    if (isSubmitting) { event.preventDefault(); return; }

    syncDateRequirement();
    var errors = validateForm();

    if (errors.length) {
      event.preventDefault();
      renderErrorSummary(errors);
      return;
    }
    renderErrorSummary([]);
    stampHiddenFields();

    if (!window.fetch) return;   // let the native POST happen
    event.preventDefault();

    isSubmitting = true;
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = messages.sending;
    }
    if (networkError) networkError.hidden = true;

    var body = new URLSearchParams(new FormData(form)).toString();

    fetch(form.getAttribute("data-endpoint") || "/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body
    })
      .then(function (response) {
        if (!response.ok) throw new Error("Submission failed: " + response.status);

        // Fired on a Netlify-confirmed success, exactly once (PRD §15).
        track("lead_submit_success", {
          package_id: packageField ? packageField.value : "",
          locale: LOCALE,
          campaign: campaignLabel()
        });

        safeStorage("set", "ea_lead_submitted", "1");
        window.location.href = form.getAttribute("action");
      })
      .catch(function () {
        isSubmitting = false;
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = submitDefaultText;
        }
        if (networkError) {
          networkError.hidden = false;
          networkError.focus();
        }
        track("lead_form_error", { error_type: "network", locale: LOCALE });
      });
  });
})();
