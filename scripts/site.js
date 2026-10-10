document.documentElement.classList.add("js");
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
        if (!config.siteKey) {
            widget.hidden = true;
            turnstileEnabled = false;
            return;
        }

        const turnstile = await waitForTurnstile();
        if (turnstileWidgetId !== null) return;
        turnstileEnabled = true;
        turnstileWidgetId = turnstile.render(widget, {
            sitekey: config.siteKey
        });
    } catch (_error) {
        widget.hidden = true;
        turnstileEnabled = false;
    }
}

if (bookingForm && formStatus) {
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
        isSubmitting = true;
        if (submitButton) submitButton.disabled = true;
        setFormStatus("Submitting...", "info");

        try {
            const response = await fetch(bookingForm.action, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    organization,
                    email,
                    eventDate: normalizeValue(data.get("eventDate")),
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
        } catch (_error) {
            setFormError("Your request could not be submitted. Please email nolan@atlanta-robotics.org or schedule a call above.");
        } finally {
            isSubmitting = false;
            if (submitButton) submitButton.disabled = false;
        }
    });
}

const videoButton = document.getElementById("play-speaking-video");
const videoPlayer = document.getElementById("speaking-video");
if (videoButton && videoPlayer) {
    videoButton.hidden = false;
    videoButton.addEventListener("click", () => {
        const frame = document.createElement("iframe");
        frame.src = "https://www.youtube-nocookie.com/embed/vqi_QDIVjsg?start=478&end=640&autoplay=1&cc_load_policy=1&rel=0";
        frame.title = "Nolan S. Code: 2-minute, 42-second physical AI speaking highlight, RenderATL, July 8, 2026";
        frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
        frame.referrerPolicy = "strict-origin-when-cross-origin";
        frame.allowFullscreen = true;
        videoPlayer.replaceChildren(frame);
        frame.focus();
    });
}
