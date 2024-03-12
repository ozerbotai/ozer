let currentQRCode

document.addEventListener('DOMContentLoaded', function () {        
    const inputEmail = document.getElementById('email').value;    

    updateTexts();

    document.getElementById('linkGotoConfig').addEventListener('click', async function () {
        window.location.href = "/config";
    });    
})

function updateTexts() {
    const prefixCommands = "commands-";
    applyTranslationsByPrefix(prefixCommands)

    const prefixHeader = "header-";
    applyTranslationsByPrefix(prefixHeader)

    updateTooltipTitles();
    updateTooltips();
}