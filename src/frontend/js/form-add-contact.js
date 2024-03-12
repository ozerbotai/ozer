document.addEventListener("DOMContentLoaded", function () {
    const contactoffcanvasSpinner = document.getElementById("contactoffcanvasSpinner");
    const searchInput = document.getElementById("contactSearchInput");
    const suggestionsContainer = document.getElementById("suggestionsContainerContact");
    let suggestionSelected = false;
  
    // Form variables
    const contactForm = document.getElementById("addContactForm");
    const contactRadios = document.getElementsByName("addContactRadio");
    const contactRadioFeedback = document.getElementById("config-paragraph-contactRadioFeedbackContactsAddForm");
  
    // Success toast variables
    const addContactSuccessToast = document.getElementById("addContactSuccessToast");
    const addContactSuccessToastBootstrap =
      bootstrap.Toast.getOrCreateInstance(addContactSuccessToast);
    const scrollToBottom = () => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    };
  
    // Offcanvas variables
    const offcanvasElementAddContact = document.getElementById("offcanvasAddContact");
    const offcanvasInstanceAddContact = new bootstrap.Offcanvas(
      offcanvasElementAddContact
    );
  
    // Search suggestions
    function updateSuggestions() {
      const items = ContactsGroups.contacts    
      const input = searchInput.value.toLowerCase();
      suggestionsContainer.innerHTML = "";
      suggestionSelected = false;
  
      if (input.length === 0) return;
  
      const suggestions = items.filter((item) =>
        item.name.toLowerCase().includes(input)
      );
  
      if (suggestions.length === 0) {
        const noResultsElement = document.createElement("div");
        noResultsElement.classList.add("no-results");
        noResultsElement.textContent = i18next.t('config-error-contactNoResults');
        suggestionsContainer.appendChild(noResultsElement);
        suggestionSelected = false;
      } else {
        const suggestionList = document.createElement("ul");
        suggestionList.classList.add("suggestion-list");
  
        suggestions.forEach((suggestion) => {
          const suggestionElement = document.createElement("li");
          suggestionElement.classList.add("suggestion-list__item");
  
          const button = document.createElement("button");
          button.textContent = suggestion.name;
          button.classList.add("suggestion-button");
  
          button.addEventListener("click", function () {
            searchInput.value = suggestion.name;
            selectedContactPhone = suggestion.id;
            suggestionsContainer.innerHTML = "";
            suggestionSelected = true;
            contactSearchInputFeedback.removeAttribute('data-error-type');
            contactSearchInputFeedback.style.display = "none";
          });
  
          button.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
              searchInput.value = suggestion.name;
              selectedContactPhone = suggestion.id;
              suggestionsContainer.innerHTML = "";
              suggestionSelected = true;
            }
          });
  
          // Focusout event to close the list when focus is lost
          button.addEventListener("focusout", function (event) {
            setTimeout(function () {
              if (!suggestionsContainer.contains(document.activeElement)) {
                suggestionsContainer.innerHTML = "";
              }
            }, 300);
          });
  
          suggestionElement.appendChild(button);
          suggestionList.appendChild(suggestionElement);
        });
  
        suggestionsContainer.appendChild(suggestionList);
      }
      return suggestionSelected;
    }
  
    searchInput.addEventListener("keyup", updateSuggestions);
  
    searchInput.addEventListener("focus", function () {
      if (searchInput.value.length > 0) {
        updateSuggestions();
      }
    });
  
    searchInput.addEventListener("blur", function () {
      setTimeout(function () {
        if (
          !suggestionSelected &&
          !suggestionsContainer.contains(document.activeElement)
        ) {
          searchInput.value = "";
          selectedContactPhone = null;
          suggestionsContainer.innerHTML = "";
        }
      }, 300);
    });
  
    document.addEventListener("click", function (event) {
      if (
        !suggestionsContainer.contains(event.target) &&
        event.target !== searchInput
      ) {
        suggestionsContainer.innerHTML = "";
      }
    });
  
    // Form validation
    contactForm.addEventListener("submit", async function (event) {
      event.preventDefault();
  
      let isValid = true;

      const contactSearchInputFeedback = document.getElementById("contactSearchInputFeedback");
  
      // Contact search input validation
      if (!suggestionSelected) {
        contactSearchInputFeedback.innerText = i18next.t('config-error-contactSelectionRequired');
        contactSearchInputFeedback.setAttribute('data-error-type', 'config-error-contactSelectionRequired');
        contactSearchInputFeedback.style.display = "block";
        searchInput.classList.add("is-invalid");
        isValid = false;
      } else {
        const contactException = await getContactException(phoneInformation.generalConfiguration.user_phone, selectedContactPhone)
        if (contactException.length!=0) {
          contactSearchInputFeedback.innerText = i18next.t('config-error-contactAlreadyHasException');
          contactSearchInputFeedback.setAttribute('data-error-type', 'config-error-contactAlreadyHasException');
          contactSearchInputFeedback.style.display = "block";
          searchInput.classList.add("is-invalid");
          isValid = false;
        } else {
          searchInput.classList.remove("is-invalid");
          if (contactSearchInputFeedback) {
            contactSearchInputFeedback.removeAttribute('data-error-type');
            contactSearchInputFeedback.style.display = "none";
          }
        }
      }
  
      // Radio button validation
      let radioChecked = false;
      for (const radio of contactRadios) {
        if (radio.checked) {
          radioChecked = true;
          break;
        } else {
          radio.classList.add("is-invalid");
        }
      }
  
      // Add classes to radio inputs and feedback text if invalid
      if (!radioChecked) {
        contactRadioFeedback.style.display = "block";
        for (const radio of contactRadios) {
          radio.classList.add("is-invalid");
        }
        isValid = false;
      } else {
        contactRadioFeedback.style.display = "none";
        for (const radio of contactRadios) {
          radio.classList.remove("is-invalid");
        }
      }
  
      // Reset form inputs
      function resetFormInputs() {
        contactForm.reset();
  
        // Remove is-invalid classes
        searchInput.classList.remove("is-invalid");
        for (const radio of contactRadios) {
          radio.classList.remove("is-invalid");
        }
        contactRadioFeedback.style.display = "none";
      }
  
      // Submit the form if all fields are valid
      if (isValid) {
        contactoffcanvasSpinner.style.display = "block";
        // Save the new contact exception        
        const contactException = await getContactException(phoneInformation.generalConfiguration.user_phone, selectedContactPhone)
        if (contactException.length===0) {
          let modeId
            const alias = searchInput.value
            if (document.getElementById("addContactRadioRespond").checked) {
              modeId=1
            } else if (document.getElementById("addContactRadioPrivate").checked) {
              modeId=2
            } else if (document.getElementById("addContactRadioOff").checked) {
              modeId=4
            }
            const newExceptionId = await insertContactException(phoneInformation.generalConfiguration.user_phone,selectedContactPhone, modeId, alias);
            addContactExceptionRow(newExceptionId, selectedContactPhone, alias, modeId)
            updateTooltips();
        }
        if (offcanvasInstanceAddContact) {
          offcanvasInstanceAddContact.hide();
        }
        if (addContactSuccessToastBootstrap) {
          addContactSuccessToastBootstrap.show();
        }
        scrollToBottom();
        resetFormInputs();
        contactoffcanvasSpinner.style.display = "none";
        /* this.submit(); */
      }
    });
  
    // Remove is-invalid class when focusing on inputs
    searchInput.addEventListener("focus", function () {
      this.classList.remove("is-invalid");
    });
  
    // Remove is-invalid class when focusing on radio buttons
    contactRadios.forEach((radio) => {
      radio.addEventListener("focus", function () {
        contactRadios.forEach((radio) => {
          radio.classList.remove("is-invalid");
        });
        contactRadioFeedback.style.display = "none";
      });
    });
  });
