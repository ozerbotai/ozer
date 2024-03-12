const fs = require('fs');
const Stream = require('stream')
const OpenAI=require("openai")
require('dotenv').config({ path: '.env.local' })
const { toFile } = require("openai/uploads");
const I18nManager = require('./i18n-manager');

const openai = new OpenAI({
    organization: process.env.OPENAI_ORG,
    apiKey: process.env.OPENAI_KEY
  });

async function recognizeSpeech(audioBuffer, language, phone, msg) {
    if (process.env.DUMMY_TRANSCRIPTIONS === 'YES') {
        return 'Dummy Transcription';
    }
    // Transforms the binary to a file object.
    // A file name and type must be included because otherwise it doesn't work. It doen not create any file on disk.   
    const convertedFile = await toFile(audioBuffer,'audio.mp3'); 
    const text = await transcriptAudio(convertedFile, language, phone, msg)
    return text;
};

const transcriptAudio = async(audioFile, language, phone, msg)=>{
    try {
        const transcription = await openai.audio.transcriptions.create({
            file:audioFile,
            model:"whisper-1"
        })
        return(transcription.text)
    } catch(error) {
        console.log(phone, 'Error connecting to OpenAI in "transcriptAudio". Error: ', error, msg)
        const i18n = new I18nManager();
        return(i18n.getWL('TRANSCRIPTION_NOT_AVAILABLE', language))
    }
}

module.exports = recognizeSpeech;