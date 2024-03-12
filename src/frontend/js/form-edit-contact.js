document.addEventListener("DOMContentLoaded", function () {
  const contacteditoffcanvasSpinner = document.getElementById("contacteditoffcanvasSpinner");
  const contactForm = document.getElementById("editContactForm");
  const contactRadios = document.getElementsByName("editContactRadio");
  const contactRadioFeedback = document.getElementById(
    "config-paragraph-contactRadioFeedbackContactsEditForm"
  );

  // Success toast variables
  const editContactSuccessToast = document.getElementById(
    "editContactSuccessToast"
  );
  const successToastBootstrap = bootstrap.Toast.getOrCreateInstance(
    editContactSuccessToast
  );
  const scrollToBottom = () => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  };

  // Offcanvas
  const offcanvasElement = document.getElementById("offcanvasEditContact");
  const offcanvasInstance = new bootstrap.Offcanvas(offcanvasElement);

  contactForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    let isValid = true;

    // Radio inputs validation
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
      for (const radio of contactRadios) {
        radio.classList.remove("is-invalid");
      }
      contactRadioFeedback.style.display = "none";
    }

    // Submit the form if all fields are valid
    if (isValid) {
      contacteditoffcanvasSpinner.style.display = "block";
      // Update the existing row
      const exceptionId = document.getElementById('edit-contact-exception-id').innerText
      const contactPhone = document.getElementById('edit-contact-phone').innerText
      let modeId
      const alias = document.getElementById('edit-contact-name').innerText
      if (document.getElementById("editContactRadioRespond").checked) {
        modeId=1
      } else if (document.getElementById("editContactRadioPrivate").checked) {
        modeId=2
      } else if (document.getElementById("editContactRadioOff").checked) {
        modeId=4
      }
      await updateContactException(exceptionId, 
                                   phoneInformation.generalConfiguration.user_phone,
                                   contactPhone, 
                                   alias, 
                                   modeId);
      document.getElementById('span-contact-mode-'+exceptionId).innerText = getModeDescription(modeId)
      
      successToastBootstrap.show();
      offcanvasInstance.hide();
      scrollToBottom();
      resetFormInputs();
      contacteditoffcanvasSpinner.style.display = "none";
      /* this.submit(); */
    }
  });

  // Remove is-invalid class when focusing on radio inputs
  contactRadios.forEach((radio) => {
    radio.addEventListener("focus", function () {
      contactRadios.forEach((radio) => {
        radio.classList.remove("is-invalid");
      });
      contactRadioFeedback.style.display = "none";
    });
  });
});
