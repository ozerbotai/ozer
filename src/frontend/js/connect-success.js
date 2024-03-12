let currentQRCode

document.addEventListener('DOMContentLoaded', function () {        
    const inputEmail = document.getElementById('email').value;    
    const btnTryOzer = document.getElementById('connect-button-tryOzerWhatsapp');
    const btnTryCommands = document.getElementById('connect-button-tryCommands');

    updateTexts();

    function isMobile() {
        return /Mobi|Android|iPhone|iPod|Opera Mini|IEMobile|Mobile|BlackBerry|BB10|Windows Phone|wpdesktop/i.test(navigator.userAgent) && !/iPad|Tablet/i.test(navigator.userAgent);
    }

    if (!isMobile()) {
        btnTryOzer.setAttribute('data-bs-toggle', 'modal');
        btnTryOzer.setAttribute('data-bs-target', '#whatsAppButtonsModal');
        btnTryCommands.setAttribute('data-bs-toggle', 'modal');
        btnTryCommands.setAttribute('data-bs-target', '#whatsAppButtonsModal');
    }

    document.getElementById('connect-button-tryOzerWhatsapp').addEventListener('click', async function () {
        if (isMobile()) {
            const whatsappDesktopAndAppUrl = "whatsapp://";
            window.location.href = whatsappDesktopAndAppUrl;
        }
    });

    document.getElementById('connect-button-gotoConfig').addEventListener('click', async function () {
        window.location.href = "/config";
    });

    document.getElementById('connect-button-tryCommands').addEventListener('click', async function () {
        if (isMobile()) {
            const whatsappDesktopAndAppUrl = "whatsapp://";
            window.location.href = whatsappDesktopAndAppUrl;
        }
    });

    document.getElementById('connect-button-whatsAppWeb').addEventListener('click', async function () {
        const whatsappWebUrl = "https://web.whatsapp.com/";
        window.open(whatsappWebUrl, "_blank");
    });

    document.getElementById('connect-button-whatsAppDesktop').addEventListener('click', async function () {
        const whatsappDesktopAndAppUrl = "whatsapp://";
        window.location.href = whatsappDesktopAndAppUrl;
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