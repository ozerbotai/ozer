require('dotenv').config({ path: '.env.local' });
const supabase = require('./supabase.js');
const events = require('./user-event-constants-backend.js')

/*  PASSPORT SETUP  */

passport = require('passport');

global.app.use(passport.initialize());
global.app.use(passport.session());

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

/*  Google AUTH  */

const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CLIENT_CALLBACK_URL
  },
  function(accessToken, refreshToken, profile, done) {
      return done(null, profile);
  }
));


global.app.get('/auth/google', //Endpoint for login
    global.passport.authenticate('google', { scope : ['profile', 'email'] }));

global.app.get('/auth/google/callback', 
    global.passport.authenticate('google', { failureRedirect: process.env.HOME_PATH }),
    async function(req, res) {
        // Successful authentication, redirect success.
        req.session.userProfile = req.user;
        res.redirect('/logged-in');
    });

global.app.get('/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      req.session.destroy((err) => {
        if (err) {
          return next(err);
        }
        res.redirect(process.env.HOME_PATH);
      });
    });
  });