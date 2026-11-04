"use strict";

const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#primary-navigation");

function closeMenu() {
  if (!menuToggle || !navigation) return;
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation menu");
  navigation.classList.remove("is-open");
}

if (menuToggle && navigation) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Open navigation menu" : "Close navigation menu",
    );
    navigation.classList.toggle("is-open", !isOpen);
  });

  navigation.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  document.addEventListener("click", (event) => {
    if (
      menuToggle.getAttribute("aria-expanded") === "true" &&
      !navigation.contains(event.target) &&
      !menuToggle.contains(event.target)
    ) {
      closeMenu();
    }
  });
}

const pythonInput = document.querySelector("#python-level");
const sqlInput = document.querySelector("#sql-level");
const pythonOutput = document.querySelector("#python-output");
const sqlOutput = document.querySelector("#sql-output");
const readinessResult = document.querySelector("#readiness-result");
const readinessNumber = document.querySelector(
  "#readiness-result .score-number",
);
const calculatorProgress = document.querySelector("#calculator-progress");
const calculatorProgressBar = document.querySelector(
  ".calculator-bar[role='progressbar']",
);

function updateReadiness() {
  if (
    !pythonInput ||
    !sqlInput ||
    !pythonOutput ||
    !sqlOutput ||
    !readinessResult ||
    !readinessNumber ||
    !calculatorProgress ||
    !calculatorProgressBar
  ) {
    return;
  }

  const pythonLevel = Number(pythonInput.value);
  const sqlLevel = Number(sqlInput.value);
  const score = Math.round(((pythonLevel / 10 + sqlLevel / 10) / 2) * 100);

  pythonOutput.value = String(pythonLevel);
  sqlOutput.value = String(sqlLevel);
  readinessNumber.textContent = String(score);
  calculatorProgress.style.width = `${score}%`;
  calculatorProgressBar.setAttribute("aria-valuenow", String(score));
  pythonInput.setAttribute("aria-valuenow", String(pythonLevel));
  sqlInput.setAttribute("aria-valuenow", String(sqlLevel));
}

pythonInput?.addEventListener("input", updateReadiness);
sqlInput?.addEventListener("input", updateReadiness);

const copyrightYear = document.querySelector("#copyright-year");
if (copyrightYear) copyrightYear.textContent = String(new Date().getFullYear());

const revealElements = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );
  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}
