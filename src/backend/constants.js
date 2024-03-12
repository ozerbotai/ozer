const constants = {
    // Min number of words a message needs to have in order to be considered to detect the language a user/contact/group is using.
    MIN_WORDS_FOR_LANGUAGE_RECOGNITION: 10,
    // Min number of words a message needs to have in order to be considered for text summary
    MIN_WORDS_FOR_TEXT_SUMMARY: 100,
    // Max number of words a message can have in order to be summarized
    MAX_WORDS_FOR_TEXT_SUMMARY: 5000,
    // Max number of minutes a message can have in order to be transcribed.
    MAX_MINUTES_FOR_AUDIO_TRANSCRIPTION: 15,
    // Max number of exceptions a user can create per hour before considering it an attack
    LIMIT_CONTACT_AND_GROUP_EXCEPTIONS: 100
};
  
module.exports = constants;
  