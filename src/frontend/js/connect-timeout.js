let currentQRCode

document.addEventListener('DOMContentLoaded', function () {        
    const inputEmail = document.getElementById('email').value;    

    updateTexts();

    document.getElementById('connect-button-retryTwo').addEventListener('click', async function () {
        window.location.href = "/connect";
    });    
})

function updateTexts() {
    const prefixConnect = "connect-";
    applyTranslationsByPrefix(prefixConnect)

    const prefixHeader = "header-";
    applyTranslationsByPrefix(prefixHeader)

    updateTooltipTitles();
    updateTooltips();
}