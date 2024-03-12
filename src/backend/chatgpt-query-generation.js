const { codeBlock, oneLine } = require('common-tags');
const chatgpt = require('./chatgpt');
const baileysFunctions = require('./baileys-functions');
const miscFunctions = require('./misc-functions');

exports.generateChatGPTRequest = async function (msg) {    
    const msgText = baileysFunctions.getMsgText(msg)
    const quotedText = removeOzerMessage(baileysFunctions.getQuotedMsgText(msg))
    const userRequest = miscFunctions.removeFirstWord(msgText)

    try {
        result = await generateChatGPTRequestChat(userRequest, quotedText)        
        return result
    } 
    catch (error) {
        console.error("API call failed:", error);
        return ''
    }

    /* if (quotedText) {
        switch (msg.type) {
            case 'chat':                
                 
                break;
            case 'image':
                break;
            case 'ptt', 'audio':
                break;
            case 'video':
                break;
            case 'document':
                const documentContent = msg._data.quotedMsg.body
                break;
            case 'vcard':
                break;
            case 'location':
                break;                    
        }                
    } else {
        const quotedMessage = ''
    } */
}

async function generateChatGPTRequestChat(userRequest, quotedText) {
    let prompt
    if (quotedText != '') {
        prompt = await generatePromptChatWithQuote(userRequest, quotedText);
    } else {
        prompt = await generatePromptChat(userRequest);
    }
    const response = await chatgpt.sendPromptToGPT(prompt, []);
    
    return(response);
}

async function generatePromptChat(userRequest) {
    try {
        const prompt = codeBlock`
            ${oneLine`
                You are an AI assistant called Ozer. Your job is to help people with their requests.
                Respond the following request: "${userRequest}"
                Respond just the answer, no text before it.

            `}
            
            `
            return(prompt);
    } catch (err) {
        console.log(err)
        return('');
    }
}

async function generatePromptChatWithQuote(userRequest, quotedText) {
    try {
        const prompt = codeBlock`
            ${oneLine`
            You are an AI assistant called Ozer. Your job is to help people with their requests.
            Respond the following request: "${userRequest}".            
            Respond just the answer, no text before it.
            Take into account the following text: "${quotedText}".
                
            `}
            
            `
            return(prompt);
    } catch (err) {
        console.log(err)
        return('');
    }
}

function removeOzerMessage(text) {
    const prefix = "www.ozer.bot:*";
    const index = text.indexOf(prefix);
    if (index !== -1) {
        return text.substring(index + prefix.length).trim();
    } else {
        return text
    }
}