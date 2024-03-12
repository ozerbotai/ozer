const path = require('path')
const miscFunctions = require('./misc-functions');
const fs = require('fs');
const supabase = require('./supabase.js');

exports.getMsgIsForwarded = function (msg) {
    return (msg?.message?.extendedTextMessage?.contextInfo?.isForwarded ||
            msg?.message?.audioMessage?.contextInfo?.isForwarded)
}

exports.getMsgText = function (msg) {
    if (msg?.message?.extendedTextMessage?.text) {
        return msg.message.extendedTextMessage.text;
    } else if (msg.message?.conversation) {
        return msg.message.conversation;
    } else {
        return '';
    }
}

exports.getQuotedMsgText = function (msg) {
    if (msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text) {
        return msg.message.extendedTextMessage.contextInfo.quotedMessage.extendedTextMessage.text;
    } else if (msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation) {
        return msg.message.extendedTextMessage.contextInfo.quotedMessage.conversation
    } else {
        return '';
    }
}

exports.getBaileysEmailPath = function (email) {
    codedEmail = miscFunctions.encodeEmail(email)
    return path.join(exports.getBaileysBasePath(), 'user-' + codedEmail);
  }

exports.getBaileysBasePath = function () {
    return path.join(__dirname, '../../.baileys-data');
}

exports.getFolderUsers = async function () {
    let folderUsers = []
    let basePath = exports.getBaileysBasePath();
  
    const dirPath = fs.readdirSync(basePath);
    dirPath.map(item => {    
      folderUsers.push(item.replace('user-', ''))
    });
    return(folderUsers)
  }

exports.userFolderExists = async function (email) {
    const codedEmail = miscFunctions.encodeEmail(email)
    const userList = await exports.getFolderUsers()
    return (userList.includes(codedEmail))
}

//Returns true if bailey's folder exists and there's a row in userconfig for that email
exports.isUserCorrectlyConnected = async function (email) {
    const folderExists = await exports.userFolderExists(email)
    const userConfig = await supabase.getConfigurationByEmail(email)
    
    return (folderExists && userConfig)
}