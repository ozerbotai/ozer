/* Language Dropdown */
document.addEventListener("DOMContentLoaded", function () {
  const dropdownButton = document.getElementById("dropdownLanguageButton");
  const dropdownButtonText = document.getElementById("dropdownLanguageButtonText");
  const dropdownItems = document.querySelectorAll(".dropdown-item");

  dropdownItems.forEach((item) => {
    item.addEventListener("click", function (event) {
      event.preventDefault();
      const selectedLanguage = this.getAttribute("data-lang");
      const selectedText = this.textContent;

      // Update the dropdown button text
      dropdownButtonText.textContent = selectedText;

      // Update the dropdown items
      dropdownItems.forEach((langItem) => {
        if (langItem.getAttribute("data-lang") === selectedLanguage) {
          langItem.classList.add("d-none");
        } else {
          langItem.classList.remove("d-none");
        }
      });
    });
  });

  // Initially hide the current language in the dropdown
  const currentLang = dropdownButtonText.textContent.trim().toLowerCase();
  dropdownItems.forEach((item) => {
    if (item.textContent.trim().toLowerCase() === currentLang) {
      item.classList.add("d-none");
    }
  });
});
