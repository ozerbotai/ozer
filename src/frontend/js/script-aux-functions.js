function getNavigatorUrlParameters(){
    let params = {
        browserLanguage: navigator.language,
        platform: navigator.userAgentData?.platform || navigator.platform,
        isMobile: navigator.userAgentData?.mobile || /Mobi|Android/i.test(navigator.userAgent)
    };

    // Convert params to a query string
    return Object.keys(params)
        .map(key => key + '=' + encodeURIComponent(params[key]))
        .join('&');
}

// We use this new function because the previous one has camelCase fields
// but the 'waitlist_users' table uses snake_case, so we adjust the field names
async function getNavigatorUrlParameters2(){

    const informationFromIP = await getInformationFromIP();
    
    // Create an object with user's browser language, platform, mobile status, country, and region
    let params = {
        browser_language: navigator.language,
        platform: navigator.userAgentData?.platform || navigator.platform,
        is_mobile: navigator.userAgentData?.mobile || /Mobi|Android/i.test(navigator.userAgent),
        country: informationFromIP.country || '',
        region: informationFromIP.region || ''
    };

    // Convert params to a query string
    return Object.keys(params)
        .map(key => key + '=' + encodeURIComponent(params[key]))
        .join('&');
}