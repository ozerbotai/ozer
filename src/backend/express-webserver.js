require('dotenv').config({ path: '.env.local' })
const baileysFunctions = require('./baileys-functions');
const {ensureAuthenticated, checkAdmin, ensureCorrectlyConnected, ensureNotConnected} = require('./express-middlewares.js');
    
const supabase = require('./supabase.js');

global.app.get('/status', (req, res) => {
    res.send('Hello World!')
})

global.app.get('/', (req, res) => {
    res.redirect('/config');
})

global.app.get('/users', checkAdmin, (req, res) => {  
    res.render('users', {});  
})

global.app.get('/users/eventlogs/:email', checkAdmin, (req, res) => {  
    const email = req.params.email;
    res.render('user-event-logs', {
        user: {
            emails: [{value:email}]
        },
        title: 'User event logs'
        });  
})

global.app.get('/logged-in', ensureAuthenticated, async (req, res, next) => {
    const userEmail = req.session.userProfile.emails[0].value
    if (await baileysFunctions.isUserCorrectlyConnected(userEmail)) {
        res.redirect('/config');
    } else {
        res.redirect('/connect');
    }    
})

global.app.get('/home', (req, res) => {
    res.render('home');
})

global.app.get('/config', ensureAuthenticated, ensureCorrectlyConnected, async (req, res, next) => {    
    const target = req.query.target
    res.render('config', {
        user: req.session.userProfile,
        target: target,
        completeHeader: true
    });
});

global.app.get('/connect', ensureAuthenticated, ensureNotConnected, async (req, res, next) => {    
    const waitlistValues = await supabase.getWaitlistIsOpen()
    if (waitlistValues.waitlist_open === false) {
        // If the waitlist is closed, we render 'connect-QR' for all users
        res.render('connect-QR', {
            user: req.session.userProfile,
            completeHeader: false
        });
    } else {
        const userEmail = req.session.userProfile.emails[0].value
        const config = await supabase.getConfigurationByEmail(userEmail)
        if (config) {
            // If the user already exists in the database, we render 'connect-QR' so that it connects normally
            res.render('connect-QR', {
                user: req.session.userProfile,
                completeHeader: false
            });
        } else {
            // If the user does not exist in the database, we render 'new-waitlist' to join the waitlist
            res.render('waitlist', {
                user: req.session.userProfile,
                completeHeader: false
            });
        }
    }
});

global.app.get('/connect-success', ensureAuthenticated, ensureCorrectlyConnected, async (req, res, next) => {    
    res.render('connect-success', {
        user: req.session.userProfile,
        completeHeader: true
    });
});

global.app.get('/connect-timeout', ensureAuthenticated, ensureNotConnected, async (req, res, next) => {    
    res.render('connect-timeout', {
        user: req.session.userProfile,
        completeHeader: false
    });
});

global.app.get('/connect-conflict', ensureAuthenticated, ensureNotConnected, async (req, res, next) => {    
    res.render('connect-conflict', {
        user: req.session.userProfile,
        completeHeader: false
    });
});

global.app.get('/connect-error-mobile', ensureAuthenticated, ensureNotConnected, async (req, res, next) => {    
    res.render('connect-error-mobile', {
        user: req.session.userProfile,
        completeHeader: false
    });
});

global.app.get('/commands', ensureAuthenticated, ensureCorrectlyConnected, async (req, res, next) => {    
    res.render('commands', {
        user: req.session.userProfile,
        completeHeader: true
    });
});

global.app.get('/help', ensureAuthenticated, ensureCorrectlyConnected, async (req, res, next) => {    
    res.render('help', {
        user: req.session.userProfile,
        completeHeader: true
    });
});

global.app.get('/config/:email', checkAdmin, async (req, res) => {
    const target = req.query.target
    const email = req.params.email;
    const config = await supabase.getConfigurationByEmail(email)
    if(config){   
        res.render('config', {
            user: {
                emails: [{value:email}],
                displayName: config.alias
            },
            target: target,
            completeHeader: true
        });  
    } else {
        throw new Error("User not found");
    }
})

global.app.get('/auth-ozer', async (req, res, next) => {
    res.render('auth-ozer', {
        user: req.session.userProfile,
        completeHeader: false
    });
});
