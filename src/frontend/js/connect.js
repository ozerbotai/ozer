let currentQRCode
let postConnectExecuted = false;

document.addEventListener('DOMContentLoaded', function () {        
    const inputEmail = document.getElementById('email').value;    

    const connectQRSpinner = document.getElementById("connectQRSpinner");
    connectQRSpinner.style.display = "block";

    updateTexts();

    if (/Mobi|iPhone|iPod|Android/.test(navigator.userAgent) && !/iPad|Tablet/.test(navigator.userAgent)) {
        window.location.href = "/connect-error-mobile";
    } else {
        connectPhone(inputEmail)
    }
})

function updateTexts() {
    const prefixConnect = "connect-";
    applyTranslationsByPrefix(prefixConnect)

    const prefixHeader = "header-";
    applyTranslationsByPrefix(prefixHeader)

    updateTooltipTitles();
    updateTooltips();
}

async function connectPhone(email) {
    console.log('Connecting', email)
    setQRCodeDisconnected(email)
    await registerUserTryingToConnect();
    document.getElementById('qrcode').innerHTML = '';
    const lang = 'ES' //document.getElementById('languageSelect').value
    fetch(`../connectPhone?lang=${encodeURIComponent(lang)}`)
        .then(response => response.json())
        .then(data => {
            getQRCode(email);
            clearInterval(window.qrCodeInterval); 
            window.qrCodeInterval = setInterval(function() {
                getQRCode(email);
            }, 500); // Calls getQRCode every 500 ms                    
            clearInterval(window.connectionInterval); 
            window.connectionInterval = setInterval(function() {
                checkConnection(email);
            }, 1000); // Calls checkConnection every 1000 ms
        })
        .catch(error => {
            console.error('Error:', error);
            clearInterval(window.qrCodeInterval); 
            clearInterval(window.connectionInterval); 
            hideSpinner();
        });
}

async function setQRCodeDisconnected(email) {
    fetch(`../setQRCodeDisconnected?email=${encodeURIComponent(email)}`)
            .then(response => response.json())
            .then(data => {
                
            })
            .catch(error => {
                clearInterval(window.qrCodeInterval);
                clearInterval(window.connectionInterval);
                console.error('Error:', error);                
            });
}

function getQRCode(email) {
    fetch(`../getCurrentQRCode?email=${encodeURIComponent(email)}`)
            .then(response => response.json())
            .then(data => {
                if (data.last_qr_code != currentQRCode) {
                    currentQRCode = data.last_qr_code
                    connectQRSpinner.style.display = "none";
                    document.getElementById('qrcode').innerHTML = '';
                    new QRCode(document.getElementById("qrcode"), {
                      text: currentQRCode,
                      colorDark: "#000",
                      colorLight: "#fff",
                      correctLevel: QRCode.CorrectLevel.H,
                    });
                    document.getElementById("qrcode").title = ""
                }                                 
            })
            .catch(error => {
                clearInterval(window.qrCodeInterval);
                clearInterval(window.connectionInterval);
                console.error('Error:', error);                
            });
}

function checkConnection(email) {
    fetch(`../getCurrentQRCode?email=${encodeURIComponent(email)}`)
            .then(response => response.json())
            .then(async data => {
                if (data.state==='CONNECTING') {
                    document.getElementById('qrcode').innerHTML = '';
                    showSpinner();
                    clearInterval(window.qrCodeInterval); 
                } else if (data.state==='TIMEOUT') {
                    clearInterval(window.qrCodeInterval);
                    clearInterval(window.connectionInterval);
                    window.location.href = "/connect-timeout";
                } else if (data.state==='PHONE_EMAIL_CONFLICT') {
                    clearInterval(window.qrCodeInterval);
                    clearInterval(window.connectionInterval);
                    window.location.href = "/connect-conflict";
                } else if (data.state==='CONNECTED') {
                    const lang = navigator.language.split('-')[0] || 'en';

                    if (postConnectExecuted === false) {
                        postConnectExecuted = true;
                        await userPostConnect(email, lang);
                    }

                    clearInterval(window.qrCodeInterval);
                    clearInterval(window.connectionInterval);
                    window.location.href = "/connect-success";
                } else if (data.state==='DISCONNECTED') {
                    //Does nothing
                } else {
                    console.log('Error in checkConnection. data.state should be DISCONNECTED, TIMEOUT, PHONE_EMAIL_CONFLICT, CONNECTING or CONNECTED',data.state)
                    clearInterval(window.qrCodeInterval);
                    clearInterval(window.connectionInterval);
                }                
            })
            .catch(error => {
                clearInterval(window.qrCodeInterval); 
                clearInterval(window.connectionInterval);
                console.error('Error:', error);                
            });
}

async function userPostConnect(email, language) {
    try {
        const response = await fetch('../userPostConnect?'+
                                    'email='+encodeURIComponent(email)+'&'+
                                    'language='+encodeURIComponent(language)
                                    );
        data = await response.json()
        return(data)        
    } catch(error) {
        console.error('Error:', error);
    }        
}

function showSpinner() {
    document.getElementById('section-connect-main').style.display = 'none';
    document.getElementById('section-connect-loading').style.display = 'block';    
}

function hideSpinner() {
    document.getElementById('section-connect-loading').style.display = 'none';
    document.getElementById('section-connect-main').style.display = 'block';
}