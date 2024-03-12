document.addEventListener("DOMContentLoaded", function () {

    updateTexts();

    const menuOptionGeneral = document.getElementById("menu-option-general"); 
    const menuOptionContacts = document.getElementById("menu-option-contacts"); 
    const menuOptionGroups = document.getElementById("menu-option-groups");
    const menuOptionSummarization = document.getElementById("menu-option-summarization");

    menuOptionGeneral.addEventListener("click", function (event) {
        event.preventDefault();
        menuSelectOption('general')
        }
    )

    menuOptionContacts.addEventListener("click", function (event) {
        event.preventDefault();
        menuSelectOption('contacts')
        }
    )

    menuOptionGroups.addEventListener("click", function (event) {
        event.preventDefault();
        menuSelectOption('groups')
        }
    )

    menuOptionSummarization.addEventListener("click", function (event) {
        event.preventDefault();
        menuSelectOption('summarization')
        }
    )

    //Syncronize both "summarize messages" checkboxes.
    const flexRadioSummarizeMessages = document.getElementById('flexRadioSummarizeMessages');
    const flexRadioSummarizeMessages2 = document.getElementById('flexRadioSummarizeMessages2');

    function syncSummarizeRadios(event) {
        flexRadioSummarizeMessages.checked = event.target.checked;
        flexRadioSummarizeMessages2.checked = event.target.checked;
        toggleSummarizeOptions(event.target.checked);
    }

    // Initialize the state based on the initial checked state of flexRadioSummarizeMessages2
    //toggleSummarizeOptions(flexRadioSummarizeMessages2.checked);
    flexRadioSummarizeMessages.addEventListener('change', syncSummarizeRadios);
    flexRadioSummarizeMessages2.addEventListener('change', syncSummarizeRadios);
})

function toggleSummarizeOptions(isEnabled) {
    if (!isEnabled) {
        document.getElementById('config-label-summarize-minimum-seconds').style.display = 'none';
        document.getElementById('config-label-summarize-minimum-words').style.display = 'none';
        document.getElementById('select-summarize-minimum-seconds').style.display = 'none';
        document.getElementById('select-summarize-minimum-words').style.display = 'none';
        document.getElementById('config-paragraph-use-bullets').style.display = 'none';
        document.getElementById('flexRadioSummaryTypePlainText').style.display = 'none';
        document.getElementById('config-label-summarization-type-plain-text').style.display = 'none';
        document.getElementById('flexRadioSummaryTypeBullets').style.display = 'none';
        document.getElementById('config-label-summarization-type-Bullets').style.display = 'none';
        document.getElementById('config-paragraph-full-text').style.display = 'none';
        document.getElementById('flexRadioFullText').style.display = 'none';
        document.getElementById('config-label-full-text').style.display = 'none';
    } else {
        document.getElementById('config-label-summarize-minimum-seconds').style.display = 'block';
        document.getElementById('config-label-summarize-minimum-words').style.display = 'block';
        document.getElementById('select-summarize-minimum-seconds').style.display = 'block';
        document.getElementById('select-summarize-minimum-words').style.display = 'block';
        document.getElementById('config-paragraph-use-bullets').style.display = 'block';
        document.getElementById('flexRadioSummaryTypePlainText').style.display = 'block';
        document.getElementById('config-label-summarization-type-plain-text').style.display = 'block';
        document.getElementById('flexRadioSummaryTypeBullets').style.display = 'block';
        document.getElementById('config-label-summarization-type-Bullets').style.display = 'block';
        document.getElementById('config-paragraph-full-text').style.display = 'block';
        document.getElementById('flexRadioFullText').style.display = 'block';
        document.getElementById('config-label-full-text').style.display = 'block';
    }
}

function menuSelectOption(option) {
    const sectionGeneralSettings = document.getElementById("section-general-settings"); 
    const sectionContactSettings = document.getElementById("section-contact-settings"); 
    const sectionGroupSettings = document.getElementById("section-group-settings"); 
    const sectionSummarizationSettings = document.getElementById("section-summarization-settings"); 
    const linkOptionGeneral = document.getElementById("link-option-general"); 
    const linkOptionContacts = document.getElementById("link-option-contacts"); 
    const linkOptionGroups = document.getElementById("link-option-groups"); 
    const linkOptionSummarization = document.getElementById("link-option-summarization"); 
    switch (option) {
        case 'contacts':
            sectionGeneralSettings.style.display = "none";
            sectionContactSettings.style.display = "block";
            sectionGroupSettings.style.display = "none";
            sectionSummarizationSettings.style.display = "none";
            linkOptionGeneral.classList.remove("active");
            linkOptionContacts.classList.add("active");
            linkOptionGroups.classList.remove("active");
            linkOptionSummarization.classList.remove("active");
            break;
        case 'groups':
            sectionGeneralSettings.style.display = "none";
            sectionContactSettings.style.display = "none";
            sectionGroupSettings.style.display = "block";
            sectionSummarizationSettings.style.display = "none";
            linkOptionGeneral.classList.remove("active");
            linkOptionContacts.classList.remove("active");
            linkOptionGroups.classList.add("active");
            linkOptionSummarization.classList.remove("active");
            break;
        case 'summarization':
            sectionGeneralSettings.style.display = "none";
            sectionContactSettings.style.display = "none";
            sectionGroupSettings.style.display = "none";
            sectionSummarizationSettings.style.display = "block";
            linkOptionGeneral.classList.remove("active");
            linkOptionContacts.classList.remove("active");
            linkOptionGroups.classList.remove("active");
            linkOptionSummarization.classList.add("active");
            break;
        default: //If option parameter is "general" or anything else, change tab to general options
            sectionGeneralSettings.style.display = "block";
            sectionContactSettings.style.display = "none";
            sectionGroupSettings.style.display = "none";
            sectionSummarizationSettings.style.display = "none";
            linkOptionGeneral.classList.add("active");
            linkOptionContacts.classList.remove("active");
            linkOptionGroups.classList.remove("active");
            linkOptionSummarization.classList.remove("active");
            break;
    }
}

function updateTexts() {
    const prefixConfig = "config-";
    applyTranslationsByPrefix(prefixConfig)

    const prefixHeader = "header-";
    applyTranslationsByPrefix(prefixHeader)

    updateTooltipTitles();
    updateTooltips();
}

let selectedContactPhone
let selectedGroupId

let ContactsGroups;
let phoneInformation;


document.addEventListener('DOMContentLoaded', async function () {
    let userPhone
    const email = document.getElementById('email').value;

    const userConfig = await getConfigurationByEmail(email)
    userPhone = userConfig.user_phone
    
    retrievePhoneInformation(userPhone);

    async function retrievePhoneInformation(phone) {
        phoneInformation = await getPhoneInformation(phone);        
        console.log('phoneInformation', phoneInformation)
        showPhoneInformation(phoneInformation)
        toggleSummarizeOptions(flexRadioSummarizeMessages2.checked);
        const email = phoneInformation.generalConfiguration.email
        ContactsGroups = await getPhoneContacts(email);
        console.log('ContactsGroups',ContactsGroups)
        await insertUserEventLog(email, EVENT_USER_ENTERED_CONFIG, null);
        //If receive target as a parameter, change menu to that target (general, contacts, groups)
        const target = document.getElementById('target').value
        menuSelectOption(target)        
        //Hide spinner
        const sectionLoading = document.getElementById('section-loading')
        const sectionInfoMain = document.getElementById('section-info-main')
        sectionLoading.style.display = "none"
        sectionInfoMain.style.display = "block"
    }

    async function showPhoneInformation(phoneInformation) {
        console.log(phoneInformation);

        document.getElementById('text-user-name').innerText = phoneInformation.generalConfiguration.alias
        document.getElementById('text-phone-number').innerText = '+' + phoneInformation.generalConfiguration.user_phone
        document.getElementById('text-phone-number').innerText = '+' + phoneInformation.generalConfiguration.user_phone
        //Show alert when transcriptions are paused
        if (phoneInformation.generalConfiguration.transcriptions_paused) {
            activateTrancripAlert.classList.remove("d-none");
        }
        showHeaderMode(phoneInformation.generalConfiguration.general_mode_details.id, phoneInformation.generalConfiguration.general_mode_groups_details.id)
        switch (phoneInformation.generalConfiguration.general_mode_details.id) {
            case 1:
                const flexRadioContactModeRespond = document.getElementById('flexRadioContactModeRespond');
                flexRadioContactModeRespond.checked=true
                break;
            case 2:
                const flexRadioContactModePrivate = document.getElementById('flexRadioContactModePrivate');
                flexRadioContactModePrivate.checked=true
                break;
            case 4:
                const flexRadioContactModeOff = document.getElementById('flexRadioContactModeOff');
                flexRadioContactModeOff.checked=true
                break;
        }
        switch (phoneInformation.generalConfiguration.general_mode_groups_details.id) {
            case 1:
                const flexRadioGroupModeRespond = document.getElementById('flexRadioGroupModeRespond');
                flexRadioGroupModeRespond.checked=true
                break;
            case 2:
                const flexRadioGroupModePrivate = document.getElementById('flexRadioGroupModePrivate');
                flexRadioGroupModePrivate.checked=true
                break;
            case 4:
                const flexRadioGroupModeOff = document.getElementById('flexRadioGroupModeOff');
                flexRadioGroupModeOff.checked=true
                break;
        }
        const flexRadioOutgoingMessages = document.getElementById('flexRadioOutgoingMessages');
        flexRadioOutgoingMessages.checked=phoneInformation.generalConfiguration.transcribe_outgoing_messages
        const flexRadioSummarizeMessages = document.getElementById('flexRadioSummarizeMessages');
        flexRadioSummarizeMessages.checked=phoneInformation.generalConfiguration.summarize_messages
        const flexRadioSummarizeMessages2 = document.getElementById('flexRadioSummarizeMessages2');
        flexRadioSummarizeMessages2.checked=phoneInformation.generalConfiguration.summarize_messages;
        const selectSummarizeMinimumSeconds = document.getElementById('select-summarize-minimum-seconds');
        selectSummarizeMinimumSeconds.value=phoneInformation.generalConfiguration.summary_minimum_seconds;
        const selectSummarizeMinimumWords = document.getElementById('select-summarize-minimum-words');
        selectSummarizeMinimumWords.value=phoneInformation.generalConfiguration.summary_minimum_words;

        if (phoneInformation.generalConfiguration.summary_use_bullets) {
            document.getElementById('flexRadioSummaryTypeBullets').checked = true
        } else {
            document.getElementById('flexRadioSummaryTypePlainText').checked = true
        }
        const flexRadioFullText = document.getElementById('flexRadioFullText');
        flexRadioFullText.checked=phoneInformation.generalConfiguration.summary_include_full_text;
        // document.getElementById('contactMode').value = phoneInformation.generalConfiguration.general_mode_details.id;
        // document.getElementById('groupMode').value = phoneInformation.generalConfiguration.general_mode_groups_details.id;
        // document.getElementById('transcribeOutgoingMessages').checked = phoneInformation.generalConfiguration.transcribe_outgoing_messages;
        
        // contactList.innerHTML = '';
        // groupList.innerHTML = '';

        showPhoneInformationContactExceptions(phoneInformation);
        showPhoneInformationGroupExceptions(phoneInformation);
    }

    async function showPhoneInformationContactExceptions(phoneInformation) {        
        const sectionContactMainNoRows = document.getElementById('section-contact-main-no-rows')
        const sectionContactMainWithRows = document.getElementById('section-contact-main-with-rows')
        const buttonAddContactException = document.getElementById('config-button-addContactExceptionHeader')
        if (phoneInformation.sendingExceptions.length === 0) {
            sectionContactMainNoRows.style.display = "flex"
            sectionContactMainWithRows.style.display = "none"
            buttonAddContactException.style.display = "none"
        } else {
            sectionContactMainNoRows.style.display = "none"
            sectionContactMainWithRows.style.display = "block"
            buttonAddContactException.style.display = "block"
            const tbodyContacts = document.getElementById('tbody-contacts')
            tbodyContacts.innerHTML = '';

            let alias 
            for (const exception of phoneInformation.sendingExceptions) {
                if (!exception.contact_alias) {
                    alias = ""
                } else {
                    alias = exception.contact_alias
                }
                addContactExceptionRow(exception.id, exception.contact_phone, alias, exception.modes.id)
            }
            updateTooltips();
        }
    }

    async function showPhoneInformationGroupExceptions(phoneInformation) {        
        const sectionGroupMainNoRows = document.getElementById('section-group-main-no-rows')
        const sectionGroupMainWithRows = document.getElementById('section-group-main-with-rows')
        const buttonAddGroupException = document.getElementById('config-button-addGroupExceptionHeader')
        if (phoneInformation.sendingExceptionsGroups.length === 0) {
            sectionGroupMainNoRows.style.display = "flex"
            sectionGroupMainWithRows.style.display = "none"
            buttonAddGroupException.style.display = "none"
        } else {
            sectionGroupMainNoRows.style.display = "none"
            sectionGroupMainWithRows.style.display = "block"
            buttonAddGroupException.style.display = "block"
            const tbodyGroups = document.getElementById('tbody-groups')
            tbodyGroups.innerHTML = '';

            let mode
            let alias 
            for (const exception of phoneInformation.sendingExceptionsGroups) {
                if (!exception.group_alias) {
                    alias = ""
                } else {
                    alias = exception.group_alias
                }
                addGroupExceptionRow(exception.id, exception.group_id, alias, exception.modes.id)
            }
            updateTooltips();
        }
    }
    
    // Add the event listeners for all the "Add exception" buttons
    const buttonsAddexception = document.querySelectorAll('.btn-add-exception');
    buttonsAddexception.forEach(element => {
        element.addEventListener('click', function() {
            //Reset form contacts
            const contactSearchInput = document.getElementById("contactSearchInput");
            const contactRadios = document.getElementsByName("addContactRadio");
            const contactRadioFeedback = document.getElementById("config-paragraph-contactRadioFeedbackContactsAddForm");
            const contactSearchInputFeedback = document.getElementById("contactSearchInputFeedback");
            const contactForm = document.getElementById("addContactForm");
            contactForm.reset();
            contactSearchInput.classList.remove("is-invalid");
            for (const radio of contactRadios) {
            radio.classList.remove("is-invalid");
            }
            contactRadioFeedback.style.display = "none";
            contactSearchInputFeedback.removeAttribute('data-error-type');
            contactSearchInputFeedback.style.display = "none";
            //Reset form contacts
            const groupSearchInput = document.getElementById("groupSearchInput");
            const groupRadios = document.getElementsByName("addGroupRadio");
            const groupRadioFeedback = document.getElementById("config-paragraph-groupRadioFeedbackGroupsAddForm");
            const groupSearchInputFeedback = document.getElementById("groupSearchInputFeedback");
            const groupForm = document.getElementById("addGroupForm");
            groupForm.reset();
            groupSearchInput.classList.remove("is-invalid");
            for (const radio of groupRadios) {
            radio.classList.remove("is-invalid");
            }
            groupRadioFeedback.style.display = "none";
            groupSearchInputFeedback.removeAttribute('data-error-type');
            groupSearchInputFeedback.style.display = "none";
        });
    });

    // Add the event listener for the contact "Edit" buttons
    document.getElementById('tbody-contacts').addEventListener('click', async function (event) {
        if (event.target.closest('button[data-bs-target="#offcanvasEditContact"]')) {
            document.getElementById('edit-contact-phone').innerText = ''
            document.getElementById('edit-contact-name').innerText = ''
            document.getElementById('editContactRadioRespond').checked=false;
            document.getElementById('editContactRadioPrivate').checked=false;
            document.getElementById('editContactRadioOff').checked=false;

            const button = event.target.closest('button');
            const row = button.closest('tr');
            const selectedContactExceptionId = row.querySelector('td:nth-child(1)').textContent;
            const selectedContactExceptionPhone = row.querySelector('td:nth-child(2)').textContent;
            const contactException = await getContactException(phoneInformation.generalConfiguration.user_phone, selectedContactExceptionPhone)
            document.getElementById('edit-contact-exception-id').innerText = selectedContactExceptionId
            document.getElementById('edit-contact-phone').innerText = selectedContactExceptionPhone
            document.getElementById('edit-contact-name').innerText = contactException.contact_alias
            switch (contactException.mode_for_contact) {
                case 'RESPOND': document.getElementById('editContactRadioRespond').checked=true; break;
                case 'PRIVATE': document.getElementById('editContactRadioPrivate').checked=true; break;
                case 'OFF': document.getElementById('editContactRadioOff').checked=true; break;
            }
        }
    });

    // Add the event listener for the group "Edit" buttons
    document.getElementById('tbody-groups').addEventListener('click', async function (event) {
        if (event.target.closest('button[data-bs-target="#offcanvasEditGroup"]')) {
            document.getElementById('edit-group-id').innerText = ''
            document.getElementById('edit-group-name').innerText = ''
            document.getElementById('editGroupRadioRespond').checked=false;
            document.getElementById('editGroupRadioPrivate').checked=false;
            document.getElementById('editGroupRadioOff').checked=false;

            const button = event.target.closest('button');
            const row = button.closest('tr');
            const selectedGroupExceptionId = row.querySelector('td:nth-child(1)').textContent;
            const selectedGroupId = row.querySelector('td:nth-child(2)').textContent;
            const groupException = await getGroupException(phoneInformation.generalConfiguration.user_phone, selectedGroupId)
            document.getElementById('edit-group-exception-id').innerText = selectedGroupExceptionId
            document.getElementById('edit-group-id').innerText = selectedGroupId
            document.getElementById('edit-group-name').innerText = groupException.group_alias
            switch (groupException.mode_for_group) {
                case 'RESPOND': document.getElementById('editGroupRadioRespond').checked=true; break;
                case 'PRIVATE': document.getElementById('editGroupRadioPrivate').checked=true; break;
                case 'OFF': document.getElementById('editGroupRadioOff').checked=true; break;
            }
        }
    });

    // Add the event listener for the contact "Delete" buttons
    document.getElementById('tbody-contacts').addEventListener('click', async function (event) {
        if (event.target.closest('button[data-bs-target="#deleteContactModal"]')) {
            document.getElementById('delete-contact-exception-id').innerText = ''
            document.getElementById('delete-contact-exception-message').innerText = ''
            
            const button = event.target.closest('button');
            const row = button.closest('tr');
            const selectedContactExceptionId = row.querySelector('td:nth-child(1)').textContent;
            const selectedContactExceptionPhone = row.querySelector('td:nth-child(2)').textContent;
            const contactException = await getContactException(phoneInformation.generalConfiguration.user_phone, selectedContactExceptionPhone)
            document.getElementById('delete-contact-exception-id').innerText = selectedContactExceptionId
            document.getElementById('delete-contact-exception-message').innerText = `¿${i18next.t('config-paragraph-deleteContactExceptionMessage')} ${contactException.contact_alias}?`
        }
    });

    // Add the event listener for the group "Delete" buttons
    document.getElementById('tbody-groups').addEventListener('click', async function (event) {
        if (event.target.closest('button[data-bs-target="#deleteGroupModal"]')) {
            document.getElementById('delete-group-exception-id').innerText = ''
            document.getElementById('delete-group-exception-message').innerText = ''
            
            const button = event.target.closest('button');
            const row = button.closest('tr');
            const selectedGroupExceptionId = row.querySelector('td:nth-child(1)').textContent;
            const selectedGroupExceptionPhone = row.querySelector('td:nth-child(2)').textContent;
            const groupException = await getGroupException(phoneInformation.generalConfiguration.user_phone, selectedGroupExceptionPhone)
            document.getElementById('delete-group-exception-id').innerText = selectedGroupExceptionId
            document.getElementById('delete-group-exception-message').innerText = `¿${i18next.t('config-paragraph-deleteGroupExceptionMessage')} ${groupException.group_alias}?`
        }
    });

    document.getElementById('contactSearchInput').setAttribute('placeholder', i18next.t('config-placeholder-contactName'));
    document.getElementById('groupSearchInput').setAttribute('placeholder', i18next.t('config-placeholder-groupName'));
});

async function addContactExceptionRow(exceptionId, contactPhone, alias, modeId) {
    const sectionContactMainNoRows = document.getElementById('section-contact-main-no-rows')
    const sectionContactMainWithRows = document.getElementById('section-contact-main-with-rows')
    const buttonAddContactException = document.getElementById('config-button-addContactExceptionHeader')
    
    if (sectionContactMainNoRows.style.display == "flex") {
        sectionContactMainNoRows.style.display = "none"
        sectionContactMainWithRows.style.display = "flex"
        buttonAddContactException.style.display = "flex"
    }
    
    const tbodyContacts = document.getElementById('tbody-contacts')
    const tr = document.createElement('tr');
    tr.id = "row-contact-exception-"+exceptionId

    tr.innerHTML = `
                    <tr>
                        <td style="display: none;">${exceptionId}</td>
                        <td style="display: none;">${contactPhone}</td>
                        <td>
                            <span class="table-alias">${alias}</span>
                        </td>
                        <td style="display: none;">${modeId}</td>
                        <td>
                            <span id="span-contact-mode-${exceptionId}">${getModeDescription(modeId)}</span>
                        </td>
                        <td>
                            <div class="data-actions">
                                <button
                                type="button"
                                class="btn btn-icon"
                                data-bs-toggle="offcanvas"
                                data-bs-target="#offcanvasEditContact"
                                aria-controls="offcanvasEditContact"
                                >
                                <span
                                    class="material-symbols-outlined text-primary"
                                    data-bs-toggle="tooltip"
                                    data-bs-placement="bottom"
                                    data-bs-title="${i18next.t('config-button-editContactTitle')}"
                                    data-i18n-key="config-button-editContactTitle"
                                    data-bs-custom-class="custom-tooltip"
                                    >edit</span
                                >
                                </button>
                                <button
                                type="button"
                                class="btn btn-icon"
                                data-bs-toggle="modal"
                                data-bs-target="#deleteContactModal"
                                >
                                <span
                                    class="material-symbols-outlined text-danger"
                                    data-bs-toggle="tooltip"
                                    data-bs-placement="right"
                                    data-bs-title="${i18next.t('config-button-deleteContactTitle')}"
                                    data-i18n-key="config-button-deleteContactTitle"
                                    data-bs-custom-class="custom-tooltip"
                                    >delete</span
                                >
                                </button>
                            </div>
                        </td>
                    </tr>
                    `;                
    tbodyContacts.appendChild(tr);
}

async function addGroupExceptionRow(exceptionId, groupId, alias, modeId) {
    const sectionGroupMainNoRows = document.getElementById('section-group-main-no-rows')
    const sectionGroupMainWithRows = document.getElementById('section-group-main-with-rows')
    const buttonAddGroupException = document.getElementById('config-button-addGroupExceptionHeader')
    
    if (sectionGroupMainNoRows.style.display === "flex") {
        sectionGroupMainNoRows.style.display = "none"
        sectionGroupMainWithRows.style.display = "flex"
        buttonAddGroupException.style.display = "flex"
    }
    
    const tbodyGroups = document.getElementById('tbody-groups')
    const tr = document.createElement('tr');
    tr.id = "row-group-exception-"+exceptionId

    tr.innerHTML = `
                    <tr>
                        <td style="display: none;">${exceptionId}</td>
                        <td style="display: none;">${groupId}</td>
                        <td>
                            <span class="table-alias">${alias}</span>
                        </td>
                        <td style="display: none;">${modeId}</td>
                        <td>
                            <span id="span-group-mode-${exceptionId}">${getModeDescription(modeId)}</span>
                        </td>
                        <td>
                            <div class="data-actions">
                            <button
                                type="button"
                                class="btn btn-icon"
                                data-bs-toggle="offcanvas"
                                data-bs-target="#offcanvasEditGroup"
                                aria-controls="offcanvasEditGroup"
                            >
                                <span
                                class="material-symbols-outlined text-primary"
                                data-bs-toggle="tooltip"
                                data-bs-placement="bottom"
                                data-bs-title="${i18next.t('config-button-editGroupTitle')}"
                                data-i18n-key="config-button-editGroupTitle"
                                data-bs-custom-class="custom-tooltip"
                                >edit</span
                                >
                            </button>
                            <button
                                type="button"
                                class="btn btn-icon"
                                data-bs-toggle="modal"
                                data-bs-target="#deleteGroupModal"
                            >
                                <span
                                class="material-symbols-outlined text-danger"
                                data-bs-toggle="tooltip"
                                data-bs-placement="right"
                                data-bs-title="${i18next.t('config-button-deleteGroupTitle')}"
                                data-i18n-key="config-button-deleteGroupTitle"
                                data-bs-custom-class="custom-tooltip"
                                >delete</span
                                >
                            </button>
                            </div>
                        </td>
                    </tr>
                    `;
    tbodyGroups.appendChild(tr);
}

function showHeaderMode(contactModeId, groupModeId) {
    document.getElementById('text-header-contacts').innerHTML = `
                                                                    <strong>${i18next.t('config-strong-contactTranscriptionMode')}</strong>
                                                                    ${getModeDescription(contactModeId)}
                                                                `
    document.getElementById('text-header-groups').innerHTML = `
                                                                    <strong>${i18next.t('config-strong-groupTranscriptionMode')}</strong>
                                                                    ${getModeDescription(groupModeId)}
                                                                `
}