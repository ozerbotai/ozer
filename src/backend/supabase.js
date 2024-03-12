require('dotenv').config({ path: '.env.local' });
const events = require('./user-event-constants-backend.js')
const constants = require('./constants.js');

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

 const { createClient } = require ('@supabase/supabase-js')

const supabase = createClient(supabaseUrl, supabaseKey)

exports.getConfiguration = async function (phone) {
    try {        
        let { data, error } = await supabase
        .from('userconfig')
        .select('*, ' + 
                'general_mode_details:modes!public_userconfig_general_mode_fkey(id), ' + 
                'general_mode_groups_details:modes!public_userconfig_general_mode_groups_fkey(id)')
        .eq('user_phone', phone)
        const result = data[0]
        return(result)        
        }                 
    catch (error){
        console.log (phone, 'There is an error looking for the config: ', error)
    }
}

exports.getConfigurationByEmail = async function (email) {
    try {        
        let { data, error } = await supabase
        .from('userconfig')
        .select('*, ' + 
                'general_mode_details:modes!public_userconfig_general_mode_fkey(id), ' + 
                'general_mode_groups_details:modes!public_userconfig_general_mode_groups_fkey(id)')
        .eq('email', email)
        const result = data[0]
        return(result)        
        }                 
    catch (error){
        console.log (email, 'There is an error in getConfigurationByEmail: ', error)
    }
}
exports.insertUserInDatabase = async function (phone, googleUserProfile) {    
    const configurationDefaults = await exports.getUserConfigurationDefaults()

    const { data, error } = await supabase
    .from('userconfig')
    .insert(
    [{ 
        user_phone: phone, 
        email: googleUserProfile.emails[0].value,
        general_mode: configurationDefaults.general_mode,
        alias: googleUserProfile.displayName,
        general_mode_groups: configurationDefaults.general_mode_groups,
        transcribe_outgoing_messages: configurationDefaults.transcribe_outgoing_messages,
        language: '--', //right language is assigned later
        assistant_enabled: configurationDefaults.assistant_enabled,
        login_platform_id: googleUserProfile.id,
        given_name: googleUserProfile.name.givenName,
        family_name: googleUserProfile.name.familyName,
        name: googleUserProfile.displayName,
        picture: googleUserProfile.photos[0].value,
        is_admin: false,
        summarize_messages: configurationDefaults.summarize_messages,
        summary_minimum_seconds: configurationDefaults.summary_minimum_seconds,
        summary_minimum_words: configurationDefaults.summary_minimum_words,
        summary_use_bullets: configurationDefaults.summary_use_bullets,
        summary_length: configurationDefaults.summary_length,
        summary_include_full_text: configurationDefaults.summary_include_full_text
    },
    ])
    .select()
}

exports.updateUserInDatabase = async function (phone, googleUserProfile) {
    const { data, error } = await supabase
    .from('userconfig')
    .update(
    { 
        alias: googleUserProfile.displayName,
        login_platform_id: googleUserProfile.id,
        given_name: googleUserProfile.name.givenName,
        family_name: googleUserProfile.name.familyName,
        name: googleUserProfile.displayName,
        picture: googleUserProfile.photos[0].value
    })
    .eq('email', googleUserProfile.emails[0].value)
    .select()
    return(data)
}

exports.getUsers = async function () {
    try {
        let { data: users, error: usersError } = await supabase
            .from('userconfig')
            .select('*');
        if (usersError) throw usersError;

        let { data: transcriptionsLogSummaries30Days, error: transcriptionsLogSummaries30DaysError } = await supabase.rpc('get_transcriptions_log_summaries_30_days');
        if (transcriptionsLogSummaries30DaysError) {
            console.error('Error running transcriptions query:', transcriptionsLogSummaries30DaysError);
            throw transcriptionsLogSummaries30DaysError;
        }

        let { data: scanQrCodeEvents, error: eventsError } = await supabase
            .from('user_event_log')
            .select('email, created_at')
            .eq('log_type', events.EVENT_SCAN_QR_CODE)
            .order('created_at', { ascending: true })
        if (eventsError) throw eventsError;

        let { data: contactRespondExceptions, error: contactRespondExceptionsError } = await supabase
            .from('userexceptions')
            .select('user_phone, mode_for_contact')
            .eq('mode_for_contact', 'RESPOND');
        if (contactRespondExceptionsError) throw contactRespondExceptionsError;

        let { data: groupRespondExceptions, error: groupRespondExceptionsError } = await supabase
            .from('userexceptions_groups')
            .select('user_phone, mode_for_group')
            .eq('mode_for_group', 'RESPOND');
        if (groupRespondExceptionsError) throw groupRespondExceptionsError;

        let usersData = users.map(user => {
            // Filter the user events and take the first one
            let userEvent = scanQrCodeEvents.find(event => event.email === user.email);
            let firstConnection = userEvent ? userEvent.created_at : null;

            // Filter the transcripts corresponding to the user
            let transcriptionsLogSummary30Days = transcriptionsLogSummaries30Days.find(t => t.user_phone === user.user_phone);

            // Filter contact exceptions for the user
            let exceptionsRespondContact = contactRespondExceptions.filter(ce => ce.user_phone === user.user_phone).length;

            // Filter group exceptions for the user
            let exceptionsRespondGroup = groupRespondExceptions.filter(ge => ge.user_phone === user.user_phone).length;

            return {
                ...user,
                first_connection: firstConnection,
                exceptions_respond_contact: exceptionsRespondContact,
                exceptions_respond_group: exceptionsRespondGroup,
                transcribed: transcriptionsLogSummary30Days ? transcriptionsLogSummary30Days.transcribed : 0,
                daily_transcribed: transcriptionsLogSummary30Days ? transcriptionsLogSummary30Days.daily_transcribed : 0,
                daily_private: transcriptionsLogSummary30Days ? transcriptionsLogSummary30Days.daily_private : 0,
                daily_respond: transcriptionsLogSummary30Days ? transcriptionsLogSummary30Days.daily_respond : 0
            };
        });

        return usersData;

    } catch (error) {
        console.log('There is an error in getUsers: ', error);
    }
}

// The function fetches user data and recent connection/disconnection events.
// It compares the timestamps to determine if each user is offline, returning
// an array of disconnected users.
exports.getDisconnectedUsers = async function () {
    try {
        let { data: users, error: usersError } = await supabase
            .from('userconfig')
            .select('*');
        if (usersError) throw usersError;

        let { data: connectEvents, error: connectEventsError } = await supabase
            .from('user_event_log')
            .select('email, created_at')
            .eq('log_type', events.EVENT_SCAN_QR_CODE)
            .order('created_at', { ascending: false });
        if (connectEventsError) throw connectEventsError;

        let { data: disconnectEvents, error: disconnectEventsError } = await supabase
            .from('user_event_log')
            .select('email, created_at')
            .eq('log_type', events.EVENT_WHATSAPP_DISCONNECT)
            .order('created_at', { ascending: false });
        if (disconnectEventsError) throw disconnectEventsError;

        let disconnectedUsers = [];

        users.forEach(user => {
            // Get the most recent connection event
            let latestConnectEvent = connectEvents.find(event => event.email === user.email);
            let latestConnectDate = latestConnectEvent ? latestConnectEvent.created_at : null;

            // Get the most recent disconnect event
            let latestDisconnectEvent = disconnectEvents.find(event => event.email === user.email);
            let latestDiscontectDate = latestDisconnectEvent ? latestDisconnectEvent.created_at : null;

            // Compare dates to determine if the user is offline
            if (latestDiscontectDate && (!latestConnectDate || new Date(latestDiscontectDate) > new Date(latestConnectDate))) {
                disconnectedUsers.push({
                    ...user,
                    latestConnectDate,
                    latestDiscontectDate
                });
            }
        });

        return disconnectedUsers;
    } catch (error) {
        console.log('There is an error in getDisconnectedUsers: ', error);
    }
};

exports.getUserConfigurationDefaults = async function () {
    try {        
        let { data, error } = await supabase
        .from('userconfig_default_values')
        .select('*')        
        const result = data[0]
        return(result)        
        }                 
    catch (error){
        console.log ('There is an error in getConfigurationDefaults: ', error)
    }
}

exports.getSendingException = async function (userphone, contactphone) {
    //Returns "" if no exception. If there's an exception returns the sending mode.
    try {        
        let { data, error } = await supabase
            .from('userexceptions')
            .select('*')
            .eq('user_phone', userphone)
            .eq('contact_phone', contactphone)
        if (data.length==0) {
            return ('')
        } else {
            return (data[0]['mode_for_contact'])
        }        
    }                 
    catch (error){
        console.log (userphone, contactphone, 'There is an error in getSendingException: ', error)        
        return ('')
    }
}

exports.getSendingExceptionFull = async function (userphone, contactphone) {
    try {        
        let { data, error } = await supabase
            .from('userexceptions')
            .select('*')
            .eq('user_phone', userphone)
            .eq('contact_phone', contactphone)

        if (data.length==0) {
            return (data)
        } else {
            return (data[0])
        }        
    }                 
    catch (error){
        console.log ('There is an error in getSendingExceptionFull: ', error)        
    }
}

exports.insertContactException = async function (user_phone, contact_phone, mode_for_contact, contact_alias) {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const { count } = await supabase
    .from('userexceptions')
    .select('*', { count: 'exact' })
    .eq('user_phone', user_phone)
    .gte('created_at', oneHourAgo.toISOString());
    if (count >= constants.LIMIT_CONTACT_AND_GROUP_EXCEPTIONS) {
        return { error: `You have reached the limit of ${constants.LIMIT_CONTACT_AND_GROUP_EXCEPTIONS} contact exceptions in the last hour` };
    }

    const { data, error } = await supabase
    .from('userexceptions')
    .insert(
    [{ 
        user_phone: user_phone, 
        contact_phone: contact_phone,
        mode_for_contact: mode_for_contact,
        contact_alias: contact_alias
    },
    ])
    .select()
    return(data)
}

exports.updateContactException = async function (id, user_phone, contact_phone, mode_for_contact, contact_alias) {
    const { data, error } = await supabase
    .from('userexceptions')
    .update(
    { 
        contact_phone: contact_phone,
        mode_for_contact: mode_for_contact,
        contact_alias: contact_alias
    })
    .eq('id', id)
    .eq('user_phone', user_phone)
    .select()
    return(data)
}

exports.deleteContactException = async function (id, user_phone) {
    const { error } = await supabase
    .from('userexceptions')
    .delete()
    .eq('id', id)
    .eq('user_phone', user_phone)
    if (!error) {
        return({code: 100, description: 'OK'})
    } else {
        return({code: 200, description: error})
    }
}

exports.getContactException = async function (id) {
    const { data, error } = await supabase
    .from('userexceptions')
    .select('*')
    .eq('id', id)
    return(data[0])
}

exports.insertGroupException = async function (user_phone, WAGroupId, mode_for_group, group_alias) {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const { count } = await supabase
    .from('userexceptions_groups')
    .select('*', { count: 'exact' })
    .eq('user_phone', user_phone)
    .gte('created_at', oneHourAgo.toISOString());
    if (count >= constants.LIMIT_CONTACT_AND_GROUP_EXCEPTIONS) {
        return { error: `You have reached the limit of ${constants.LIMIT_CONTACT_AND_GROUP_EXCEPTIONS} group exceptions in the last hour` };
    }

    const { data, error } = await supabase
    .from('userexceptions_groups')
    .insert(
    [{ 
        user_phone: user_phone, 
        group_id: WAGroupId,
        mode_for_group: mode_for_group,
        group_alias: group_alias
    },
    ])
    .select()
    return(data)
}

exports.updateGroupException = async function (id, user_phone, WAGroupId, mode_for_group, group_alias) {
    const { data, error } = await supabase
    .from('userexceptions_groups')
    .update(
    { 
        group_id: WAGroupId,
        mode_for_group: mode_for_group,
        group_alias: group_alias
    })
    .eq('id', id)
    .eq('user_phone', user_phone)
    .select()
    return(data)
}

exports.deleteGroupException = async function (id, user_phone) {
    const { error } = await supabase
    .from('userexceptions_groups')
    .delete()
    .eq('id', id)
    .eq('user_phone', user_phone)
    if (!error) {
        return({code: 100, description: 'OK'})
    } else {
        return({code: 200, description: error})
    }
}

exports.getGroupException = async function (id) {
    const { data, error } = await supabase
    .from('userexceptions_groups')
    .select('*')
    .eq('id', id)
    return(data[0])
}

exports.updateUserGeneralConfiguration = async function (user_phone, contactMode, groupMode, transcribeOutgoingMessages, summarizeMessages) {
    const { data, error } = await supabase
        .from('userconfig')
        .update(
        { 
            general_mode: contactMode,
            general_mode_groups: groupMode,
            transcribe_outgoing_messages: transcribeOutgoingMessages,
            summarize_messages: summarizeMessages,
        })
        .eq('user_phone', user_phone)
        .select()
    return(data)
}

exports.updateUserSummaryConfiguration = async function (user_phone, summarizeMessages, minSeconds, minWords, useBullets, fullText) {
    const { data, error } = await supabase
        .from('userconfig')
        .update(
        { 
            summarize_messages  : summarizeMessages,
            summary_minimum_seconds: minSeconds,
            summary_minimum_words: minWords,
            summary_use_bullets: useBullets,
            summary_include_full_text: fullText,
        })
        .eq('user_phone', user_phone)
        .select()
    return(data)
}

exports.updateUserPauseTranscriptions = async function (email, newState) {
    const { data, error } = await supabase
        .from('userconfig')
        .update(
        { 
            transcriptions_paused: newState
        })
        .eq('email', email)
        .select()
    return(data)
}

exports.updateUserLanguage = async function (email, userLanguage, browserLanguage) {
    const { data, error } = await supabase
        .from('userconfig')
        .update(
        { 
            language: userLanguage,
            browser_language: browserLanguage
        })
        .eq('email', email)
        .select()
    return(data)
}

exports.getSendingExceptionGroups = async function (userphone, groupId) {
    //Returns "" if no exception. If there's an exception returns the sending mode.
    try {        
        let { data, error } = await supabase
            .from('userexceptions_groups')
            .select('*')
            .eq('user_phone', userphone)
            .eq('group_id', groupId)

        if (data.length==0) {
            return ('')
        } else {
            return (data[0]['mode_for_group'])
        }        
    }                 
    catch (error){
        console.log ('There is an error in getSendingExceptionGroups: ', error)  
        return ('')      
    }
}

exports.getSendingExceptionGroupsFull = async function (userphone, groupId) {
    try {        
        let { data, error } = await supabase
            .from('userexceptions_groups')
            .select('*')
            .eq('user_phone', userphone)
            .eq('group_id', groupId)

        if (data.length==0) {
            return (data)
        } else {
            return (data[0])
        }        
    }                 
    catch (error){
        console.log ('There is an error in getSendingExceptionGroups: ', error)        
    }
}

exports.getPhoneInfo = async function (phone) {
    let phoneInfo

    const generalConfiguration = await exports.getConfiguration(phone)
    const sendingExceptions = await exports.getAllSendingExceptions(phone)
    const sendingExceptionsGroups = await exports.getAllSendingExceptionsGroups(phone)

    phoneInfo = {
        generalConfiguration: generalConfiguration,
        sendingExceptions: sendingExceptions,
        sendingExceptionsGroups: sendingExceptionsGroups
    }    
    return(phoneInfo)
}

exports.getAllSendingExceptions = async function (userphone) {
    try {        
        let { data, error } = await supabase
            .from('userexceptions')
            .select('*, modes!inner(id)')
            .eq('user_phone', userphone)            
            .order('contact_alias');

        return (data)
    }                 
    catch (error){
        console.log ('There is an error in getAllSendingExceptions: ', error)        
    }
}

exports.getAllSendingExceptionsGroups = async function (userphone) {
    try {        
        let { data, error } = await supabase
            .from('userexceptions_groups')
            .select('*, modes!inner(id)')
            .eq('user_phone', userphone)            
            .order('group_alias');

        return (data)
    }                 
    catch (error){
        console.log ('There is an error in getAllSendingExceptionsGroups: ', error)        
    }
}

exports.getModeIdFromDescription = async function (modeDescription) {
    try {        
        let { data, error } = await supabase
            .from('modes')
            .select('*')
            .eq('mode', modeDescription)            

        if (data.length==0) {
            return ('')
        } else {
            return (data[0])
        }        
    }                 
    catch (error){
        console.log ('There is an error in getModeIdFromDescription: ', error)        
    }
}

exports.getModeDescriptionFromId = async function (modeId) {
    try {        
        let { data, error } = await supabase
            .from('modes')
            .select('*')
            .eq('id', modeId)            
        
        if (data.length==0) {
            return ('')
        } else {
            return (data[0])
        }        
    }                 
    catch (error){
        console.log ('There is an error in getModeDescriptionFromId: ', error)        
    }
}

exports.refreshCurrentQRCode = async function (email, QRCode) {
    QRCodeConfig = await exports.getCurrentQRCode(email,QRCode)
    if (QRCodeConfig) {
        await exports.updateCurrentQRCode(email, QRCode)
        await exports.setQRCodeState(email, "DISCONNECTED")
    } else {
        await exports.insertCurrentQRCode(email, QRCode, "DISCONNECTED")
    }    
}

exports.updateCurrentQRCode = async function (email, QRCode) {
    const { data, error } = await supabase
        .from('userqr_codes')
        .update(
        { 
            last_qr_code: QRCode
        })
        .eq('email', email)
        .select()    
    return(data)
}

exports.setQRCodeState = async function (email, state) {
    const { data, error } = await supabase
        .from('userqr_codes')
        .update(
        { 
            state: state
        })
        .eq('email', email)
        .select()    
    return(data)
}

exports.insertCurrentQRCode = async function (email, QRCode, state) {
    const { data, error } = await supabase
    .from('userqr_codes')
    .insert(
    [{ 
        email: email, 
        last_qr_code: QRCode,
        state: state
    },
    ])
    .select()
    return(data)
}

exports.getCurrentQRCode = async function (email) {
    try {
        let { data, error } = await supabase
        .from('userqr_codes')
        .select('*')
        .eq('email', email) 
        const result = data[0]
        return(result)
        }
    catch (error){
        console.log ('Error in getCurrentQRCode: ', error)
    }
}

exports.createAndLockTranscriptionLog = async function (param_user_phone, param_is_group, param_group_id, param_contact_phone, param_file_hash, param_duration, param_media_key, param_size, param_device_type, param_sent_or_received, param_private, param_respond) {
    try {
        const { error: matchError, data: logInserted } = await supabase.rpc(
            'insert_log_and_lock3',
            {
                param_user_phone, 
                param_is_group, 
                param_group_id, 
                param_contact_phone, 
                param_file_hash, 
                param_duration, 
                param_media_key, 
                param_size, 
                param_device_type, 
                param_sent_or_received, 
                param_private, 
                param_respond
            }
        )
        if (matchError) {
            throw matchError;        
        }
        return(logInserted)          
        
        } catch (err) {
            // catch block ran:  An error occurred
            console.log('catch block ran: ', err);
        }
}


exports.getContactLanguage = async function (userphone, contactphone) {
    try {        
        let { data, error } = await supabase
            .from('user_languages_contacts')
            .select('*')
            .eq('user_phone', userphone)
            .eq('contact_phone', contactphone)

        if (data.length==0) {
            return (undefined)
        } else {
            return (data[0])
        }        
    }                 
    catch (error){
        console.log ('There is an error in getContactLanguage: ', error)
        return(undefined)
    }
}

exports.insertContactLanguage = async function (user_phone, contact_phone, language) {
    const { data, error } = await supabase
    .from('user_languages_contacts')
    .insert(
    [{ 
        user_phone: user_phone, 
        contact_phone: contact_phone,
        language: language
    },
    ])
    .select()
    return(data)
}

exports.updateContactLanguage = async function (id, user_phone, contact_phone, language) {
    const { data, error } = await supabase
    .from('user_languages_contacts')
    .update(
    { 
        language: language
    })
    .eq('id', id)
    .select()
    return(data)
}

exports.deleteContactLanguage = async function (userphone, contactphone) {
    const { error } = await supabase
    .from('user_languages_contacts')
    .delete()
    .eq('user_phone', userphone)
    .eq('contact_phone', contactphone)
    if (!error) {
        return({code: 100, description: 'OK'})
    } else {
        return({code: 200, description: error})
    }
}

exports.getGroupLanguage = async function (userphone, groupId) {
    try {        
        let { data, error } = await supabase
            .from('user_languages_groups')
            .select('*')
            .eq('user_phone', userphone)
            .eq('group_id', groupId)

        if (data.length==0) {
            return (undefined)
        } else {
            return (data[0])
        }        
    }                 
    catch (error){
        console.log ('There is an error in getGroupLanguage: ', error)
        return(undefined)
    }
}

exports.insertGroupLanguage = async function (user_phone, groupId, language) {
    const { data, error } = await supabase
    .from('user_languages_groups')
    .insert(
    [{ 
        user_phone: user_phone, 
        group_id: groupId,
        language: language
    },
    ])
    .select()
    return(data)
}

exports.updateGroupLanguage = async function (id, user_phone, groupId, language) {
    const { data, error } = await supabase
    .from('user_languages_groups')
    .update(
    { 
        language: language
    })
    .eq('id', id)
    .select()
    return(data)
}

exports.deleteGroupLanguage = async function (userphone, groupId) {
    const { error } = await supabase
    .from('user_languages_groups')
    .delete()
    .eq('user_phone', userphone)
    .eq('group_id', groupId)
    if (!error) {
        return({code: 100, description: 'OK'})
    } else {
        return({code: 200, description: error})
    }
}

exports.insertUserLog = async function (email, log_type, description, browserLanguage, platform, isMobile, contact_phone_or_group_id, newMode, oldMode) {
    const { data, error } = await supabase
    .from('user_event_log')
    .insert(
    [{ 
        email: email,
        log_type: log_type,
        description: description,
        contact_phone_or_group_id: contact_phone_or_group_id,
        browserLanguage: browserLanguage,
        platform: platform,
        isMobile: isMobile,
        newMode: newMode,
        oldMode: oldMode
    },
    ])
    .select()
    return(data)
}

exports.insertUserConnectionEventLog = async function (googleUserProfile, browser_language, platform, is_mobile, country, region) {
    const { data: existingUser, error: selectUserError } = await supabase
    .from('userconfig')
    .select('email')
    .eq('email', googleUserProfile.emails[0].value)
    .single();

    if (selectUserError && selectUserError.code !== 'PGRST116') {
        throw new Error('Error checking for existing user: ' + selectUserError.message);
    }

    if (existingUser) {
        return { message: 'The email already exists in the userconfig table.' };
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    // Check if a record already exists for this user, device and day
    const { data: existingLog, error: selectLogError } = await supabase
        .from('user_connection_event_log')
        .select('*')
        .eq('email', googleUserProfile.emails[0].value)
        .eq('platform', platform)
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString())

    if (selectLogError && selectLogError.code !== 'PGRST116') {
        throw new Error('Error checking for existing log: ' + selectLogError.message);
    }

    if (existingLog.length > 0) {
        return { message: 'An event for this user and device already exists for today.' };
    }

    const { data, error } = await supabase
    .from('user_connection_event_log')
    .insert(
    [{ 
        email: googleUserProfile.emails[0].value,
        alias: googleUserProfile.displayName,
        login_platform_id: googleUserProfile.id,
        given_name: googleUserProfile.name.givenName,
        family_name: googleUserProfile.name.familyName,
        picture: googleUserProfile.photos[0].value,
        browser_language: browser_language,
        platform: platform,
        is_mobile: is_mobile,
        country: country,
        region: region
    },
    ])
    .select()

    if (error) {
        console.error('There is an error in insertUserConnectionEventLog: ', error);
    }

    return(data)
}

// Retrieves all user event records for the given email.
exports.getUserEventLogsByEmail = async function (email) {
    try {        
        let allData = [];
        let from = 0;
        const limit = 1000;
        let hasMoreData = true;
    
        // Retrieves records in batches of 1000 until all are retrieved
        // because Supabase limits queries to a maximum of 1000 records per request.
        while (hasMoreData) {
            const { data, error } = await supabase
            .from('user_event_log')
            .select('*')
            .eq('email', email)
            .order('created_at', { ascending: false })
            .range(from, from + limit - 1);
    
          if (error) {
            throw error;
          }
    
          if (data.length > 0) {
            allData = allData.concat(data);
            from += limit;
          } else {
            hasMoreData = false;
          }
        }
    
        return allData;
    } catch (error){
        console.log (email, 'There is an error in getUserEventLogsByEmail: ', error)
    }
}

exports.insertWaitlistUser = async function (googleUserProfile, browser_language, platform, is_mobile, country, region) {
    try {
        const { data: existingUser, error: selectError } = await supabase
        .from('waitlist_users')
        .select('email')
        .eq('email', googleUserProfile.emails[0].value)
        
        if (selectError && selectError.code !== 'PGRST116') {
            throw new Error('Error checking for existing user: ' + selectError.message);
        }

        if (existingUser.length) {
            return { message: 'User already in waitlist' };
        }
        
        const { data, error: insertError } = await supabase
        .from('waitlist_users')
        .insert(
        [{ 
            email: googleUserProfile.emails[0].value,
            alias: googleUserProfile.displayName,
            login_platform_id: googleUserProfile.id,
            given_name: googleUserProfile.name.givenName,
            family_name: googleUserProfile.name.familyName,
            picture: googleUserProfile.photos[0].value,
            browser_language: browser_language,
            platform: platform,
            is_mobile: is_mobile,
            country: country,
            region: region
        },
        ])
        .select()

        if (insertError) {
            throw new Error('Error inserting user: ' + insertError.message);
        }

        return data
    } catch (error){
        console.log ('There is an error in insertWaitlistUser: ', error)
    }
}

exports.getWaitlistIsOpen = async function () {
    try {        
        const { data, error } = await supabase
        .from('waitlist_default_values')
        .select('*')
        .eq('id', 1)
        return(data[0])
        }                 
    catch (error){
        console.log ('There is an error in getWaitlistIsOpen: ', error)
    }
}

exports.getUnfinishedSignupsDaysAgo = async function (daysAgo) {
    try {
        // Calculate the start and end times for the day 'daysAgo' days before today
        const today = new Date();
        const startTime = new Date(today);
        startTime.setDate(today.getDate() - daysAgo);
        startTime.setHours(0, 0, 0, 0); // Set to midnight

        const endTime = new Date(today);
        endTime.setDate(today.getDate() - daysAgo);
        endTime.setHours(23, 59, 59, 999); // Set to end of day

        const { data: signupAttempts, error: signupAttemptsError } = await supabase
        .from('user_connection_event_log')
        .select('email, given_name, browser_language')
        .gte('created_at', startTime.toISOString()) // Records from the start of the day
        .lte('created_at', endTime.toISOString())  // Records up to the end of the day
        if (signupAttemptsError) throw signupAttemptsError;

        // Filter duplicate emails in signupAttempts
        const uniqueSignupAttempts = signupAttempts.reduce((acc, current) => {
            const x = acc.find(item => item.email === current.email);
            if (!x) {
                acc.push(current);
            }
            return acc;
        }, []);
        
        const { data: userConfigs, error: userConfigsError } = await supabase
        .from('userconfig')
        .select('email')
        if (userConfigsError) throw userConfigsError;

        // Filter out users in uniqueSignupAttempts that are NOT in userConfigs
        const unfinishedSignups = uniqueSignupAttempts.filter((userConnection) => 
            !userConfigs.find((userConfig) => userConfig.email === userConnection.email)
        );

        return unfinishedSignups;
    }
    catch (error){
        console.log ('There is an error in getUnfinishedSignupsDaysAgo: ', error)
    }
}

exports.getCountScanQrCodeEvents = async function (email) {
    try {        
        const { count } = await supabase
        .from('user_event_log')
        .select('*', { count: 'exact' })
        .eq('email', email)
        .eq('log_type', 'scan_qr_code')
        return(count)
        }                 
    catch (error){
        console.log ('There is an error in getCountScanQrCodeEvents: ', error)
    }
}