const { Boom } = require('@hapi/boom')
const NodeCache = require('node-cache')
const makeWASocket = require('@ozerbotai/baileys').default
const  { AnyMessageContent, delay, DisconnectReason, fetchLatestBaileysVersion, getAggregateVotesInPollMessage, 
        makeCacheableSignalKeyStore, makeInMemoryStore, PHONENUMBER_MCC, proto, useMultiFileAuthState, WAMessageContent, WAMessageKey, downloadMediaMessage, 
        jidDecode, isJidUser, isJidGroup, isJidBroadcast, isJidNewsletter }  = require('@ozerbotai/baileys')
const logger = require('pino')()

const fs = require('fs');
require('dotenv').config({ path: '.env.local' })
const recognizeSpeech = require('./transcription.js');
const msgSendingLogic = require('./msg-sending-logic.js');
const languageSelectionLogic = require('./language-selection-logic.js');
const summarizeMessage = require('./summarize-message.js');
const services = require('./services.js');
const supabase = require('./supabase.js');
const miscFunctions = require('./misc-functions.js');
const I18nManager = require('./i18n-manager');
const constants = require('./constants.js');
const baileysFunctions = require('./baileys-functions');
const chatGptQueryGeneration = require('./chatgpt-query-generation')
const logEvents = require('./user-event-constants-backend.js')
const mandrillFunctions = require('./mandrill-functions.js');
const crypto = require('crypto');

logger.level = 'warn'

async function connectWhatsapp({email, connectedPhones, processQrReceived, processIsNewLogin, processConnectionOpen}) {
    console.log('Connecting user with email: ', email);

    // external map to store retry counts of messages when decryption/encryption fails
    // keep this out of the socket itself, so as to prevent a message decryption/encryption loop across socket restarts
    const msgRetryCounterCache = new NodeCache()

    // the store maintains the data of the WA connection in memory
    // can be written out to a file & read from it
    const store = makeInMemoryStore({loger: logger, messageRetentionPeriod: process.env.BAILEYS_STORE_MESSAGE_RETENTION_PERIOD})
    store?.readFromFile(baileysFunctions.getBaileysEmailPath(email) + '/baileys_store_multi.json')
    getSetConnectedPhoneObjects(connectedPhones, email).store = store;
    
    // save every N milliseconds the store to a file
    var storeWriteInterval = setInterval(() => {
        store?.writeToFile(baileysFunctions.getBaileysEmailPath(email) + '/baileys_store_multi.json')
    }, Number(process.env.BAILEYS_STORE_WRITE_INTERVAL));
    getSetConnectedPhoneObjects(connectedPhones, email).storeWriteInterval = storeWriteInterval;

    const doConnectWhatsapp = async() => {
        const { state, saveCreds } = await useMultiFileAuthState(baileysFunctions.getBaileysEmailPath(email) + '/baileys_auth_info')
        // fetch latest version of WA Web
        const { version, isLatest } = await fetchLatestBaileysVersion()
        console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`, email)
    
        const sock = makeWASocket({
            version,
            browser: ['Ozer', 'Custom', '1.0.0'],
            logger,
            printQRInTerminal: false,
            mobile: false,
            auth: {
                creds: state.creds,
                /** caching makes the store faster to send/recv messages */
                keys: makeCacheableSignalKeyStore(state.keys, logger),
            },
            msgRetryCounterCache,
            generateHighQualityLinkPreview: true,
            // ignore broadcast and newsletter messages
            shouldIgnoreJid: jid => !jid || isJidBroadcast(jid) || isJidNewsletter(jid),
            // implement to handle retries & poll updates
            getMessage,
            shouldSyncHistoryMessage: () => true,
            markOnlineOnConnect: false
        })
    
        async function getMessage(key)  {
            if(store) {
                const msg = await store.loadMessage(key.remoteJid, key.id)
                return msg?.message || undefined
            }
            // only if store is present
            return proto.Message.fromObject({})
        }

        setConnectedPhoneObjectsSock(connectedPhones, email, sock);
    
        store?.bind(sock.ev)
    
        // the process function lets you process all events that just occurred
        // efficiently in a batch
        let processListenerRemover = sock.ev.process(
            // events is a map for event name => event data
            async(events) => {
                // something about the connection changed
                // maybe it closed, or we received all offline message or connection opened
                if(events['connection.update']) {
                    const update = events['connection.update']
                    const { connection, lastDisconnect} = update
                    if (connection === 'connecting') {        
                        console.log('connection.update connecting', email);
                    } else if (update.qr) {
                        console.log('QR RECEIVED', email, update.qr.substring(0, 20) + '...');
                        await processQrReceived(update.qr);
                    } else if (update.isNewLogin) {        
                        console.log('connection.update isNewLogin', email);
                        await processIsNewLogin();
                    } else if(connection === 'close') {
                        if(lastDisconnect?.error?.output?.statusCode == DisconnectReason.timedOut && 
                           lastDisconnect?.error?.output?.payload?.message == 'QR refs attempts ended') {
                          console.log('Max number of QRs received, removing user', email);
                          supabase.setQRCodeState(email,"TIMEOUT")
                          await supabase.insertUserLog(email, logEvents.EVENT_MAX_QR_RECEIVED, 'Max number of QRs received');
                          disconnectWhatsapp(connectedPhones, email, true, true);
                        } else if(lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                            // reconnect if not logged out
                            console.log('Connection closed, but not lost. Reconnecting user...', email, update)
                            console.warn('lastDisconnect?.error?.output')
                            console.warn(lastDisconnect?.error?.output)
                            console.warn('lastDisconnect?.error?.data')
                            console.warn(lastDisconnect?.error?.data)
                            // Tear down stale objects. Store related objects are kept.
                            disconnectWhatsapp(connectedPhones, email, false, false);
                            doConnectWhatsapp();
                        } else {
                            console.warn('Connection closed. User logged out, removing user.', update, email)
                            await supabase.insertUserLog(email, logEvents.EVENT_WHATSAPP_DISCONNECT, 'User logged out');
                            disconnectWhatsapp(connectedPhones, email, true, true);
                            mandrillFunctions.sendWhatsappDisconnectedEmail(email)
                        }                
                    } else if (update.connection === 'open') {        
                        console.log('connection.update open', email);        
                        await processConnectionOpen(sock);
                    } else if (update.isOnline || update.isOnline === false) {        
                        console.log('connection.update isOnline', update.isOnline, email);
                    } else if (update.receivedPendingNotifications) {        
                        console.log('connection.update receivedPendingNotifications', email);
                    } else {
                        console.log('connection.update untracked event', email, update);
                    }                             
                }
    
                // credentials updated -- save them
                if(events['creds.update']) {
                    await saveCreds()
                }
    
                if(events['messages.upsert']) {
                    const upsert = events['messages.upsert']
                    if(upsert.type === 'notify') {
                        const userConfig = await supabase.getConfigurationByEmail(email)
                        //Double check if user is inserted in the database to prevent race conditions
                        if (userConfig) {
                            const phone = userConfig.user_phone
                            for(const msg of upsert.messages) {
                                processAudioMessages(sock, store, phone, msg);
                                summarizeLongTextMessages(sock, store, phone, msg);
                                processTextMessagesToGuessChatLanguage(sock, store, phone, msg);
                                processPingMessages(sock, store, phone, msg);
                                processTranscribeCommands(sock, store, phone, msg);                     
                                processForgetLanguageCommand(sock, store, phone, msg);
                                processGPTCommand(sock, store, phone, msg);
                            }
                        }
                    }
                }                
            }
        )        
        setConnectedPhoneObjectsProcessListenerRemover(connectedPhones, email, processListenerRemover);
    }
    await doConnectWhatsapp();
}

async function processAudioMessages(sock, store, phone, msg){
    try {
        let audio 
        let transcribedAudio
        let sendingTargets
        let groupId
        let contactPhone
        let i18n

        if (msg.message?.audioMessage) {
            const userConfig = await supabase.getConfiguration(phone)       
            //If transcriptions are paused, do not do anything
            if (userConfig.transcriptions_paused) {
                return;
            }
            //If message is from me and outgoing transcriptions is off, then leave. 
            if (msg.key.fromMe && !userConfig.transcribe_outgoing_messages) {
                return;
            }

            if (isJidGroup(msg.key.remoteJid)) {
                // msg belongs to a group
                contactPhone='';
                //Takes only the group number. E.g: takes "120363264972910743" from "120363264972910743@g.us"
                groupId = jidDecode(msg.key.remoteJid).user
                //Function sendingTargets returns an object with attributes "private" and "respond"            
                sendingTargets = await msgSendingLogic.decideSendingTargetsGroups(phone, groupId, msg.key.fromMe);
                const groupMetadata = await store.fetchGroupMetadata(msg.key.remoteJid, sock);
                if (groupMetadata.announce || groupMetadata.isCommunityAnnounce) {
                    // Group is announcement or only admins can write, don't transcribe the audio
                    // TODO: if I am one of the group admins, allow transcriptions.
                    return;
                }
            } else if (isJidUser(msg.key.remoteJid)) {
                // msg belongs to a contact
                groupId = '';
                //Takes only the phone number. E.g: takes "5491144394488" from "5491144394488@c.us"
                contactPhone = jidDecode(msg.key.remoteJid).user 
                //Function sendingTargets returns an object with attributes "private" and "respond"            
                sendingTargets = await msgSendingLogic.decideSendingTargets(phone, contactPhone, msg.key.fromMe);
            } else {
                console.log('Audio message does not belong to a group or a contact', phone, msg);
                return;
            }
            const fileSha256 = btoa(String.fromCharCode.apply(null, msg.message.audioMessage.fileSha256));
            const mediaKey = btoa(String.fromCharCode.apply(null, msg.message.audioMessage.mediaKey));
            //The next function does the following:
            // 1) Locks table transcription_log so no other process can access it.
            // 2) Checks if a log was already generated for that media file in that gruoup/chat
            // 3) If log was not created, create it
            // 4) Return "true" if log was created and false if it wasn't
            const logCreated = await supabase.createAndLockTranscriptionLog(phone, isJidGroup(msg.key.remoteJid), groupId, contactPhone, fileSha256, 
                msg.message.audioMessage.seconds, mediaKey, parseInt(msg.message.audioMessage.fileLength), 'unknown_device_type', 
                msg.key.fromMe ? 'SENT' : 'RECEIVED', sendingTargets.private, sendingTargets.respond)
            if (!logCreated) {
                //If the audio file has already been transcripted in the same chat, it does not transcribe it again.
                return
            }

            if (sendingTargets.private || sendingTargets.respond) {
                //If audio messages is longer than MAX_SECONDS_FOR_AUDIO_TRANSCRIPTION, does not transcribe
                if (msg.message.audioMessage.seconds / 60 <= constants.MAX_MINUTES_FOR_AUDIO_TRANSCRIPTION ) {
                    const audioBuffer = await downloadMediaMessage(
                        msg,
                        'buffer',
                        { },
                        {
                            logger,
                            // pass this so that baileys can request a reupload of media
                            // that has been deleted
                            reuploadRequest: sock.updateMediaMessage
                        }
                    )
                    //Gets the language of the chat before de transcription. In transcribedAudio parameter I send and empty string to it doesn't not take that into account
                    const languageBeforeTranscription = await languageSelectionLogic.getSetChatLanguage(phone, isJidGroup(msg.key.remoteJid), groupId, contactPhone, '', false) //isMessageForwarded parameter is irrelevant here
                    transcribedAudio = await recognizeSpeech(audioBuffer, languageBeforeTranscription, phone, msg);
                    const messageIsForwarded = baileysFunctions.getMsgIsForwarded(msg)
                    language = await languageSelectionLogic.getSetChatLanguage(phone, isJidGroup(msg.key.remoteJid), groupId, contactPhone, transcribedAudio, messageIsForwarded)
                    i18n = new I18nManager();
                    i18n.setLanguage(language)
                } else {
                    // This code is executed if message is longer than constants.MAX_SECONDS_FOR_AUDIO_TRANSCRIPTION
                    language = await languageSelectionLogic.getSetChatLanguage(phone, isJidGroup(msg.key.remoteJid), groupId, contactPhone, '', false) //isMessageForwarded parameter is irrelevant here
                    i18n = new I18nManager();
                    i18n.setLanguage(language)
                    transcribedAudio = `${i18n.get('AUDIO_IS_LONGER_THAN_MAX')} ${constants.MAX_MINUTES_FOR_AUDIO_TRANSCRIPTION} ${i18n.get('MINUTES')}`
                }
                let messageSummary;
                if (userConfig.summarize_messages) {
                    if (msg.message.audioMessage.seconds >= userConfig.summary_minimum_seconds) {
                        messageSummary = await summarizeMessage.summarizeMessage(transcribedAudio, userConfig.summary_use_bullets, userConfig.summary_length, msg.message.audioMessage.seconds, 0)
                    }
                }    
                if (sendingTargets.private) {
                    const contact = isJidGroup(msg.key.remoteJid) ? msg.key.participant : msg.key.remoteJid;
                    const contactNumber = jidDecode(contact).user;
                    let message
                    if (messageSummary) {
                        //If summary is active for this message
                        if (isJidGroup(msg.key.remoteJid)) {
                            // msg belongs to a group
                            let groupName = store.chats.get(msg.key.remoteJid).name;
                            const fromGroupLabel = ` *${i18n.get('IN_THE_GROUP')} "${groupName}"*`
                            message = msg.key.fromMe ? 
                                            `*${i18n.get('AUDIO_SENT_BY_ME')}*${fromGroupLabel}\n\n*${i18n.get('SUMMARY')}:* ${messageSummary}\n\n*${i18n.get('COMPLETE_TEXT')}:* _${transcribedAudio}_`:
                                            `*${i18n.get('AUDIO_RECEIVED_FROM')}* @${contactNumber}${fromGroupLabel}\n\n*${i18n.get('SUMMARY')}:* ${messageSummary}\n\n*${i18n.get('COMPLETE_TEXT')}:* _${transcribedAudio}_`;
                        } else {
                            // msg belongs to a contact
                            message = msg.key.fromMe ? 
                                            `*${i18n.get('AUDIO_SENT_BY_ME')}*\n\n*${i18n.get('SUMMARY')}:* ${messageSummary}\n\n*${i18n.get('COMPLETE_TEXT')}:* _${transcribedAudio}_`:
                                            `*${i18n.get('AUDIO_RECEIVED_FROM')}* @${contactNumber}\n\n*${i18n.get('SUMMARY')}:* ${messageSummary}\n\n*${i18n.get('COMPLETE_TEXT')}:* _${transcribedAudio}_`;
                        }
                    } else {
                        //If summary is not active for this message
                        if (isJidGroup(msg.key.remoteJid)) {
                            // msg belongs to a group
                            let groupName = store.chats.get(msg.key.remoteJid).name;
                            const fromGroupLabel = ` *${i18n.get('IN_THE_GROUP')} "${groupName}"*`
                            message = msg.key.fromMe ? 
                                            `*${i18n.get('AUDIO_SENT_BY_ME')}*${fromGroupLabel}: _${transcribedAudio}_`:
                                            `*${i18n.get('AUDIO_RECEIVED_FROM')}* @${contactNumber}${fromGroupLabel}: _${transcribedAudio}_`;
                        } else {
                            // msg belongs to a contact
                            message = msg.key.fromMe ? 
                                            `*${i18n.get('AUDIO_SENT_BY_ME')}:* _${transcribedAudio}_`:
                                            `*${i18n.get('AUDIO_RECEIVED_FROM')}* @${contactNumber}: _${transcribedAudio}_`;
                        }
                    }
                    let transcriptionMsg = await sock.sendMessage(sock.user.id, { text: message, mentions: [contact], linkPreview: null })

                    // TODO: mark private chat as unread
                    // This is for whatsapp-web.js:
                    // const newChat = await newMsg.getChat();
                    // await newChat.markUnread();
                    // Failed attempt to mark the chat as unread using baileys:
                    // console.log('sock.user.id', sock.user.id)
                    // console.log('contact', contact)
                    // await sock.chatModify({ markRead: false, lastMessages: transcriptionMsg }, sock.user.id)
                    // Other failed attempts to mark the original chat as unread:
                    // await sock.chatModify({ markRead: false, lastMessages: [msg] }, contact)
                    // Failed attempts to mute the chat:
                    // await sock.chatModify({ mute: 8*60*60*1000 }, sock.user.id, [])
                    // await sock.chatModify({ mute: 8*60*60*1000 }, contact, [])                          
                }

                if (sendingTargets.respond) {
                    let msgText;
                    if (messageSummary) {
                        if (userConfig.summary_include_full_text) {
                            msgText = `*${i18n.get('MESSAGE_SUMMARY')}*:\n${messageSummary}\n\n*${i18n.get('COMPLETE_TEXT')}:* _${transcribedAudio}_`;
                        } else {
                            msgText = `*${i18n.get('MESSAGE_SUMMARY')}*:\n${messageSummary}`;
                        }
                    } else {
                        msgText = `*${i18n.get('TRANSCRIBED_AUDIO_MESSAGE')}*: _${transcribedAudio}_`;
                    }
                    await sock.sendMessage(msg.key.remoteJid, {text: msgText, linkPreview: null}, {quoted: msg});
                }
            }
        }
    } catch (e) {
        console.log ('Error processing incoming message', phone, msg, e)
    }                
}


async function summarizeLongTextMessages(sock, store, phone, msg){
    try {
        let sendingTargets
        let groupId
        let contactPhone
        let i18n = new I18nManager();

        const messageText = baileysFunctions.getMsgText(msg)
        const messageWords = miscFunctions.countWords(messageText)

        if (messageWords > constants.MIN_WORDS_FOR_TEXT_SUMMARY) {        
            const userConfig = await supabase.getConfiguration(phone)       
            //If transcriptions are paused, do not do anything
            if (userConfig.transcriptions_paused) {
                return;
            }
            //If message is from me and outgoing transcriptions is off, then leave. 
            if (msg.key.fromMe && !userConfig.transcribe_outgoing_messages) {
                return;
            }

            if (!userConfig.summarize_messages) {
                return;
            }

            if (messageWords < userConfig.summary_minimum_words) {
                return;
            }

            if (messageWords > constants.MAX_WORDS_FOR_TEXT_SUMMARY ) {
                return;
            }

            // Avoid summarizing a message sent by Ozer
            const ozerMessages = i18n.getAll('MESSAGE_SUMMARY').concat(i18n.getAll('TRANSCRIBED_AUDIO_MESSAGE'));
            const includedOzerMessages = ozerMessages.filter(ozerMessage => messageText.includes(ozerMessage));
            if (includedOzerMessages.length > 0) {
                return;
            }

            if (isJidGroup(msg.key.remoteJid)) {
                // msg belongs to a group
                contactPhone='';
                //Takes only the group number. E.g: takes "120363264972910743" from "120363264972910743@g.us"
                groupId = jidDecode(msg.key.remoteJid).user
                //Function sendingTargets returns an object with attributes "private" and "respond"            
                sendingTargets = await msgSendingLogic.decideSendingTargetsGroups(phone, groupId, msg.key.fromMe);
                const groupMetadata = await store.fetchGroupMetadata(msg.key.remoteJid, sock);
                if (groupMetadata.announce || groupMetadata.isCommunityAnnounce) {
                    // Group is announcement or only admins can write, don't transcribe the audio
                    // TODO: if I am one of the group admins, allow transcriptions.
                    return;
                }
            } else if (isJidUser(msg.key.remoteJid)) {
                // msg belongs to a contact
                groupId = '';
                //Takes only the phone number. E.g: takes "5491144394488" from "5491144394488@c.us"
                contactPhone = jidDecode(msg.key.remoteJid).user 
                //Function sendingTargets returns an object with attributes "private" and "respond"            
                sendingTargets = await msgSendingLogic.decideSendingTargets(phone, contactPhone, msg.key.fromMe);
            } else {
                console.log('Text message does not belong to a group or a contact', phone, msg);
                return;
            }
            const textSha256 = crypto.createHash('sha256').update(messageText).digest('hex');
            //The next function does the following:
            // 1) Locks table transcription_log so no other process can access it.
            // 2) Checks if a log was already generated for that media file in that gruoup/chat
            // 3) If log was not created, create it
            // 4) Return "true" if log was created and false if it wasn't
            const logCreated = await supabase.createAndLockTranscriptionLog(phone, isJidGroup(msg.key.remoteJid), groupId, contactPhone, textSha256, 
                0, '', messageWords, 'unknown_device_type', 
                msg.key.fromMe ? 'SENT' : 'RECEIVED', sendingTargets.private, sendingTargets.respond)
            if (!logCreated) {
                //If the audio file has already been transcripted in the same chat, it does not transcribe it again.
                return
            }

            if (sendingTargets.private || sendingTargets.respond) {
                const messageIsForwarded = baileysFunctions.getMsgIsForwarded(msg)
                language = await languageSelectionLogic.getSetChatLanguage(phone, isJidGroup(msg.key.remoteJid), groupId, contactPhone, messageText, messageIsForwarded)                
                i18n.setLanguage(language)

                let messageSummary = await summarizeMessage.summarizeMessage(messageText, userConfig.summary_use_bullets, userConfig.summary_length, 0, messageWords);
                if (sendingTargets.private) {
                    const contact = isJidGroup(msg.key.remoteJid) ? msg.key.participant : msg.key.remoteJid;
                    const contactNumber = jidDecode(contact).user;
                    let message
                    if (isJidGroup(msg.key.remoteJid)) {
                        // msg belongs to a group
                        let groupName = store.chats.get(msg.key.remoteJid).name;
                        const fromGroupLabel = ` *${i18n.get('IN_THE_GROUP')} "${groupName}"*`
                        message = msg.key.fromMe ? 
                                        `*${i18n.get('TEXT_SENT_BY_ME')}*${fromGroupLabel}. *${i18n.get('SUMMARY')}:* ${messageSummary}`:
                                        `*${i18n.get('TEXT_RECEIVED_FROM')}* @${contactNumber}${fromGroupLabel}. *${i18n.get('SUMMARY')}:* ${messageSummary}`;
                    } else {
                        // msg belongs to a contact
                        message = msg.key.fromMe ? 
                                        `*${i18n.get('TEXT_SENT_BY_ME')}*. *${i18n.get('SUMMARY')}:* ${messageSummary}`:
                                        `*${i18n.get('TEXT_RECEIVED_FROM')}* @${contactNumber}. *${i18n.get('SUMMARY')}:* ${messageSummary}`;
                    }
                    await sock.sendMessage(sock.user.id, { text: message, mentions: [contact], linkPreview: null })

                    // TODO: mark private chat as unread
                    // This is for whatsapp-web.js:
                    // const newChat = await newMsg.getChat();
                    // await newChat.markUnread();
                    // Failed attempt to mark the chat as unread using baileys:
                    // console.log('sock.user.id', sock.user.id)
                    // console.log('contact', contact)
                    // await sock.chatModify({ markRead: false, lastMessages: transcriptionMsg }, sock.user.id)
                    // Other failed attempts to mark the original chat as unread:
                    // await sock.chatModify({ markRead: false, lastMessages: [msg] }, contact)
                    // Failed attempts to mute the chat:
                    // await sock.chatModify({ mute: 8*60*60*1000 }, sock.user.id, [])
                    // await sock.chatModify({ mute: 8*60*60*1000 }, contact, [])                          
                }

                if (sendingTargets.respond) {
                    let message = `*${i18n.get('MESSAGE_SUMMARY')}*:\n${messageSummary}`;
                    await sock.sendMessage(msg.key.remoteJid, {text: message, linkPreview: null}, {quoted: msg});
                }

            }
        }
    } catch (e) {
        console.log ('Error processing incoming message', phone, msg, e)
    }                
}

async function processTextMessagesToGuessChatLanguage(sock, store, phone, msg){
    try {
        let groupId
        let contactPhone
        
        const messageIsForwarded = baileysFunctions.getMsgIsForwarded(msg)
        if (!messageIsForwarded) {
            const isGroup = isJidGroup(msg.key.remoteJid)    
            const messageText = baileysFunctions.getMsgText(msg)
            const words = miscFunctions.countWords(messageText)
            if (words > constants.MIN_WORDS_FOR_LANGUAGE_RECOGNITION) {
                //If message has more than 30 words and is not forwarded, try to guess the language            
                if (isGroup) {
                    contactPhone='';
                    groupId = jidDecode(msg.key.remoteJid).user            
                } else {                
                    groupId = '';                
                    contactPhone = jidDecode(msg.key.remoteJid).user
                }
                //If chat has not an assigned language, try to guess it using the message text
                await languageSelectionLogic.getSetChatLanguage(phone, isGroup, groupId, contactPhone, messageText, messageIsForwarded)
            }
        }
    } catch (e) {
        console.log ('Error processing incoming message', phone, msg, e)
    }
}

async function processPingMessages(sock, store, phone, msg) {
    try {
        if (!msg.key.fromMe) {
            if (baileysFunctions.getMsgText(msg).toLowerCase().trim() === 'ping') {
                console.log("Ping received.", phone);
                // Send a new message to the same chat
                await sock.sendMessage(msg.key.remoteJid, { text: 'pong'});
            }
        }
    } catch (e) {
        console.log ('Error processing incoming message', phone, msg, e)
    }
}

async function processTranscribeCommands(sock, store, phone, msg) {
    try {
        let newMode
        if (msg.key.fromMe) {
            newMode = ""
            const transcribeCommands = ['ozer encendido', 'ozer on', 
                                        '@ozer encendido', '@ozer on', 
                                        'transcribir', 'transcribe', 'לתמלל']
            if (transcribeCommands.includes(baileysFunctions.getMsgText(msg).toLowerCase().trim())) {
                newMode = "RESPOND"
            }
            const doNotTranscribeCommands = ['ozer apagado', 'ozer off', 
                                             '@ozer apagado', '@ozer off', 
                                             'no transcribir', 'transcribir off', 'transcribe off', 'לא לתמלל']
            if (doNotTranscribeCommands.includes(baileysFunctions.getMsgText(msg).toLowerCase().trim())) {
                newMode = "OFF"
            }
            const privateCommands = ['ozer privado', 'ozer silenciar', 'ozer private', 'ozer silence']
            if (privateCommands.includes(baileysFunctions.getMsgText(msg).toLowerCase().trim())) {
                newMode = "PRIVATE"
            }
            if (newMode!="") {
                let exceptionCreated
                if (isJidGroup(msg.key.remoteJid)) {                
                    // msg belongs to a group
                    // Takes only the group number. E.g: takes "120363264972910743" from "120363264972910743@g.us"
                    const groupIdTransfer = jidDecode(msg.key.remoteJid).user
                    let groupName = store.chats.get(msg.key.remoteJid).name;
                    exceptionCreated = await services.createNewExceptionCommandLine(phone, true, groupIdTransfer, groupName, newMode)
                    let configuration = await supabase.getConfiguration(phone)
                    await supabase.insertUserLog(configuration.email, logEvents.EVENT_GROUP_EXCEPTION_COMMAND, null, null, null, null, groupIdTransfer, newMode)
                } else if (isJidUser(msg.key.remoteJid)) {           
                    // msg belongs to a contact
                    // Takes only the phone number. E.g: takes "5491144394488" from "5491144394488@c.us"
                    const contactPhoneTransfer = jidDecode(msg.key.remoteJid).user
                    let contactName = store.contacts[msg.key.remoteJid].name;
                    exceptionCreated = await services.createNewExceptionCommandLine(phone, false, contactPhoneTransfer, contactName, newMode)
                    let configuration = await supabase.getConfiguration(phone)
                    await supabase.insertUserLog(configuration.email, logEvents.EVENT_CONTACT_EXCEPTION_COMMAND, null, null, null, null, contactPhoneTransfer, newMode)
                } else {
                    console.log('Transcribe command does not belong to a group or a contact', phone, msg);
                    return;
                }
                // Send a new message to the same chat
                let groupId
                let contactPhone

                const i18n = new I18nManager();
                if (isJidGroup(msg.key.remoteJid)) {
                    contactPhone='';
                    // Takes only the phone number. E.g: takes "5491144394488" from "5491144394488@c.us"
                    groupId = jidDecode(msg.key.remoteJid).user
                } else {
                    // Takes only the phone number. E.g: takes "5491144394488" from "5491144394488@c.us"
                    groupId = '';
                    contactPhone = jidDecode(msg.key.remoteJid).user
                }
                // messageForwarded is irrelevant here
                const language = await languageSelectionLogic.getSetChatLanguage(phone, isJidGroup(msg.key.remoteJid), groupId, contactPhone, '', false)
                if (!exceptionCreated){
                    const msgText = await i18n.getWL('TRANSCRIBE_SAME_MODE',language);
                    await sock.sendMessage(msg.key.remoteJid, {text: msgText, linkPreview: null}, {quoted: msg});
                } else if (newMode==="RESPOND"){
                    const msgText = await i18n.getWL('TRANSCRIBE_ON_MESSAGE_FOR_CONTACTS',language);
                    await sock.sendMessage(msg.key.remoteJid, {text: msgText, linkPreview: null}, {quoted: msg});
                } else if (newMode==="OFF"){
                    const msgText = await i18n.getWL('TRANSCRIBE_OFF_MESSAGE_FOR_CONTACTS',language);
                    await sock.sendMessage(msg.key.remoteJid, {text: msgText, linkPreview: null}, {quoted: msg});
                } else if (newMode==="PRIVATE"){
                    const msgTextPublic = await i18n.getWL('TRANSCRIBE_PRIVATE_MESSAGE_FOR_CONTACTS',language);
                    await sock.sendMessage(msg.key.remoteJid, {text: msgTextPublic, linkPreview: null}, {quoted: msg});
                    // TODO: Send a message in private to the user saying "audios from contact X / group Y will be transcribed here"
                }
            }
        }
    } catch (e) {
        console.log ('Error processing incoming message', phone, msg, e)
    }
}

async function processForgetLanguageCommand(sock, store, phone, msg) {    
    try {
        if (msg.key.fromMe) {
            const transcribeCommands = ['@ozer olvidar idioma', '@ozer forget language',
                                        'ozer olvidar idioma', 'ozer forget language',
                                        'olvidar idioma', 'forget language', 'לשכוח שפה']
            if (transcribeCommands.includes(baileysFunctions.getMsgText(msg).toLowerCase().trim())) {                
                let groupId
                let contactPhone
                const isGroup = isJidGroup(msg.key.remoteJid)
                if (isGroup) {
                    groupId = jidDecode(msg.key.remoteJid).user
                    contactPhone = ''                
                } else if (isJidUser(msg.key.remoteJid)) {           
                    groupId = ''
                    contactPhone = jidDecode(msg.key.remoteJid).user
                } else {
                    console.log('Forget Language command does not belong to a group or a contact', phone, msg);
                    return;
                }
                const result = await languageSelectionLogic.deleteChatLanguage(phone, isGroup, groupId, contactPhone)
                if (result.code === 100) {
                    const msgText = "✅"
                    await sock.sendMessage(msg.key.remoteJid, {text: msgText, linkPreview: null}, {quoted: msg});
                    let configuration = await supabase.getConfiguration(phone)
                    await supabase.insertUserLog(configuration.email, logEvents.EVENT_FORGET_LANGUAGE_COMMAND, null, null, null, null, contactPhone !== '' ? contactPhone : groupId)
                }
            }
        }
    } catch (e) {
        console.log ('Error processing incoming message', phone, msg, e)
    }
}

async function processGPTCommand(sock, store, phone, msg) {
    try {
        if (msg.key.fromMe) {
            const gptCommands = ['gpt', 'ozer', 'עוזר']
            if (gptCommands.includes(miscFunctions.getFirstWord(baileysFunctions.getMsgText(msg).toLowerCase().trim()))) {
                const userConfig = await supabase.getConfiguration(phone)
                if (userConfig.assistant_enabled) {
                    const response = await chatGptQueryGeneration.generateChatGPTRequest(msg)
                    if (isJidGroup(msg.key.remoteJid)) {
                        contactPhone='';
                        groupId = jidDecode(msg.key.remoteJid).user //Takes only the phone number. E.g: takes "5491144394488" from "5491144394488@c.us"                
                    } else {
                        groupId = '';
                        contactPhone = jidDecode(msg.key.remoteJid).user //Takes only the phone number. E.g: takes "5491144394488" from "5491144394488@c.us"
                    }
                    const language = await languageSelectionLogic.getSetChatLanguage(phone, isJidGroup(msg.key.remoteJid), groupId, contactPhone, '', false) //isMessageForwarded parameter is irrelevant here                
                    const i18n = new I18nManager();
                    i18n.setLanguage(language)
                    const msgText = `_${response}_`
                    await sock.sendMessage(msg.key.remoteJid, {text: msgText, linkPreview: null}, {quoted: msg});
                    /* const files = [new File(["file content"], "example.txt")]; // Replace with actual files
                    callGpt4WithFileChat(prompt, files)
                        .then(result => {
                            console.log("API result:", result);
                            msg.reply(result,undefined,{sendSeen:false});
                        })
                        .catch(error => {
                            console.error("API call failed:", error);
                        });                                
                    }*/
                }
            }
        }
    } catch (e) {
        console.log ('Error processing incoming message', phone, msg, e)
    }    
}

// Gets the connectedPhoneObjects for the specified phone.
// Creates an empty object if it does not exist.
function getSetConnectedPhoneObjects(connectedPhones, email) {
    if (!connectedPhones.get(email)) {
        connectedPhones.set(email, {});
    }
    return connectedPhones.get(email);
}

function setConnectedPhoneObjectsSock(connectedPhones, email, newSock) {
    const connectedPhoneObjects = getSetConnectedPhoneObjects(connectedPhones, email);     
    const oldSock = connectedPhoneObjects.sock;
    if (oldSock) {
        try {
            oldSock.end();
        } catch(error) {
            console.log('error disconnecting old socket: ', error)
        }    
    }
    connectedPhoneObjects.sock = newSock;
}

function setConnectedPhoneObjectsProcessListenerRemover(connectedPhones, email, newProcessListenerRemover) {
    const connectedPhoneObjects = getSetConnectedPhoneObjects(connectedPhones, email);     
    const oldProcessListenerRemover = connectedPhoneObjects.processListenerRemover;
    if (oldProcessListenerRemover) {
        try {
            oldProcessListenerRemover();
        } catch(error) {
            console.log('error removing old process listener: ', error)
        }    
    }
    connectedPhoneObjects.processListenerRemover = newProcessListenerRemover;
}

/**
 * Disconnects a phone from WhatsApp.
 *
 * @param {Map} connectedPhones - Map of connected phone objects.
 * @param {Object} email - The email to disconnect.
 * @param {boolean} isRemoveStoreWriteInterval - Indicates whether to remove storeWriteInterval
 * @param {boolean} isDeleteDataDirectory - Indicates whether to delete the data directory.
 */
function disconnectWhatsapp(connectedPhones, email, isRemoveStoreWriteInterval, isDeleteDataDirectory) {
    const connectedPhoneObjects = connectedPhones.get(email);
    if (connectedPhoneObjects) {
        // Remove the listener we added
        connectedPhoneObjects.processListenerRemover();
        // Disconnect the socket
        connectedPhoneObjects.sock.end();
        if (isRemoveStoreWriteInterval) {
            // Remove the store write interval
            clearInterval(connectedPhoneObjects.storeWriteInterval);
        }
        if (isDeleteDataDirectory) {
            // Remove connectedPhoneObjects from the connectedPhones map
            connectedPhones.delete(email);   
            // Remove the phone baileys directory in case it exists
            fs.rmSync(baileysFunctions.getBaileysEmailPath(email), { recursive: true, force: true });
        }    
    }
}

module.exports = {
    connectWhatsapp,
    disconnectWhatsapp
};
