exports.countWords = function (text) {
    // Split the text into an array of words, separating by spaces
    if (text) {
        const words = text.split(/\s+/);  
        // Filter out any empty strings to avoid counting extra spaces as words
        const filteredWords = words.filter(word => word.length > 0);  
        // Return the number of words
        return filteredWords.length;
    } else {
        return 0;
    }
}

exports.removeFirstWord = function (text) {
    // Split the string into an array of words
    let words = text.split(' ');
    
    // Remove the first word
    words.shift();
    
    // Join the remaining words back into a string
    let result = words.join(' ');
    
    return result;
  }

exports.getFirstWord = function (text) {
    // Split the string by spaces and return the first element of the resulting array
    return text.split(' ')[0];
  }

// encodes email address in a format that can be used as part of a file name. Removes @, dots, etc.
exports.encodeEmail = function (email) {    
    let encodedEmail
    if (email) {
      encodedEmail = email.replace(/@/g,'-at-')
      encodedEmail = encodedEmail.replace(/\./g,'-dot-')
    } else {
      encodedEmail = ''
    }
    return encodedEmail
  }

// decodes email address from a format that can be used as part of a file name. Adds @, dots, etc.
exports.decodeEmail = function (email) {
    let decodedEmail = email.replace(/-at-/g,'@')
    decodedEmail = decodedEmail.replace(/-dot-/g,'.')

    return decodedEmail
  }