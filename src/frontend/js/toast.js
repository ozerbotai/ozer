// Toast configuration
const configToastTrigger = document.getElementById("config-button-saveChanges");
const configButtonSummarizationTrigger = document.getElementById("config-button-summarization-saveChanges");
const successConfigToast = document.getElementById("successConfigToast");
const successConfigToastSummary = document.getElementById("successConfigToastSummary");
const dangerConfigToast = document.getElementById("dangerConfigToast");

// Toast success activate transcriptions
const activateTrancripToastTrigger = document.getElementById("activateTrancripToastBtn");
const activateTrancripToast = document.getElementById("activateTrancripToast");
const activateTrancripAlert = document.getElementById("activateTrancripAlert");
const checkbox = document.getElementById("flexCheckboxDefault1");

const configGeneralSettingsSpinner = document.getElementById("configGeneralSettingsSpinner");
const configSummarizationSettingsSpinner = document.getElementById("configSummarizationSettingsSpinner");


const scrollToBottom = () => {
  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: "smooth",
  });
};
if (configToastTrigger) {
  if (successConfigToast) {
    const successToastBootstrap =
      bootstrap.Toast.getOrCreateInstance(successConfigToast);
    configToastTrigger.addEventListener("click", async () => {
      configGeneralSettingsSpinner.style.display = "block";

      let contactModeId
      let groupModeId
      let trancribeOutgoingMessages
      let summarizeMessages
      if (document.getElementById("flexRadioContactModeRespond").checked) {contactModeId=1} 
      else if (document.getElementById("flexRadioContactModePrivate").checked) {contactModeId=2} 
      else if (document.getElementById("flexRadioContactModeOff").checked) {contactModeId=4}

      if (document.getElementById("flexRadioGroupModeRespond").checked) {groupModeId=1} 
      else if (document.getElementById("flexRadioGroupModePrivate").checked) {groupModeId=2} 
      else if (document.getElementById("flexRadioGroupModeOff").checked) {groupModeId=4}

      trancribeOutgoingMessages = document.getElementById("flexRadioOutgoingMessages").checked
      summarizeMessages = document.getElementById("flexRadioSummarizeMessages").checked

      await updateUserGeneralConfiguration(phoneInformation.generalConfiguration.user_phone, contactModeId, groupModeId, trancribeOutgoingMessages, summarizeMessages)
      configGeneralSettingsSpinner.style.display = "none";
      phoneInformation.generalConfiguration.general_mode_details.id = contactModeId
      phoneInformation.generalConfiguration.general_mode_groups_details.id = groupModeId
      showHeaderMode(contactModeId, groupModeId)

      successToastBootstrap.show();
      scrollToBottom();
    });
  }
  if (dangerConfigToast) {
    const dangerToastBootstrap =
      bootstrap.Toast.getOrCreateInstance(dangerConfigToast);
    configToastTrigger.addEventListener("click", () => {
      dangerToastBootstrap.show();
      scrollToBottom();
    });
  }
}
//Save summarization settings
if (configButtonSummarizationTrigger) {
  if (successConfigToastSummary) {
    const successToastBootstrapSummary =
      bootstrap.Toast.getOrCreateInstance(successConfigToastSummary);
    configButtonSummarizationTrigger.addEventListener("click", async () => {
      configSummarizationSettingsSpinner.style.display = "block";

      let summarizeMessages
      let summarizeMinSeconds
      let summarizeMinWords
      let summarizeUsebullets
      let summarizeIncludeFulltext
      
      summarizeMessages = document.getElementById("flexRadioSummarizeMessages2").checked
      summarizeMinSeconds = document.getElementById("select-summarize-minimum-seconds").value
      summarizeMinWords = document.getElementById("select-summarize-minimum-words").value
      if (document.getElementById('flexRadioSummaryTypeBullets').checked === true) {
        summarizeUsebullets = true;
      } else {
        summarizeUsebullets = false;
      }
      summarizeIncludeFulltext = document.getElementById("flexRadioFullText").checked

      
      await updateUserSummaryConfiguration(phoneInformation.generalConfiguration.user_phone, summarizeMessages, summarizeMinSeconds, summarizeMinWords, summarizeUsebullets, summarizeIncludeFulltext)
      configSummarizationSettingsSpinner.style.display = "none";
      
      successToastBootstrapSummary.show();
    });
  }
  if (dangerConfigToast) {
    const dangerToastBootstrap2 =
      bootstrap.Toast.getOrCreateInstance(dangerConfigToast);
    configToastTrigger2.addEventListener("click", () => {
      dangerToastBootstrap.show();
    });
  }
}
if (activateTrancripToastTrigger) {
  if (activateTrancripToast) {
    const activateTrancripToastBootstrap = bootstrap.Toast.getOrCreateInstance(
      activateTrancripToast
    );
    activateTrancripToastTrigger.addEventListener("click", async () => {
      const inputEmail = document.getElementById('email').value;
      await updatePauseTranscriptions(inputEmail, false)
      activateTrancripToastBootstrap.show();
      activateTrancripAlert.classList.add("d-none");
      scrollToBottom();
    });
  }
}

// Toast success contact deleted
const deleteContactTrigger = document.getElementById("config-button-confirmDeleteContact");
const deleteContactToast = document.getElementById("deleteContactToast");

if (deleteContactTrigger) {
  if (deleteContactToast) {
    const deleteContactToastBootstrap =
      bootstrap.Toast.getOrCreateInstance(deleteContactToast);
    deleteContactTrigger.addEventListener("click", async () => {
      const contactExceptionId = document.getElementById('delete-contact-exception-id').innerText
      if (contactExceptionId) {
        const row = document.getElementById('row-contact-exception-'+contactExceptionId)
        row.remove();
        const tbodyContacts = document.getElementById('tbody-contacts')
        const rowCount = tbodyContacts.getElementsByTagName('tr').length;
        if (rowCount===0) {
          // If there are no more row, go back to "no rows" mode
          document.getElementById('section-contact-main-no-rows').style.display = "flex"
          document.getElementById('section-contact-main-with-rows').style.display = "none"
          document.getElementById('config-button-addContactExceptionHeader').style.display = "none"
        }
        deleteContactToastBootstrap.show();
        scrollToBottom();
        await deleteContactException(contactExceptionId, phoneInformation.generalConfiguration.user_phone);
      }
    });
  }
}
// Toast success group deleted
const deleteGroupTrigger = document.getElementById("config-button-confirmDeleteGroup");
const deleteGroupToast = document.getElementById("deleteGroupToast");

if (deleteGroupTrigger) {
  if (deleteGroupToast) {
    const deleteGroupToastBootstrap =
      bootstrap.Toast.getOrCreateInstance(deleteGroupToast);
    deleteGroupTrigger.addEventListener("click", async () => {
      const groupExceptionId = document.getElementById('delete-group-exception-id').innerText
      if (groupExceptionId) {
        const row = document.getElementById('row-group-exception-'+groupExceptionId)
        row.remove();
        const tbodyGroups = document.getElementById('tbody-groups')
        const rowCount = tbodyGroups.getElementsByTagName('tr').length;
        if (rowCount===0) {
          // If there are no more row, go back to "no rows" mode
          document.getElementById('section-group-main-no-rows').style.display = "flex"
          document.getElementById('section-group-main-with-rows').style.display = "none"
          document.getElementById('config-button-addGroupExceptionHeader').style.display = "none"
        }
        deleteGroupToastBootstrap.show();
        scrollToBottom();
        await deleteGroupException(groupExceptionId, phoneInformation.generalConfiguration.user_phone);
      }
    });
  }
}
