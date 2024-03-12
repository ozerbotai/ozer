document.addEventListener('DOMContentLoaded', async function () {
    const inputEmail = document.getElementById('email').value;

    updateTexts();    
    await showHideButtonsPauseTranscriptions()

    document.getElementById('linkGotoConfig').addEventListener('click', async function () {
        window.location.href = "/config";
    });

    document.getElementById('linkGotoConfigGeneral').addEventListener('click', async function () {
        window.location.href = "/config?target=general";
    });
    
    document.getElementById('linkGotoConfigContacts').addEventListener('click', async function () {
        window.location.href = "/config?target=contacts";
    });
    
    document.getElementById('linkGotoConfigGroups').addEventListener('click', async function () {
        window.location.href = "/config?target=groups";
    });
    
    document.getElementById('help-button-confirmPauseTranscriptions').addEventListener('click', async function () {
        pauseTranscriptions()
    });

    document.getElementById('help-button-activateTranscriptions').addEventListener('click', async function () {
        reactivateTranscriptions()
    });

    document.getElementById('activateTrancripToastBtn').addEventListener('click', async function () {
        reactivateTranscriptions()
    });

    document.getElementById('help-button-confirmReconnect').addEventListener('click', async function () {
        reconnect()
    });    
})

async function showHideButtonsPauseTranscriptions(){
    const inputEmail = document.getElementById('email').value;
    const userConfig = await getConfigurationByEmail(inputEmail)    
    if (userConfig.transcriptions_paused) {
        showButtonTranscriptionsPaused();
    } else {
        showButtonTranscriptionsActive()
    }
}

function showButtonTranscriptionsPaused() {
    document.getElementById("activeTranscripText").classList.add("d-none");
    document.getElementById("pausedTranscripText").classList.remove("d-none");
    document.getElementById("pausedTranscripText").classList.add("d-block");
    document.getElementById("activateTrancripAlert").classList.remove("d-none");
}
 
function showButtonTranscriptionsActive() {
    document.getElementById("pausedTranscripText").classList.add("d-none");
    document.getElementById("activeTranscripText").classList.remove("d-none");
    document.getElementById("activeTranscripText").classList.add("d-block");
    document.getElementById("activateTrancripAlert").classList.add("d-none");
}

async function reconnect(){
    const inputEmail = document.getElementById('email').value;
    await disconnectPhone(inputEmail);
    setTimeout(() => {                
        window.location.href = "/connect";
        }, 3000);
}

async function disconnectPhone(email) {
    try {        
        fetch(`../disconnectPhone?email=${encodeURIComponent(email)}`)
                .then(response => response.json())
                .then(phoneDisconectedProperly => {
                    if (phoneDisconectedProperly) {
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                });
        }
    catch(error) {
        console.log('error in disconnectPhone',error)
    }
}

async function pauseTranscriptions(){    
    const inputEmail = document.getElementById('email').value;
    await updatePauseTranscriptions(inputEmail, true)
    showButtonTranscriptionsPaused();
}

async function reactivateTranscriptions(){    
    const inputEmail = document.getElementById('email').value;
    await updatePauseTranscriptions(inputEmail, false)
    showButtonTranscriptionsActive();
}

function updateTexts() {
    const prefixHelp = "help-";
    applyTranslationsByPrefix(prefixHelp)

    const prefixHeader = "header-";
    applyTranslationsByPrefix(prefixHeader)

    //Apply i18n to config because help page uses the enable transcriptions shared component 
    const prefixConfig = "config-";
    applyTranslationsByPrefix(prefixConfig)

    updateTooltipTitles();
    updateTooltips();
}