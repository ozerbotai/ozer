const path = require('path')
const fs = require('fs');
const {connectWhatsapp, disconnectWhatsapp} = require('./whatsappinteraction.js');
const  { jidDecode, isJidUser, isJidGroup }  = require('@ozerbotai/baileys')
const I18nManager = require('./i18n-manager');
const supabase = require('./supabase.js');
const baileysFunctions = require('./baileys-functions');
const miscFunctions = require('./misc-functions');
const events = require('./user-event-constants-backend.js')
const mandrillFunctions = require('./mandrill-functions.js');
const {checkAuthenticated, checkEmail} = require('./express-middlewares.js');
require('dotenv').config({ path: '.env.local' })

exports.setBaileysEndpoints = function (app, connectedPhones) {

  app.get('/getPhoneContacts', checkEmail, async (req, res) => {
    try {
      const email = req.query.email
      const connectedPhoneObjects = connectedPhones.get(email)
      if (connectedPhoneObjects) {
        const baileysContacts = await connectedPhoneObjects.store.contacts
        let list = {contacts: [], groups: []}      
        for (let id in baileysContacts) {
          chat = {
            id: jidDecode(id).user,
            name: baileysContacts[id]?.name
          }
          // Make sure contact or group have a name
          if (chat.name) {
            if (isJidUser(id)) {
              list.contacts.push(chat)
            } else {
              // do nothing, ignore groups, "@lid", "@@broadcast" and other types of chats
            }  
          }
        }
        const baileysChats = await connectedPhoneObjects.store.chats.all()
        for (let i in baileysChats) {
          chat = {
            id: jidDecode(baileysChats[i].id).user,
            name: baileysChats[i].name
          }
          // Make sure contact or group have a name
          if (chat.name) {
            if (isJidGroup(baileysChats[i].id)) {
              list.groups.push(chat)              
            } else {
              // do nothing, ignore normal contacts, "@lid", "@@broadcast" and other types of chats
            }
          }
        }
        res.send(list)
      } else {
        console.log('/getPhoneContacts: The email ' + email + ' is not registered. No contact or group list.')
        res.send({})
      }
    } catch(error) {
      console.log('error in "/getPhoneContacts". ', error)
      res.send({})
    }
  })
      
  app.get('/connectPhone', checkAuthenticated, async (req, res) => {
    const i18n = new I18nManager();
    let email = req.session.userProfile.emails[0].value
        
    // Remove users baileys directory if it already exists
    let baileysEmailPath = baileysFunctions.getBaileysEmailPath(email);
    let baileysEmailPathExists = fs.existsSync(baileysEmailPath);
    if (baileysEmailPathExists) {
      disconnectWhatsapp(connectedPhones, email, true, true);
    }

    let isFirstQrCode = true;
    let isFirstConnectionOpen = true;

    // Connect the phone
    await connectWhatsapp({email, connectedPhones, 
      processQrReceived: async (qr) => {
        // TODO: Received qr code seems to be missing a ",1" at the end compared to whatsapp-web.js
        qr = qr + ",1" 
        supabase.refreshCurrentQRCode(email, qr)
        if (isFirstQrCode) {
          isFirstQrCode = false;
          res.send({code: 300, message: qr});
        }
        if (!isFirstConnectionOpen) {
          console.warn('QR received after the phone was connected, removing user', email);
          await supabase.insertUserLog(email, events.EVENT_WHATSAPP_DISCONNECT, 'QR received after the phone was connected');
          disconnectWhatsapp(connectedPhones, email, true, true);
          mandrillFunctions.sendWhatsappDisconnectedEmail(email)
        }
      },
      processIsNewLogin: async () => {
        await supabase.setQRCodeState(email,"CONNECTING");
      }, 
      processConnectionOpen: async (sock) => {
        if (isFirstConnectionOpen) {
          isFirstConnectionOpen = false;
          // Get phone number from the baileys socket
          const phone = jidDecode(sock.user.id).user
          const userConfigByPhone = await supabase.getConfiguration(phone)
          const userConfigByEmail = await supabase.getConfigurationByEmail(email)
          if (!userConfigByPhone && !userConfigByEmail) {
            // Both the phone and email don't exist in db. Welcome new user ! Add it to the database.
            await supabase.insertUserInDatabase(phone, req.session.userProfile)
            await supabase.setQRCodeState(email, "CONNECTED")                
            await supabase.insertUserLog(email, events.EVENT_SCAN_QR_CODE, 'New user connected');
            console.log('New user connected:', email);
          } else if (userConfigByPhone && userConfigByEmail && userConfigByPhone.email.toLowerCase() === email.toLowerCase()) {                
            // The phone is already in the database, and is registered with the same email as the logged user's email. Welcome back existing user!
            if (userConfigByPhone.login_platform_id === null || userConfigByPhone.login_platform_id === '') {
              // It's a user that exists in db, but had never logged in before. Save google data in db (original Beta tester)
              await supabase.updateUserInDatabase(phone, req.session.userProfile)
            }
            await supabase.setQRCodeState(email, "CONNECTED")
            await supabase.insertUserLog(email, events.EVENT_SCAN_QR_CODE, 'Existing user reconnects');
            console.log('Existing user reconnects:', email);
          } else {
            // 3 different cases to abort: 
            // 1) The phone is already in the database, and the email is in the database but in different rows.
            // 2) The phone is in the database but asociated to another email.
            // 3) The phone is not in the database, but the email is in the database asociated to another phone
            await supabase.setQRCodeState(email,"PHONE_EMAIL_CONFLICT")
            await supabase.insertUserLog(email, events.EVENT_SCAN_QR_CODE, `User tried to connect to another user's phone`);
            disconnectWhatsapp(connectedPhones, email, true, true);
            console.log('Phone/Email conflict:', email);
          }
        }
      } 
    });
  })

  app.get('/disconnectPhone', checkEmail, async (req, res) => {  
    let email = req.query.email; // TODO: Ensure this comes from a trusted source to avoid security risks
    console.log('User requested phone disconnect', email);
    try {
      disconnectWhatsapp(connectedPhones, email, true, true);
      await supabase.insertUserLog(email, events.EVENT_RECONNECT_REQUEST, null);
      console.log('Disconnection completed.', email);
      res.send(true);
    } catch(error) {
      console.log('error in /disconnectPhone: ', error)
      res.send(false);
    }
  })
}

exports.restoreExistingUsers = async function (connectedPhones) {
  let basePath = baileysFunctions.getBaileysBasePath();
  if (fs.existsSync(basePath)) {
    fs.readdir(basePath, (err, files) => {
      if (err) {
        console.error('Error reading directory:', err);
        return;
      }
      files.forEach(async (file) => {
        var delay;
        if (process.env.IMMEDIATE_CONNECT === 'YES') {
          delay = 0;
        } else {
          delay = Math.floor(Math.random() * Number(process.env.RESTORE_DURATION));
        }
  
        setTimeout(async () => {
          const directoryPath = path.join(basePath, file);
          if (fs.lstatSync(directoryPath).isDirectory()) {
            console.log('Loading user:', directoryPath);
            let email = miscFunctions.decodeEmail(file.replace('user-', ''));
  
            // Connect the phone
            await connectWhatsapp({ email, connectedPhones, 
              processQrReceived: async (qr) => {
                console.warn('QR received while restoring a session, removing user', email);
                await supabase.insertUserLog(email, events.EVENT_WHATSAPP_DISCONNECT, 'QR received while restoring a session');
                disconnectWhatsapp(connectedPhones, email, true, true);
                mandrillFunctions.sendWhatsappDisconnectedEmail(email)
              },
              processIsNewLogin: async () => {
              }, 
              processConnectionOpen: async (sock) => {
              } 
            });
          }
        }, delay);
      });
    });  
  }
}

// Remove old messages from the store
exports.deleteOldMessages = function (connectedPhones) {
  connectedPhones.forEach((connectedPhoneObjects, email) => {    
    connectedPhoneObjects.store?.removeOldMessages()
  });
}
