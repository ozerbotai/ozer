const languages = {
    'es': 'Español',
    'en': 'English'
};

const getBrowserLanguage = () => {
    const browserLang = navigator.language.split('-')[0] || 'en';
    return browserLang;
};

function getSelectedLanguage() {
    return getCookie('language') || (languages[getBrowserLanguage()] ? getBrowserLanguage() : 'en');
}

function applyTranslationsByPrefix(prefix){
    const selectedLang = getSelectedLanguage();

    i18next.changeLanguage(selectedLang, function(err, t) {
        if (err) return console.error('Error when changing language:', err);

        const translations = i18next.services.resourceStore.data[selectedLang].translation;

        Object.keys(translations).forEach(key => {
            if (key.startsWith(prefix)) {
                const element = document.getElementById(key);
                
                if (element) {
                    element.innerHTML = i18next.t(key);
                    //console.log(`document.getElementById('${key}').textContent = i18next.t('${key}');`);
                }
            }
        });
    });
}

function applyTranslations(){
    const selectedLang = getSelectedLanguage();

    i18next.changeLanguage(selectedLang, function(err, t) {
        if (err) return console.error('Error when changing language:', err);

        const translations = i18next.services.resourceStore.data[selectedLang].translation;

        Object.keys(translations).forEach(key => {
            const element = document.getElementById(key);
            
            if (element) {
                element.innerHTML = i18next.t(key);
            }
        });
    });

    if (typeof showHeaderMode === "function") {
        showHeaderMode(phoneInformation.generalConfiguration.general_mode_details.id, phoneInformation.generalConfiguration.general_mode_groups_details.id);
    }
    
    updateModeDescriptionForContacts();
    updateModeDescriptionForGroups();
    updateErrorMessages();

    updateTooltipTitles();
    if (typeof updateTooltips === 'function') {
        updateTooltips();
    }
    
    const contactSearchInput = document.getElementById('contactSearchInput');
    if (contactSearchInput) {
        contactSearchInput.setAttribute('placeholder', i18next.t('config-placeholder-contactName'));
    }
    const groupSearchInput = document.getElementById('groupSearchInput');
    if (groupSearchInput) {
        groupSearchInput.setAttribute('placeholder', i18next.t('config-placeholder-groupName'));
    }
    const waitlistMailInput = document.getElementById('waitlistMailInput');
    if (waitlistMailInput) {
        waitlistMailInput.setAttribute('placeholder', i18next.t('waitlist-placeholder-email'));
    }
}

function updateModeDescriptionForContacts() {
    document.querySelectorAll('tr[id^="row-contact-exception-"]').forEach(function(row) {
        const modeId = row.querySelector('td:nth-child(4)').textContent;
        const modeElement = row.querySelector('span[id^="span-contact-mode-"]');
        
        if (modeElement) {
            modeElement.innerText = getModeDescription(parseInt(modeId));
        }
    });
}

function updateModeDescriptionForGroups() {
    document.querySelectorAll('tr[id^="row-group-exception-"]').forEach(function(row) {
        const modeId = row.querySelector('td:nth-child(4)').textContent;
        const modeElement = row.querySelector('span[id^="span-group-mode-"]');

        if (modeElement) {
            modeElement.innerText = getModeDescription(parseInt(modeId));
        }
    });
}

function updateErrorMessages() {
    const contactSearchInputFeedback = document.getElementById("contactSearchInputFeedback");
    if (contactSearchInputFeedback && contactSearchInputFeedback.style.display === "block") {
        const errorMessageKey = contactSearchInputFeedback.getAttribute('data-error-type');
        if (errorMessageKey) {
            contactSearchInputFeedback.innerText = i18next.t(errorMessageKey);
        }
    }
    
    const groupSearchInputFeedback = document.getElementById("groupSearchInputFeedback");
    if (groupSearchInputFeedback && groupSearchInputFeedback.style.display === "block") {
        const errorMessageKey = groupSearchInputFeedback.getAttribute('data-error-type');
        if (errorMessageKey) {
            groupSearchInputFeedback.innerText = i18next.t(errorMessageKey);
        }
    }
}

function updateTooltipTitles() {
    const tooltipElements = document.querySelectorAll('[data-bs-toggle="tooltip"]');

    tooltipElements.forEach(function(element) {
        const translationKey = element.getAttribute('data-i18n-key');

        if (translationKey) {
            element.setAttribute('data-bs-title', i18next.t(translationKey));
        }
    });
}