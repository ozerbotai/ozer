const fs = require('fs');
const path = require('path');
const supabase = require('./supabase.js');

class I18nManager {
    constructor() {
        this.language = 'EN'
        this.languages = {};
        this.availableLanguages = [];
        this.loadLanguages();
    }

    // Loads all JSON files in "language-files" folder
    loadLanguages() {
        const localePath = path.join(__dirname, 'language-files');
        fs.readdirSync(localePath).forEach(file => {
            if (file.endsWith('.json')) {
                const lang = file.split('.')[0];
                const filePath = path.join(localePath, file);
                const content = fs.readFileSync(filePath, 'utf8');
                this.languages[lang] = JSON.parse(content);
                this.availableLanguages.push(lang)
            }
        });        
    }

    getAvailableLanguages() {
        return(this.availableLanguages);
    }

    // Gets the translated phrase using the language received as a parameter
    getWL(key, lang) {
        const lowerLang = lang.toLowerCase()
        if (this.languages[lowerLang] && this.languages[lowerLang][key]) {
            return this.languages[lowerLang][key];
        }
        if (this.languages['en'] && this.languages['en'][key]) {
            return this.languages['en'][key];
        }
        console.log(`Translation not found for [${key}] in language [${lang}]`)
        return `Translation not found for [${key}] in language [${lang}]`;
    }

    // Gets the translated phrase using the language set with setLanguage
    get(key) {        
        return this.getWL(key, this.language);
    }

    // Gets the translated phrases for all the languages
    getAll(key) {        
        let values = [];
        this.availableLanguages.forEach(lang => {
            if (this.languages[lang] && this.languages[lang][key]) {
                values.push(this.languages[lang][key]);
            }
        });
        return values;
    }

    // Gets the translated phrase using the default language of the user
    async getPH(key, user_phone) {
        let language
        //Get default language of user
        const userConfig = await supabase.getConfiguration(user_phone)
        language = userConfig ? userConfig.language : "EN"
        
        return this.getWL(key, language);
}

    //Sets the language you want to use in function "get"
    setLanguage(language) {
        this.language = language;
    }
}

module.exports = I18nManager;
