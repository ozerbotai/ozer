const supabase = require('./supabase.js');

exports.createNewExceptionCommandLine = async function (phone, isGroup, contactPhoneOrGroupId, name, new_mode) {
    let sendingException
    if (isGroup) {
        sendingException = await supabase.getSendingExceptionGroupsFull(phone,contactPhoneOrGroupId)    
        if (sendingException.length===0) {
            data = await supabase.insertGroupException(phone, contactPhoneOrGroupId, new_mode, name)
            return(true)
        } else if (sendingException.mode_for_group!=new_mode) {
            data = await supabase.updateGroupException(sendingException.id, phone, contactPhoneOrGroupId, new_mode, name)
            return(true)
        } else {
            return(false)
        }
    } else {
        sendingException = await supabase.getSendingExceptionFull(phone,contactPhoneOrGroupId)    
        if (sendingException.length===0) {            
            data = await supabase.insertContactException(phone, contactPhoneOrGroupId, new_mode, name)
            return(true)
        } else if (sendingException.mode_for_contact!=new_mode) {
            data = await supabase.updateContactException(sendingException.id, phone, contactPhoneOrGroupId, new_mode, name)
            return(true)
        } else {
            return(false)
        }
    }
}