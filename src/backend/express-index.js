require('dotenv').config({ path: '.env.local' })
const express = require('express')

const path = require('path')
const fs = require('fs');
const https = require('https');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const expressBaileys = require('./express-baileys');
const mandrillFunctions = require('./mandrill-functions.js');

global.app = express()

global.app.set('view engine', 'ejs');
global.app.set('views', path.join(__dirname, '../frontend/html'));
//app.set('frontend', path.join(__dirname, '../../frontend/html'));
global.app.use('/styles', express.static(path.join(__dirname, '../frontend/styles')));
global.app.use('/img', express.static(path.join(__dirname, '../frontend/img')));
global.app.use('/js', express.static(path.join(__dirname, '../frontend/js')));

// Rate limiting middleware: Avoid a single IP from making too many requests.
const rateLimiter = rateLimit({
	windowMs: 1 * 60 * 1000, // 1 minute
	limit: 300, // Limit each IP to 300 requests per `window` (here, per 1 minute).
	standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
	legacyHeaders: false // Disable the `X-RateLimit-*` headers.
	// store: ... , // Cuurently using in-memory store. We could use Redis, Memcached, etc. 
})
// Apply the rate limiting middleware to all requests.
global.app.use(rateLimiter)

// Helmet middleware: Set security-related HTTP headers.
global.app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // Add sites that are allowed to load scripts
      "script-src": ["'self'", "unpkg.com", "cdn.jsdelivr.net", "cdnjs.cloudflare.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []      
    },
  },  
}));

// Disable HTTP methods that Ozer doesn’t use, like TRACE, PUT, DELETE, etc.
global.app.use((req, res, next) => {
  const allowedMethods = ['GET', 'POST'];
  if (!allowedMethods.includes(req.method)) {
    res.status(405).send('Method Not Allowed');
  } else {
    next();
  }
});

// Set up http sessions / cookies
const session = require('express-session');
const SqliteStore = require("./ozer-better-sqlite3-session-store")(session)
const sqlite = require("better-sqlite3");
const db = new sqlite("sessions.db");
const httpSessionsSqliteStore = new SqliteStore({
  client: db, 
  expired: {
    clear: true,
    intervalMs: 900000 //ms = 15min
  }
})
global.app.use(session({
  store: httpSessionsSqliteStore,
  resave: false,
  saveUninitialized: true,
  secret: process.env.HTTP_SESSION_SECRET,
  cookie: {
            httpOnly: true,                        // Prevents JavaScript access to the cookie 
            secure: true,                          // Ensures the cookie is only sent over HTTPS
            sameSite: 'lax',                       // Prevents CSRF attacks by restricting cross-site usage
            maxAge: 30 * 24 * 60 * 60 * 1000,      // Sets session duration to 30 days
            rolling: true
          }
}));

// Map of whatsapp connections. Key is the email, value is connectedPhoneObjects
var connectedPhones = new Map();
const {disconnectWhatsapp} = require('./whatsappinteraction.js');

const options = {
  key: fs.readFileSync(process.env.SSL_KEY),
  cert: fs.readFileSync(process.env.SSL_CERT)
};

const httpsServer = https.createServer(options, global.app);
const port = process.env.PORT
httpsServer.listen(port, async () => {
  console.log(`HTTPS Server running on port ${port}`);
  await expressBaileys.restoreExistingUsers(connectedPhones);
  mandrillFunctions.sendServerUpEmail();
});

var deleteOldMessagesInterval = setInterval(() => {
  expressBaileys.deleteOldMessages(connectedPhones)
}, Number(process.env.BAILEYS_STORE_DELETE_OLD_MESSAGES_INTERVAL));


process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing the server.');
  httpsServer.close(() => {
    console.log('Express server closed.');
    console.log('http sessions store closing...');
    httpSessionsSqliteStore.close();
    console.log('deleteOldMessagesInterval removing...');
    clearInterval(deleteOldMessagesInterval);
    console.log('batchProcess stopping.');
    batchProcess.stopBatchProcess();
    connectedPhones.forEach((connectedPhoneObjects, email) => {
      console.log('Destroying the sock for email', email);
      disconnectWhatsapp(connectedPhones, email, true, false);
    });
    console.log('Sending server down email...');
    mandrillFunctions.sendServerDownEmail();
    console.log('Finishing server shutdown...');
  });
});

require('./express-google-login');
require('./express-webserver');
require('./express-database');
//TODO: Try to change this line for require('./express-baileys');
expressBaileys.setBaileysEndpoints(app, connectedPhones);

const batchProcess = require('./batch-process.js');
batchProcess.startBatchProcess();

