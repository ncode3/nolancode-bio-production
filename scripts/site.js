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

            if (Date.now() - startedAt > 8000) {
                window.clearInterval(timer);
                reject(new Error("Contact verification is unavailable."));
            }
        }, 100);
    });
}

async function loadTurnstile() {
    const widget = document.getElementById("turnstile-widget");
    if (!widget) return;

    try {
        const response = await fetch("/api/contact-config", {
            headers: {
                "Accept": "application/json"
            }
        });

        if (!response.ok) throw new Error("Contact verification is unavailable.");
        const config = await response.json();
        if (!config.siteKey) throw new Error("Contact verification is unavailable.");

        const turnstile = await waitForTurnstile();
        if (turnstileWidgetId !== null) return;
        turnstileWidgetId = turnstile.render(widget, {
            sitekey: config.siteKey
        });
    } catch (_error) {
        setFormError("Contact verification is unavailable. Please try again later.");
    }
}

if (bookingForm && formStatus) {
    loadTurnstile();

    bookingForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const data = new FormData(bookingForm);
        const email = normalizeValue(data.get("email"));
        const message = normalizeValue(data.get("message"));
        const honeypot = normalizeValue(data.get("_gotcha"));
        const turnstileToken = normalizeValue(data.get("cf-turnstile-response"));

        if (honeypot) {
            setFormError("Your request could not be submitted.");
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

        if (!turnstileToken) {
            setFormError("Please complete the verification challenge.");
            return;
        }

        const submitButton = bookingForm.querySelector("button[type='submit']");
        if (submitButton) submitButton.disabled = true;
        formStatus.textContent = "Submitting...";

        try {
            const response = await fetch(bookingForm.action, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: normalizeValue(data.get("name")),
                    organization: normalizeValue(data.get("organization")),
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
            formStatus.textContent = "Thanks. Your request was submitted.";
        } catch (_error) {
            setFormError("Your request could not be submitted. Please try again later.");
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });
}
