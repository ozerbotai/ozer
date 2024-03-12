const supabase = require('./supabase.js');

exports.decideSendingTargets = async function (userPhone, contactPhone, msgFromMe) {  
    //This function has the logic to decide whether an audio transcription will be sent in private mode and/or in response mode 
    
    let sendingMode;
    let sendingTargets = {
        private: false,
        respond: false,
    };

    //Check which mode must be applied
    const exceptionMode = await supabase.getSendingException(userPhone, contactPhone)    
    if (exceptionMode!='') {
        //There is an exception for this contactPhone
        sendingMode = exceptionMode
    } else {
        //There is no exception for this contactPhone. Look for the general config.
        const userConfig = await supabase.getConfiguration(userPhone)
        if (userConfig) {
            sendingMode = userConfig.general_mode
        } else {
            sendingMode = "OFF"            
        }
    }
    //According to mode that must be applied, generate object to be returned
    switch (sendingMode) {
        case "OFF":                        
            sendingTargets.private = false;
            sendingTargets.respond = false;
            break;
        case "PRIVATE":
            sendingTargets.private = true;
            sendingTargets.respond = false;
            break;
        case "RESPOND":
            sendingTargets.private = false;
            sendingTargets.respond = true;
            break;
        case "RESPOND_AND_PRIVATE":
            sendingTargets.private = true;
            sendingTargets.respond = true;
            break;
        default:
            console.log('Problem in decideSendingTargets. Mode should be "OFF", "PRIVATE", "RESPOND" or "RESPOND_AND_PRIVATE"',userPhone,contactPhone,exceptionMode,sendingMode);
            break;
    }  
    if(msgFromMe){
        sendingTargets.private = false;
    }
    return(sendingTargets);
}

exports.decideSendingTargetsGroups = async function (userPhone, groupId, msgFromMe) {  
    //This function has the logic to decide whether an audio transcription will be sent in private mode and/or in response mode 
    
    let sendingMode;
    let sendingTargets = {
        private: false,
        respond: false,
    };

    //Check which mode must be applied
    const exceptionMode = await supabase.getSendingExceptionGroups(userPhone, groupId)    
    if (exceptionMode!='') {
        //There is an exception for this contactPhone
        sendingMode = exceptionMode
    } else {
        //There is no exception for this contactPhone. Look for the general config.
        const userConfig = await supabase.getConfiguration(userPhone)
        sendingMode = userConfig.general_mode_groups
    }
    //According to mode that must be applied, generate object to be returned
    switch (sendingMode) {
        case "OFF":                        
            sendingTargets.private = false;
            sendingTargets.respond = false;
            break;
        case "PRIVATE":
            sendingTargets.private = true;
            sendingTargets.respond = false;
            break;
        case "RESPOND":
            sendingTargets.private = false;
            sendingTargets.respond = true;
            break;
        case "RESPOND_AND_PRIVATE":
            sendingTargets.private = true;
            sendingTargets.respond = true;
            break;
        default:
            console.log('Problem in decideSendingTargetsGroups. Mode should be "OFF", "PRIVATE", "RESPOND" or "RESPOND_AND_PRIVATE"',userPhone,groupId,exceptionMode,sendingMode);
            break;
    }  
    if(msgFromMe){
        sendingTargets.private = false;
    }
    return(sendingTargets);
}
