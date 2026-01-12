import loadHome from "./pages/home";
import loadAbout from "./pages/about";
import loadContact from "./pages/contact";

loadHome();

document.getElementById("about-btn").addEventListener("click", () => {
  loadAbout();
});

document.getElementById("contact-btn").addEventListener("click", () => {
  loadContact();
});
document.getElementById("home-btn").addEventListener("click", () => {
  loadHome();
});
