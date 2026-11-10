document.addEventListener("DOMContentLoaded", function () {
    AOS.init(); // Initialize AOS animations

    // GSAP Animation for Hero Section
    gsap.from(".hero h1", { duration: 1, opacity: 0, y: -50, ease: "power2.out" });

    // Navbar background transition on scroll
    window.addEventListener("scroll", function () {
        let navbar = document.querySelector(".navbar");
        if (window.scrollY > 50) {
            navbar.classList.add("scrolled");
        } else {
            navbar.classList.remove("scrolled");
        }
    });

    // Footer visibility on scroll
    function checkScroll() {
        let footer = document.querySelector("footer");
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
            footer.classList.add("visible");
        } else {
            footer.classList.remove("visible");
        }
    }

    window.addEventListener("scroll", checkScroll);
    checkScroll();
});
