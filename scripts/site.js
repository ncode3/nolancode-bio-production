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

if (bookingForm && formStatus) {
    bookingForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const data = new FormData(bookingForm);
        const body = [
            `Name: ${data.get("name") || ""}`,
            `Organization: ${data.get("organization") || ""}`,
            `Email: ${data.get("email") || ""}`,
            `Event Date: ${data.get("eventDate") || ""}`,
            `Event Location: ${data.get("eventLocation") || ""}`,
            `Audience Size: ${data.get("audienceSize") || ""}`,
            `Format: ${data.get("format") || ""}`,
            `Speaker Budget: ${data.get("budget") || ""}`,
            `Recording Plans: ${data.get("recordingPlans") || ""}`,
            "",
            "Message:",
            data.get("message") || ""
        ].join("\n");

        const subject = encodeURIComponent(`Booking Request - ${data.get("organization") || "Event Inquiry"}`);
        const mailtoBody = encodeURIComponent(body);
        const mailto = `mailto:nolan@atlanta-robotics.org?subject=${subject}&body=${mailtoBody}`;

        window.location.href = mailto;
        formStatus.textContent = "Your mail client should open with the booking request prefilled.";
    });
}
