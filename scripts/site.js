const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");

if (menuToggle && siteNav) {
    menuToggle.addEventListener("click", () => {
        const expanded = menuToggle.getAttribute("aria-expanded") === "true";
        menuToggle.setAttribute("aria-expanded", String(!expanded));
        siteNav.classList.toggle("is-open");
    });
}

const bookingForm = document.getElementById("booking-form");
const formStatus = document.getElementById("form-status");
const maxEmailLength = 254;
const maxMessageLength = 2000;
const maxAllowedUrls = 2;
let turnstileWidgetId = null;
let isSubmitting = false;
let turnstileEnabled = false;

function normalizeValue(value) {
    return String(value || "").trim();
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function countUrls(message) {
    const matches = message.match(/\b(?:https?:\/\/|www\.|[a-z0-9-]+\.[a-z]{2,})(?:[^\s]*)/gi);
    return matches ? matches.length : 0;
}

function setFormError(message) {
    formStatus.textContent = message;
    formStatus.dataset.state = "error";
}

function setFormStatus(message, state = "info") {
    formStatus.textContent = message;
    formStatus.dataset.state = state;
}

function waitForTurnstile() {
    return new Promise((resolve, reject) => {
        const startedAt = Date.now();
        const timer = window.setInterval(() => {
            if (window.turnstile) {
                window.clearInterval(timer);
                resolve(window.turnstile);
                return;
            }

            if (Date.now() - startedAt > 5000) {
                window.clearInterval(timer);
                reject(new Error("Turnstile did not load."));
            }
        }, 100);
    });
}

async function loadTurnstile() {
    const widget = document.getElementById("turnstile-widget");
    if (!widget) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);

    try {
        const response = await fetch("/api/contact-config", {
            headers: {
                "Accept": "application/json"
            },
            cache: "no-store",
            signal: controller.signal
        });

        if (!response.ok) throw new Error("Turnstile configuration unavailable.");
        const config = await response.json();
        if (!config.siteKey) {
            widget.hidden = true;
            turnstileEnabled = false;
            return;
        }

        const turnstile = await waitForTurnstile();
        if (turnstileWidgetId !== null) return;
        turnstileEnabled = true;
        turnstileWidgetId = turnstile.render(widget, {
            sitekey: config.siteKey,
            "error-callback": () => {
                turnstileEnabled = false;
                widget.hidden = true;
            },
            "unsupported-callback": () => {
                turnstileEnabled = false;
                widget.hidden = true;
            }
        });
    } catch (_error) {
        widget.hidden = true;
        turnstileEnabled = false;
    } finally {
        window.clearTimeout(timeout);
    }
}

if (bookingForm && formStatus) {
    setFormStatus("", "info");
    loadTurnstile();

    bookingForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (isSubmitting) return;

        const data = new FormData(bookingForm);
        const name = normalizeValue(data.get("name"));
        const organization = normalizeValue(data.get("organization"));
        const email = normalizeValue(data.get("email"));
        const message = normalizeValue(data.get("message"));
        const honeypot = normalizeValue(data.get("_gotcha"));
        const turnstileToken = normalizeValue(data.get("cf-turnstile-response"));

        if (honeypot) {
            setFormError("Your request could not be submitted.");
            return;
        }

        if (!name) {
            setFormError("Please enter your name.");
            return;
        }

        if (!organization) {
            setFormError("Please enter your organization.");
            return;
        }

        if (!email || email.length > maxEmailLength || !isValidEmail(email)) {
            setFormError("Please enter a valid email address.");
            return;
        }

        if (!message) {
            setFormError("Please include a short message.");
            return;
        }

        if (message.length > maxMessageLength) {
            setFormError(`Please keep the message under ${maxMessageLength} characters.`);
            return;
        }

        if (countUrls(message) > maxAllowedUrls) {
            setFormError("Please remove extra links from your message.");
            return;
        }

        if (turnstileEnabled && !turnstileToken) {
            setFormError("Please complete the verification challenge.");
            return;
        }

        const submitButton = bookingForm.querySelector("button[type='submit']");
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 20000);
        isSubmitting = true;
        if (submitButton) submitButton.disabled = true;
        setFormStatus("Submitting...", "info");

        try {
            const response = await fetch(bookingForm.action, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                cache: "no-store",
                signal: controller.signal,
                body: JSON.stringify({
                    name,
                    organization,
                    email,
                    eventDate: normalizeValue(data.get("eventDate")),
                    eventLocation: normalizeValue(data.get("eventLocation")),
                    audienceSize: normalizeValue(data.get("audienceSize")),
                    format: normalizeValue(data.get("format")),
                    budget: normalizeValue(data.get("budget")),
                    inquiryType: normalizeValue(data.get("inquiryType")),
                    recordingPlans: normalizeValue(data.get("recordingPlans")),
                    message,
                    _gotcha: honeypot,
                    turnstileToken
                })
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                setFormError(error.message || "Your request could not be submitted.");
                return;
            }

            bookingForm.reset();
            if (window.turnstile && turnstileWidgetId !== null) window.turnstile.reset(turnstileWidgetId);
            setFormStatus("Thanks. Your request was submitted.", "success");
        } catch (error) {
            if (error.name === "AbortError") {
                setFormError("The request timed out. Please try again.");
            } else {
                setFormError("Your request could not be submitted. Please try again later.");
            }
        } finally {
            window.clearTimeout(timeout);
            isSubmitting = false;
            if (submitButton) submitButton.disabled = false;
        }
    });
}
