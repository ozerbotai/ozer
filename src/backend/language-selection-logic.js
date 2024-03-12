const supabase = require('./supabase.js');
const miscFunctions = require('./misc-functions.js');
const guessLanguage = require('./guess-text-language');
const I18nManager = require('./i18n-manager');
const constants = require('./constants.js');

exports.getSetChatLanguage = async function (userPhone, isGroup, groupId, contactPhone, transcribedAudio, messageForwarded) {
    let languageCode

    try {
        //Step 1 - Check if contact or group already has a language assigned
        const specificLanguageCode = await getSpecificLanguage(userPhone, isGroup, groupId, contactPhone)
        if (specificLanguageCode) {
            //There is a specific language assigned to this contact or group
            languageCode = specificLanguageCode.language
            return(onlyAvailableLanguages(languageCode))
        } 
        //Step 2 - If transcribed text has more than 10 words and message is not forwarded, try to guess the language
        const words = miscFunctions.countWords(transcribedAudio)
        if (words>constants.MIN_WORDS_FOR_LANGUAGE_RECOGNITION && !messageForwarded) {
            //If more than 10 words, try to guess the language
            const guessedlanguageCode = await guessLanguage.guessTextLanguage(transcribedAudio.slice(0, 200)) //Takes only the first 200 characters
            if (guessedlanguageCode != '--') { //If Language guessing engine was able to guess the language
                //Saves the language as the specific language of the chat
                await setSpecificLanguage(userPhone, isGroup, groupId, contactPhone,guessedlanguageCode)
                languageCode = guessedlanguageCode            
                return(onlyAvailableLanguages(languageCode))
            } 
        }
        //Step 3 - Get language from the user configuration
        const userConfig = await supabase.getConfiguration(userPhone)
        const configLanguage = userConfig.language
        languageCode = configLanguage
        return(onlyAvailableLanguages(languageCode))
    } catch(err) {
        console.log('Error in getSetChatLanguage', err)
        return("EN")
    }
}

async function onlyAvailableLanguages(languageCode) {
    //Returns 'EN' if language parameter is not available in internationalization files. 
    const i18n = new I18nManager();
    const availableLanguages = i18n.getAvailableLanguages();
    return(availableLanguages.includes(languageCode.toLowerCase()) ? languageCode : 'EN')    
}

async function getSpecificLanguage(userPhone, isGroup, groupId, contactPhone) {
    let specificLanguageCode
    if (isGroup) {
        specificLanguageCode = await supabase.getGroupLanguage(userPhone, groupId)        
    } else {
        specificLanguageCode = await supabase.getContactLanguage(userPhone, contactPhone)
    }   
    return(specificLanguageCode)
}

async function setSpecificLanguage(userPhone, isGroup, groupId, contactPhone, language) {
    if (isGroup) {
        await supabase.insertGroupLanguage(userPhone, groupId, language)
    } else {
        await supabase.insertContactLanguage(userPhone, contactPhone, language)
    }
}

exports.deleteChatLanguage = async function (userPhone, isGroup, groupId, contactPhone) {
    let result
    if (isGroup) {
        result = await supabase.deleteGroupLanguage(userPhone, groupId)
    } else {
        result = await supabase.deleteContactLanguage(userPhone, contactPhone)
    }
    return(result)
}

// Detects the browser language and returns a simplified language code ('ES' or 'EN'). 
// Defaults to 'EN' if no match is found.
exports.detectbrowserLanguage = function (browserLanguage) {
    const language = browserLanguage.toLowerCase();
    if (language.startsWith('es')) {
        return 'ES';
    } else if (language.startsWith('en')) {
        return 'EN';
    }
    return 'EN';
}