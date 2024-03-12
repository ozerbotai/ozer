document.addEventListener('DOMContentLoaded', async function () {        
    const inputEmail = document.getElementById('email').value;    

    updateTexts();    
    await insertWaitlistUser();
})

function updateTexts() {
    const prefixWaitlist = "waitlist-";
    applyTranslationsByPrefix(prefixWaitlist)

    const prefixHeader = "header-";
    applyTranslationsByPrefix(prefixHeader)
}