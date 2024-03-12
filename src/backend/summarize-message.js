const { codeBlock, oneLine } = require('common-tags');
const chatgpt = require('./chatgpt');

exports.summarizeMessage = async function (text, use_bullets, summary_length, length_seconds, length_words) {
    //summary_length:
    // AUTOMATIC: Summary length will be of a fix size dependaning of the message length in seconds/words
    // FIXED_SMALL: Summary length will be of a fix size of no more than 300 characters
    // FIXED_MEDIUM: Summary length will be of a fix size of no more than 450 characters
    // FIXED_LARGE: Summary length will be of a fix size of no more than 600 characters
    // PROPORTIONAL_HALF: Summary will be half the size of the messages, 
    // PROPORTIONAL_QUARTER: Summary will be of a quarter of the size of the messages, 
    const prompt = generatePrompt(text, use_bullets, summary_length, length_seconds, length_words);
    const response = await chatgpt.sendPromptToGPT(prompt);
    return(response);
}

function generatePrompt(text, use_bullets, summary_length, length_seconds, length_words) {
    let sizeText;
    let bulletText;
    if(use_bullets) {
        bulletText = 'into a concise bullet-point list highlighting the main points of the sender’s message for easy reading by the recipient.'
    } else {
        bulletText = ''
    }
    switch (summary_length) {
        case 'AUTOMATIC':
            if (length_seconds > 0) {
                if (length_seconds < 90) {
                    sizeText = 'Use no more than 300 characters';
                } else if (length_seconds < 180) {
                    sizeText = 'Use no more than 450 characters';
                } else {
                    sizeText = 'Use no more than 600 characters';
                }
            } else {
                if (length_words < 150) {
                    sizeText = 'Use no more than 300 characters';
                } else if (length_seconds < 250) {
                    sizeText = 'Use no more than 450 characters';
                } else {
                    sizeText = 'Use no more than 600 characters';
                }
            }
            break;
        case 'FIXED_SMALL':
            sizeText = 'Use no more than 300 characters';
            break;
        case 'FIXED_MEDIUM':
            sizeText = 'Use no more than 450 characters';
            break;
        case 'FIXED_LARGE':
            sizeText = 'Use no more than 600 characters';
            break;
        case 'PROPORTIONAL_HALF':
            sizeText = 'Use aprox 1/2 of the characters of the original message text';
            break;
        case 'PROPORTIONAL_QUARTER':
            sizeText = 'Use aprox 1/4 of the characters of the original message text';
            break;
    }
    const prompt = codeBlock`
    ${oneLine`
        Summarize the following WhatsApp message ${bulletText}.
        ${sizeText}.
        The summary should be in the first person and include only the essential information needed to understand 
        the key details without reading the full text. Maintain always the same language as the original text.
        Message: "${text}"
    `}            
    `
    return(prompt);
}