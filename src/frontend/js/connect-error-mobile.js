document.addEventListener('DOMContentLoaded', async function () {        
    updateTexts();
    await registerUserTryingToConnect();

    if (getCookie('sendMobileConnectionEmail') === undefined || getCookie('sendMobileConnectionEmail') === 'false') {
        setCookie('sendMobileConnectionEmail', true, 1);
        await sendMobileConnectionEmail();
    }

    document.getElementById('connect-button-accept').addEventListener('click', async function () {
        window.location.href = document.getElementById('homePath').value;
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