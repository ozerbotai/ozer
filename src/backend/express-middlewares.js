require('dotenv').config({ path: '.env.local' })
const baileysFunctions = require('./baileys-functions');
const supabase = require('./supabase.js');

exports.checkAuthenticated = function (req, res, next) {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Not Authenticated / Not authorized' });
    }
    return next();
}

exports.checkAdmin = async function (req, res, next) {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Not Authenticated / Not authorized' });
    }
    let userEmail = req.session.userProfile.emails[0].value;
    try {
        let userConfig = await supabase.getConfigurationByEmail(userEmail);
        if (userConfig.is_admin) {
            return next();
        } else {
            return res.status(401).json({ error: 'Unauthorized user' });
        }
    } catch (error) {
        console.error('Error getting user settings:', error);
        return res.status(500).send('Internal Server Error');
    }
}

exports.checkPhone = async function (req, res, next) {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Not Authenticated / Not authorized' });
    }
    let userEmail = req.session.userProfile.emails[0].value;
    try {
        let userConfig = await supabase.getConfigurationByEmail(userEmail);
        if (userConfig.is_admin) {
            return next();
        } else if(userConfig.user_phone === req.query.phone) {
            return next();
        } else {
            return res.status(401).json({ error: 'Unauthorized user' });
        }
    } catch (error) {
        console.error('Error getting user settings:', error);
        return res.status(500).send('Internal Server Error');
    }
}

exports.checkEmail = async function (req, res, next) {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Not Authenticated / Not authorized' });
    }
    let userEmail = req.session.userProfile.emails[0].value;
    try {
        let userConfig = await supabase.getConfigurationByEmail(userEmail);
        if (userConfig.is_admin) {
            return next();
        } else if(userConfig.email === req.query.email) {
            return next();
        } else {
            return res.status(401).json({ error: 'Unauthorized user' });
        }
    } catch (error) {
        console.error('Error getting user settings:', error);
        return res.status(500).send('Internal Server Error');
    }
}

exports.ensureAuthenticated = function (req, res, next) {
    if (!req.isAuthenticated()) {
        return res.redirect('/auth-ozer');
    }
    return next();
}


exports.ensureCorrectlyConnected = async function (req, res, next) {
    const userEmail = req.session.userProfile.emails[0].value
    if (await baileysFunctions.isUserCorrectlyConnected(userEmail)) {
        return next();
    } else {
        return res.redirect('/connect');
    }
}

exports.ensureNotConnected = async function (req, res, next) {
    const userEmail = req.session.userProfile.emails[0].value
    if (!await baileysFunctions.isUserCorrectlyConnected(userEmail)) {
        return next();
    } else {
        return res.redirect('/config');
    }
}
