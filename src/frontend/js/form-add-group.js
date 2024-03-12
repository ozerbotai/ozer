document.addEventListener("DOMContentLoaded", function () {
  const groupoffcanvasSpinner = document.getElementById("groupoffcanvasSpinner");
  // Search variables
  const searchInput = document.getElementById("groupSearchInput");
  const suggestionsContainer = document.getElementById("suggestionsContainerGroup");
  let suggestionSelected = false;

  // Form variables
  const groupForm = document.getElementById("addGroupForm");
  const groupRadios = document.getElementsByName("addGroupRadio");
  const groupRadioFeedback = document.getElementById("config-paragraph-groupRadioFeedbackGroupsAddForm");

  // Success toast variables
  const addGroupSuccessToast = document.getElementById("addGroupSuccessToast");
  const addGroupSuccessToastBootstrap =
    bootstrap.Toast.getOrCreateInstance(addGroupSuccessToast);
  const scrollToBottom = () => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  };

  // Offcanvas variables
  const offcanvasElementAddGroup = document.getElementById("offcanvasAddGroup");
  const offcanvasInstanceAddGroup = new bootstrap.Offcanvas(
    offcanvasElementAddGroup
  );

  // Search suggestions
  function updateSuggestions() {
    const items = ContactsGroups.groups
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
      noResultsElement.textContent = i18next.t('config-error-groupNoResults');
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
          selectedGroupId = suggestion.id;
          suggestionsContainer.innerHTML = "";
          suggestionSelected = true;
          groupSearchInputFeedback.removeAttribute('data-error-type');
          groupSearchInputFeedback.style.display = "none";
        });

        button.addEventListener("keydown", function (event) {
          if (event.key === "Enter") {
            searchInput.value = suggestion.name;
            selectedGroupId = suggestion.id;
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
        selectedGroupId = null;
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
  groupForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    let isValid = true;

    const groupSearchInputFeedback = document.getElementById("groupSearchInputFeedback");

    // Group search input validation
    if (!suggestionSelected) {
      groupSearchInputFeedback.innerText = i18next.t('config-error-groupSelectionRequired');
      groupSearchInputFeedback.setAttribute('data-error-type', 'config-error-groupSelectionRequired');
      groupSearchInputFeedback.style.display = "block";
      searchInput.classList.add("is-invalid");
      isValid = false;
    } else {
      const groupException = await getGroupException(phoneInformation.generalConfiguration.user_phone, selectedGroupId)
      if (groupException.length!=0) {
        groupSearchInputFeedback.innerText = i18next.t('config-error-groupAlreadyHasException');
        groupSearchInputFeedback.setAttribute('data-error-type', 'config-error-groupAlreadyHasException');
        groupSearchInputFeedback.style.display = "block";
        searchInput.classList.add("is-invalid");
        isValid = false;
      } else {
        searchInput.classList.remove("is-invalid");
        if (groupSearchInputFeedback) {
          groupSearchInputFeedback.removeAttribute('data-error-type');
          groupSearchInputFeedback.style.display = "none";
        }
      }
    }

    // Radio button validation
    let radioChecked = false;
    for (const radio of groupRadios) {
      if (radio.checked) {
        radioChecked = true;
        break;
      } else {
        radio.classList.add("is-invalid");
      }
    }

    // Add classes to radio inputs and feedback text if invalid
    if (!radioChecked) {
      groupRadioFeedback.style.display = "block";
      for (const radio of groupRadios) {
        radio.classList.add("is-invalid");
      }
      isValid = false;
    } else {
      groupRadioFeedback.style.display = "none";
      for (const radio of groupRadios) {
        radio.classList.remove("is-invalid");
      }
    }

    // Reset form inputs
    function resetFormInputs() {
      groupForm.reset();

      // Remove is-invalid classes
      searchInput.classList.remove("is-invalid");
      for (const radio of groupRadios) {
        radio.classList.remove("is-invalid");
      }
      groupRadioFeedback.style.display = "none";
    }

    // Submit the form if all fields are valid
    if (isValid) {
      groupoffcanvasSpinner.style.display = "block";
      // Save the new group exception        
      const groupException = await getGroupException(phoneInformation.generalConfiguration.user_phone, selectedGroupId)
      if (groupException.length===0) {
        let modeId
          const alias = searchInput.value
          if (document.getElementById("addGroupRadioRespond").checked) {
            modeId=1
          } else if (document.getElementById("addGroupRadioPrivate").checked) {
            modeId=2
          } else if (document.getElementById("addGroupRadioOff").checked) {
            modeId=4
          }
          const newExceptionId = await insertGroupException(phoneInformation.generalConfiguration.user_phone, selectedGroupId, modeId, alias);
          addGroupExceptionRow(newExceptionId, selectedGroupId, alias, modeId)
          updateTooltips();
      }
      if (offcanvasInstanceAddGroup) {
        offcanvasInstanceAddGroup.hide();
      }
      if (addGroupSuccessToastBootstrap) {
        addGroupSuccessToastBootstrap.show();
      }
      scrollToBottom();
      resetFormInputs();
      groupoffcanvasSpinner.style.display = "none";
      /* this.submit(); */
    }
  });

  // Remove is-invalid class when focusing on inputs
  searchInput.addEventListener("focus", function () {
    this.classList.remove("is-invalid");
  });

  // Remove is-invalid class when focusing on radio buttons
  groupRadios.forEach((radio) => {
    radio.addEventListener("focus", function () {
      groupRadios.forEach((radio) => {
        radio.classList.remove("is-invalid");
      });
      groupRadioFeedback.style.display = "none";
    });
  });
});
