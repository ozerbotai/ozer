document.addEventListener("DOMContentLoaded", function () {
  const groupeditoffcanvasSpinner = document.getElementById("groupeditoffcanvasSpinner");
  const groupForm = document.getElementById("editGroupForm");
  const groupRadios = document.getElementsByName("editGroupRadio");
  const groupRadioFeedback = document.getElementById(
    "config-paragraph-groupRadioFeedbackGroupsEditForm"
  );

  // Success toast variables
  const editGroupSuccessToast = document.getElementById(
    "editGroupSuccessToast"
  );
  const successToastBootstrap = bootstrap.Toast.getOrCreateInstance(
    editGroupSuccessToast
  );
  const scrollToBottom = () => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  };

  // Offcanvas
  const offcanvasElement = document.getElementById("offcanvasEditGroup");
  const offcanvasInstance = new bootstrap.Offcanvas(offcanvasElement);

  groupForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    let isValid = true;

    // Radio inputs validation
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
      for (const radio of groupRadios) {
        radio.classList.remove("is-invalid");
      }
      groupRadioFeedback.style.display = "none";
    }

    // Submit the form if all fields are valid
    if (isValid) {
      groupeditoffcanvasSpinner.style.display = "block";
      // Update the existing row
      const exceptionId = document.getElementById('edit-group-exception-id').innerText
      const groupId = document.getElementById('edit-group-id').innerText
      let modeId
      const alias = document.getElementById('edit-group-name').innerText
      if (document.getElementById("editGroupRadioRespond").checked) {
        modeId=1
      } else if (document.getElementById("editGroupRadioPrivate").checked) {
        modeId=2
      } else if (document.getElementById("editGroupRadioOff").checked) {
        modeId=4
      }
      await updateGroupException(exceptionId, 
                                   phoneInformation.generalConfiguration.user_phone,
                                   groupId, 
                                   alias, 
                                   modeId);
      document.getElementById('span-group-mode-'+exceptionId).innerText = getModeDescription(modeId)

      successToastBootstrap.show();
      offcanvasInstance.hide();
      scrollToBottom();
      resetFormInputs();
      groupeditoffcanvasSpinner.style.display = "none";
      /* this.submit(); */
    }
  });

  // Remove is-invalid class when focusing on radio inputs
  groupRadios.forEach((radio) => {
    radio.addEventListener("focus", function () {
      groupRadios.forEach((radio) => {
        radio.classList.remove("is-invalid");
      });
      groupRadioFeedback.style.display = "none";
    });
  });
});
