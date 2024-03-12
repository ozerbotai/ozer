require('dotenv').config({ path: '.env.local' })

const supabase = require('./supabase.js');
const expressBaileys = require('./express-baileys');
const I18nManager = require('./i18n-manager');
const baileysFunctions = require('./baileys-functions');
const miscFunctions = require('./misc-functions');
const events = require('./user-event-constants-backend.js')
const mandrillFunctions = require('./mandrill-functions.js');
const mailchimpFunctions = require('./mailchimp-functions.js');
const {checkPhone, checkEmail, checkAdmin} = require('./express-middlewares.js');

global.app.get('/getPhoneInfo', checkPhone, async (req, res) => {
  const phone = req.query.phone
  const phoneInfo = await supabase.getPhoneInfo(phone)  
  
  res.send(phoneInfo)  
})

global.app.get('/getConfigurationByEmail', checkEmail, async (req, res) => {
  const email = req.query.email
  const result = await supabase.getConfigurationByEmail(email)        
  
  res.send(result)  
})

global.app.get('/getModeId', async (req, res) => {  
  const modeDescription = req.query.modeDescription
  const modeId = await supabase.getModeIdFromDescription(modeDescription)
  
  res.send(modeId)
})

global.app.get('/getModeDescription', async (req, res) => {
  const modeId = req.query.modeId
  const modeDescription = await supabase.getModeDescriptionFromId(modeId)
  
  res.send(modeDescription)  
})

global.app.get('/getContactException', checkPhone, async (req, res) => {
  const phone = req.query.phone
  const contactPhone = req.query.contactPhone
  const exception = await supabase.getSendingExceptionFull(phone, contactPhone)
  
  res.send(exception)  
})

global.app.get('/getGroupException', checkPhone, async (req, res) => {
  const phone = req.query.phone
  const WAGroupId = req.query.WAGroupId
  const exception = await supabase.getSendingExceptionGroupsFull(phone, WAGroupId)
  
  res.send(exception)  
})

global.app.get('/insertContactException', checkPhone, async (req, res) => {
  const phone = req.query.phone
  const contactPhone = req.query.contactPhone
  const mode = req.query.mode
  const alias = req.query.alias
  
  const configuration = await supabase.getConfiguration(phone)
  const sessionEmail = req.session.userProfile.emails[0].value
  // If logged in user is an admin looking at another user config, skip log saving.
  if (sessionEmail === configuration.email) {
    await supabase.insertUserLog(configuration.email, events.EVENT_CREATE_CONTACT_EXCEPTION_WEB, null, req.query.browserLanguage, req.query.platform, req.query.isMobile, contactPhone, mode)
  }
  
  const result = await supabase.insertContactException(phone,contactPhone,mode,alias)
  if (result.error) {
    return res.status(400).send({ message: result.error });
  }
  res.send(result)  
})

global.app.get('/updateContactException', checkPhone, async (req, res) => {
  const id = req.query.id
  const phone = req.query.phone
  const contactPhone = req.query.contactPhone
  const mode = req.query.mode
  const alias = req.query.alias
  const configuration = await supabase.getConfiguration(phone)
  const result = await supabase.updateContactException(id,phone,contactPhone,mode,alias)

  const sessionEmail = req.session.userProfile.emails[0].value
  // If logged in user is an admin looking at another user config, skip log saving.
  if (sessionEmail === configuration.email) {
    await supabase.insertUserLog(configuration.email, events.EVENT_UPDATE_CONTACT_EXCEPTION_WEB, null, req.query.browserLanguage, req.query.platform, req.query.isMobile, contactPhone, mode)
  }
  res.send(result)  
})

global.app.get('/deleteContactException', checkPhone, async (req, res) => {
  const id = req.query.id
  const phone = req.query.phone
  if (!id || !phone) {
    return res.status(400).send({ error: "No id or phone provided" });
  }
  const exception = await supabase.getContactException(id)
  const configuration = await supabase.getConfiguration(phone)
  const result = await supabase.deleteContactException(id, phone)

  const sessionEmail = req.session.userProfile.emails[0].value
  // If logged in user is an admin looking at another user config, skip log saving.
  if (sessionEmail === configuration.email && exception) {
    await supabase.insertUserLog(configuration.email, events.EVENT_DELETE_CONTACT_EXCEPTION_WEB, null, req.query.browserLanguage, req.query.platform, req.query.isMobile, exception.contact_phone, exception.mode_for_contact)
  }
  res.send(result)  
})

global.app.get('/insertGroupException', checkPhone, async (req, res) => {
  const phone = req.query.phone
  const WAGroupId = req.query.WAGroupId
  const mode = req.query.mode
  const groupAlias = req.query.groupAlias
  
  const configuration = await supabase.getConfiguration(phone)
  const sessionEmail = req.session.userProfile.emails[0].value
  // If logged in user is an admin looking at another user config, skip log saving.
  if (sessionEmail === configuration.email) {
    await supabase.insertUserLog(configuration.email, events.EVENT_CREATE_GROUP_EXCEPTION_WEB, null, req.query.browserLanguage, req.query.platform, req.query.isMobile, WAGroupId, mode)
  }

  const result = await supabase.insertGroupException(phone,WAGroupId,mode,groupAlias)
  if (result.error) {
    return res.status(400).send({ message: result.error });
  }
  res.send(result)    
})

global.app.get('/updateGroupException', checkPhone, async (req, res) => {
  const id = req.query.id
  const phone = req.query.phone
  const WAGroupId = req.query.WAGroupId
  const mode = req.query.mode
  const groupAlias = req.query.groupAlias
  const configuration = await supabase.getConfiguration(phone)
  const result = await supabase.updateGroupException(id,phone,WAGroupId,mode,groupAlias)

  const sessionEmail = req.session.userProfile.emails[0].value
  // If logged in user is an admin looking at another user config, skip log saving.
  if (sessionEmail === configuration.email) {
    await supabase.insertUserLog(configuration.email, events.EVENT_UPDATE_GROUP_EXCEPTION_WEB, null, req.query.browserLanguage, req.query.platform, req.query.isMobile, WAGroupId, mode)
  }
  res.send(result)  
})

global.app.get('/deleteGroupException', checkPhone, async (req, res) => {
  const id = req.query.id
  const phone = req.query.phone
  if (!id || !phone) {
    return res.status(400).send({ error: "No id or phone provided" });
  }
  const exception = await supabase.getGroupException(id)
  const configuration = await supabase.getConfiguration(phone)
  const result = await supabase.deleteGroupException(id, phone)

  const sessionEmail = req.session.userProfile.emails[0].value
  // If logged in user is an admin looking at another user config, skip log saving.
  if (sessionEmail === configuration.email && exception) {
    await supabase.insertUserLog(configuration.email, events.EVENT_DELETE_GROUP_EXCEPTION_WEB, null, req.query.browserLanguage, req.query.platform, req.query.isMobile, exception.group_id, exception.mode_for_group)
  }
  res.send(result)  
})

global.app.get('/updateUserGeneralConfiguration', checkPhone, async (req, res) => {
  const phone = req.query.phone
  const contactMode = req.query.contactMode
  const groupMode = req.query.groupMode
  const transcribeOutgoingMessages = req.query.transcribeOutgoingMessages
  const summarizeMessages = req.query.summarizeMessages
  const configuration = await supabase.getConfiguration(phone)
  const result = await supabase.updateUserGeneralConfiguration(phone,contactMode,groupMode,transcribeOutgoingMessages,summarizeMessages)

  const sessionEmail = req.session.userProfile.emails[0].value
  // If logged in user is an admin looking at another user config, skip log saving.
  if (sessionEmail === configuration.email) {
    let newDescription = ''

    if (configuration.general_mode !== contactMode) {
      newDescription += `Changed general_mode from ${configuration.general_mode} to ${contactMode}. `;
    }
    if (configuration.general_mode_groups !== groupMode) {
      newDescription += `Changed groupMode from ${configuration.general_mode_groups} to ${groupMode}. `;
    }
    if (configuration.transcribe_outgoing_messages.toString() !== transcribeOutgoingMessages) {
      newDescription += `Changed transcribe_outgoing_messages from ${configuration.transcribe_outgoing_messages} to ${transcribeOutgoingMessages}. `;
    }
    if (configuration.summarize_messages.toString() !== summarizeMessages) {
      newDescription += `Changed summarize_messages from ${configuration.summarize_messages} to ${summarizeMessages}. `;
    }
    if (newDescription) {
      await supabase.insertUserLog(configuration.email, events.EVENT_GENERAL_CONFIGURATION_CHANGE, newDescription, req.query.browserLanguage, req.query.platform, req.query.isMobile, null, null)
    }
  }
  res.send(result)  
})

global.app.get('/updateUserSummaryConfiguration', checkPhone, async (req, res) => {
  const phone = req.query.phone
  const summarizeMessages = req.query.summarizeMessages
  const minSeconds = req.query.minSeconds
  const minWords = req.query.minWords
  const useBullets = req.query.useBullets
  const fullText = req.query.fullText
  const configuration = await supabase.getConfiguration(phone)
  const result = await supabase.updateUserSummaryConfiguration(phone,summarizeMessages,minSeconds,minWords,useBullets,fullText)

  const sessionEmail = req.session.userProfile.emails[0].value
  // If logged in user is an admin looking at another user config, skip log saving.
  if (sessionEmail === configuration.email) {
    let newDescription = ''

    if (configuration.summarize_messages !== summarizeMessages) {
      newDescription += `Changed summarize_messages from ${configuration.summarize_messages} to ${summarizeMessages}. `;
    }
    if (configuration.summary_minimum_seconds !== minSeconds) {
      newDescription += `Changed summary_minimum_seconds from ${configuration.summary_minimum_seconds} to ${minSeconds}. `;
    }
    if (configuration.summary_minimum_words !== minWords) {
      newDescription += `Changed summary_minimum_words from ${configuration.summary_minimum_words} to ${minWords}. `;
    }
    if (configuration.summary_use_bullets !== useBullets) {
      newDescription += `Changed summary_use_bullets from ${configuration.summary_use_bullets} to ${useBullets}. `;
    }
    if (configuration.summary_include_full_text !== fullText) {
      newDescription += `Changed summary_include_full_text from ${configuration.summary_include_full_text} to ${fullText}. `;
    }
    if (newDescription) {
      await supabase.insertUserLog(configuration.email, events.EVENT_GENERAL_CONFIGURATION_CHANGE, newDescription, req.query.browserLanguage, req.query.platform, req.query.isMobile, null, null)
    }
  }
  res.send(result)  
})

global.app.get('/updatePauseTranscriptions', checkEmail, async (req, res) => {
  const email = req.query.email
  const newState = req.query.newState
  
  const result = await supabase.updateUserPauseTranscriptions(email,newState)
  res.send(result)  
})

// The checkEmail middleware is not used, because for new users who do
// not have a record in the supabase database yet, an error would be generated.
global.app.get('/getCurrentQRCode', async (req, res) => {
  const email = req.query.email
  const QRCodeConfig = await supabase.getCurrentQRCode(email)
  res.send(QRCodeConfig)
})

// The checkEmail middleware is not used, because for new users who do
// not have a record in the supabase database yet, an error would be generated.
global.app.get('/setQRCodeDisconnected', async (req, res) => {
  const email = req.query.email
  const result = await supabase.setQRCodeState(email,"DISCONNECTED")
  
  res.send(result)  
})

global.app.get('/getConnectedUsers', checkAdmin, async (req, res) => {  
  let connectedUsers
  let folderUsers
  const users = await supabase.getUsers()  
  try {
    folderUsers = await baileysFunctions.getFolderUsers();
  } catch (error) {
    folderUsers = undefined
    console.log('Error in /getFolderUsers. unable to get users with a folder in .baileys', error)
  }
  
  if (folderUsers) {    
    connectedUsers = users.filter(user => folderUsers.includes(miscFunctions.encodeEmail(user.email)));
  } else {
    connectedUsers = []
  }
  res.send(connectedUsers)  
})

global.app.get('/getDisconnectedUsers', checkAdmin, async (req, res) => {  
  const disconnectedUsers = await supabase.getDisconnectedUsers()
  res.send(disconnectedUsers)  
})

global.app.get('/insertUserEventLog', checkEmail, async (req, res) => {
  const email = req.query.email
  const event = req.query.event
  const description = req.query.description

  const sessionEmail = req.session.userProfile.emails[0].value
  // If logged in user is an admin looking at another user config, skip log saving.
  if (sessionEmail === email) {
    const result = await supabase.insertUserLog(email, event, description, req.query.browserLanguage, req.query.platform, req.query.isMobile)
    res.send(result)
  } else {
    res.status(200).send({ message: 'The log was not inserted because the user is an administrator.' });
  }
})

global.app.get('/getUserEventLogsByEmail', checkAdmin, async (req, res) => {
  const email = req.query.email
  const result = await supabase.getUserEventLogsByEmail(email)        
  
  res.send(result)  
})

global.app.get('/registerUserTryingToConnect', async (req, res) => {
  const googleUserProfile = req.session.userProfile
  const browser_language = req.query.browser_language
  const platform = req.query.platform
  const is_mobile = req.query.is_mobile
  const country = req.query.country
  const region = req.query.region

  const result = await supabase.insertUserConnectionEventLog(googleUserProfile, browser_language, platform, is_mobile, country, region)
  await mailchimpFunctions.addToMailchimpAudience(googleUserProfile.emails[0].value, googleUserProfile.name.givenName, googleUserProfile.name.familyName, browser_language)
  res.send(result)
})

global.app.get('/getInformationFromIP', async (req, res) => {
  try {
      // Get the user's IP from the request
      let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

      // In case there are multiple IPs (x-forwarded-for can have a list), we take the first one
      if (ip.includes(',')) {
          ip = ip.split(',')[0];
      }

      // Clear local IPv6 (::ffff:) if necessary
      ip = ip.replace('::ffff:', '');

      // If the IP is a loopback (localhost), omit the IP in the request to ipinfo.io
      let ipInfoUrl = (ip === '::1' || ip === '127.0.0.1')
      ? `https://ipinfo.io/json?token=${process.env.TOKEN_IPINFO}`
      : `https://ipinfo.io/${ip}/json?token=${process.env.TOKEN_IPINFO}`;

      // Get the IP information using the token on the server
      const response = await fetch(ipInfoUrl);
      const ipInfo = await response.json();

      // Create the object with the user information
      let userInfoIP = {
        country: ipInfo.country,
        region: ipInfo.region
      };

      res.json(userInfoIP);
  } catch (error) {
      console.error('Error getting information from IP:', error);
      res.status(500).send('Error getting information from IP');
  }
});

global.app.get('/insertWaitlistUser', async (req, res) => {
  const googleUserProfile = req.session.userProfile
  const browser_language = req.query.browser_language
  const platform = req.query.platform
  const is_mobile = req.query.is_mobile
  const country = req.query.country
  const region = req.query.region

  const result = await supabase.insertWaitlistUser(googleUserProfile, browser_language, platform, is_mobile, country, region)
  res.send(result)
})

global.app.get('/sendMobileConnectionEmail', async (req, res) => {
  const googleUserProfile = req.session.userProfile
  const browser_language = req.query.browser_language

  const result = await mandrillFunctions.sendMobileConnectionEmail(googleUserProfile.emails[0].value, googleUserProfile.name.givenName, browser_language)
  res.send(result)
})

global.app.get('/userPostConnect', checkEmail, async (req, res) => {
  const email = req.query.email
  const browserLanguage = req.query.language.toUpperCase()
  let userlanguage

  const i18n = new I18nManager();
  const availableLanguages = i18n.getAvailableLanguages();
  if (availableLanguages.includes(browserLanguage.toLowerCase())) {
    userlanguage = browserLanguage;
  } else {
    userlanguage = 'EN'
  }
  const result = await supabase.updateUserLanguage(email,userlanguage, browserLanguage)
  // Check if the user has scanned the QR code only once because we need to send the email only the first time a user connects, not for reconnections.
  const countScanQrCodeEvents = await supabase.getCountScanQrCodeEvents(email)
  if (countScanQrCodeEvents === 1) {
    await mandrillFunctions.sendNewUserEmail(email)
  }
  res.send(result)  
})