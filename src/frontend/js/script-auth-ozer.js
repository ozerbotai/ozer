document.addEventListener('DOMContentLoaded', function () {    
    redirectAuthGoogle();
})

function redirectAuthGoogle() {
    window.location.href = "/auth/google";
}