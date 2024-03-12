const { codeBlock, oneLine } = require('common-tags');
const chatgpt = require('./chatgpt');

exports.guessTextLanguage = async function (text) {
    //This function received a text and tries to guess its language
    //If it can, the it returns the ISO 639 language code.
    //If it can't, then it returns "--"
    const prompt = generatePrompt(text);
    const response = await chatgpt.sendPromptToGPT(prompt);

    if (response.length===2) {
        return(response);
    } else {
        return('--');
    } 
}

function generatePrompt(text) {    
    try {
        const prompt = codeBlock`
            ${oneLine`
                Given the following text: "${text}", please tell me the language it is written in. 
                Please, answer only 2 letters corresponding to the corresponding to the code of the language in the "List of ISO 639 language codes"            
                If the text provided contains segments in multiple languages, respond "--". 
                If you are not sure, respond "--". 
                By no means respond more than 2 characters.
            `}
            
            `
            return(prompt);
    } catch (err) {
        console.log(err)
        return('--');
    }
}