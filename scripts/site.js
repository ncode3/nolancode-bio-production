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

if (bookingForm && formStatus) {
    bookingForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const data = new FormData(bookingForm);
        const email = normalizeValue(data.get("email"));
        const message = normalizeValue(data.get("message"));
        const honeypot = normalizeValue(data.get("_gotcha"));

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

        const body = [
            `Name: ${data.get("name") || ""}`,
            `Organization: ${data.get("organization") || ""}`,
            `Email: ${email}`,
            `Event Date: ${data.get("eventDate") || ""}`,
            `Event Location: ${data.get("eventLocation") || ""}`,
            `Audience Size: ${data.get("audienceSize") || ""}`,
            `Format: ${data.get("format") || ""}`,
            `Budget Range: ${data.get("budget") || ""}`,
            `Inquiry Type: ${data.get("inquiryType") || ""}`,
            `Recording Plans: ${data.get("recordingPlans") || ""}`,
            "",
            "Message:",
            message
        ].join("\n");

        const subject = encodeURIComponent(`Booking Request - ${data.get("organization") || "Event Inquiry"}`);
        const mailtoBody = encodeURIComponent(body);
        const mailto = `mailto:nolan@atlanta-robotics.org?subject=${subject}&body=${mailtoBody}`;

        window.location.href = mailto;
        formStatus.textContent = "Your mail client should open with the booking request prefilled.";
    });
}
