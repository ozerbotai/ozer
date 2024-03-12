document.addEventListener('DOMContentLoaded', async function () {
    populateLanguageDropdown();
    document.getElementById("headerButtonLogout").addEventListener("click", async function() {
      window.location.href = '/logout';
    });
})

function populateLanguageDropdown() {
    const selectedLang = getSelectedLanguage();

    const dropdownMenu = document.getElementById('languageDropdownMenu');
    dropdownMenu.innerHTML = '';

    Object.keys(languages).forEach(lang => {
      const listItem = document.createElement('li');
      const button = document.createElement('button');
      button.classList.add('dropdown-item');
      button.setAttribute('data-lang', lang);
      button.textContent = languages[lang];
      if (lang === selectedLang) {
        button.classList.add('d-none');
        document.getElementById('dropdownLanguageButtonText').innerText = languages[lang];
      }
      listItem.appendChild(button);
      dropdownMenu.appendChild(listItem);
    });

    document.querySelectorAll('.dropdown-item').forEach(function(button) {
        button.addEventListener('click', function() {
            const selectedLang = this.getAttribute('data-lang');
            document.getElementById('dropdownLanguageButtonText').innerText = languages[selectedLang];
            setCookie('language', selectedLang, 1100);
            applyTranslations();
            populateLanguageDropdown();
        });
    });
}