async function getContactException(phone, contactPhone) {
    try {
        const response = await fetch('../getContactException?'+
                                    'phone='+encodeURIComponent(phone)+'&'+
                                    'contactPhone='+encodeURIComponent(contactPhone)
                                    );
        data = await response.json()
        return(data)        
    } catch(error) {
        console.error('Error:', error);
    }        
}

async function getGroupException(phone, WAGroupId) {
    try {
        const response = await fetch('../getGroupException?'+
                                    'phone='+encodeURIComponent(phone)+'&'+
                                    'WAGroupId='+encodeURIComponent(WAGroupId)
                                    );
        data = await response.json()
        return(data)        
    } catch(error) {
        console.error('Error:', error);
    }        
}

async function deleteContactException(id, phone) {
    try {
        const navigatorParameters = getNavigatorUrlParameters()
        const response = await fetch('../deleteContactException?'+
                                    'id='+encodeURIComponent(id)+'&'+
                                    'phone='+encodeURIComponent(phone)+'&'+
                                    navigatorParameters
                                    );
        data = await response.json()
        return(data)
    } catch(error) {
        console.error('Error:', error);
        return({code: 300, description: error})
    }
}

// Function to update the contact exception
async function updateContactException(id, phone, contactPhone, alias, modeId) {
    try {
        const mode = await modeDescriptionfromId(modeId) 
        const navigatorParameters = getNavigatorUrlParameters()
        const response = await fetch('../updateContactException?'+
                                    'id='+encodeURIComponent(id)+'&'+
                                    'phone='+encodeURIComponent(phone)+'&'+
                                    'contactPhone='+encodeURIComponent(contactPhone)+'&'+
                                    'mode='+encodeURIComponent(mode.mode)+'&'+
                                    'alias='+encodeURIComponent(alias)+'&'+
                                    navigatorParameters
                                    );
        data = await response.json()
        return(data[0].id)
    } catch(error) {
        console.error('Error:', error);
    }
}

async function insertContactException(phone, contactPhone, modeId, alias) {
    try {
        const mode = await modeDescriptionfromId(modeId) 
        const navigatorParameters = getNavigatorUrlParameters()
        const response = await fetch('../insertContactException?'+
                                    'phone='+encodeURIComponent(phone)+'&'+
                                    'contactPhone='+encodeURIComponent(contactPhone)+'&'+
                                    'mode='+encodeURIComponent(mode.mode)+'&'+
                                    'alias='+encodeURIComponent(alias)+'&'+
                                    navigatorParameters
                                    );
        data = await response.json()
        return(data[0].id)
    } catch(error) {
        console.error('Error:', error);
    }
}

async function deleteGroupException(id, phone) {
    try {
        const navigatorParameters = getNavigatorUrlParameters()
        const response = await fetch('../deleteGroupException?'+
                                    'id='+encodeURIComponent(id)+'&'+
                                    'phone='+encodeURIComponent(phone)+'&'+
                                    navigatorParameters
                                    );
        data = await response.json()
        return(data)
    } catch(error) {
        console.error('Error:', error);
        return({code: 300, description: error})
    }
}

// Function to update the group exception
async function updateGroupException(id, phone, WAGroupId, groupAlias, modeId) {
    try {
        const mode = await modeDescriptionfromId(modeId) 
        const navigatorParameters = getNavigatorUrlParameters()
        const response = await fetch('../updateGroupException?'+
                                    'id='+encodeURIComponent(id)+'&'+
                                    'phone='+encodeURIComponent(phone)+'&'+
                                    'WAGroupId='+encodeURIComponent(WAGroupId)+'&'+
                                    'mode='+encodeURIComponent(mode.mode)+'&'+
                                    'groupAlias='+encodeURIComponent(groupAlias)+'&'+
                                    navigatorParameters
                                    );
        data = await response.json()
        return(data[0].id)
    } catch(error) {
        console.error('Error:', error);
    }
}

async function insertGroupException(phone, WAGroupId, modeId, groupAlias) {
    try {
        const mode = await modeDescriptionfromId(modeId) 
        const navigatorParameters = getNavigatorUrlParameters()
        const response = await fetch('../insertGroupException?'+
                                    'phone='+encodeURIComponent(phone)+'&'+
                                    'WAGroupId='+encodeURIComponent(WAGroupId)+'&'+
                                    'mode='+encodeURIComponent(mode.mode)+'&'+
                                    'groupAlias='+encodeURIComponent(groupAlias)+'&'+
                                    navigatorParameters
                                    );
        data = await response.json()
        return(data[0].id)
    } catch(error) {
        console.error('Error:', error);
    }
}

// Function to update the user's general configuration
async function updateUserGeneralConfiguration(phone, newContactMode, newGroupMode, newTranscribeOutgoingMessages, newSummarizeMessages) {
    try {
        const contactMode = await modeDescriptionfromId(newContactMode) 
        const groupMode = await modeDescriptionfromId(newGroupMode) 
        const navigatorParameters = getNavigatorUrlParameters()
        const response = await fetch('../updateUserGeneralConfiguration?'+
                                    'phone='+encodeURIComponent(phone)+'&'+
                                    'contactMode='+encodeURIComponent(contactMode.mode)+'&'+
                                    'groupMode='+encodeURIComponent(groupMode.mode)+'&'+
                                    'transcribeOutgoingMessages='+encodeURIComponent(newTranscribeOutgoingMessages)+'&'+
                                    'summarizeMessages='+encodeURIComponent(newSummarizeMessages)+'&'+
                                    navigatorParameters
                                    );
        data = await response.json()
        return(data[0].id)
    } catch(error) {
        console.error('Error:', error);
    }
}

// Function to update the user's general configuration
async function updateUserSummaryConfiguration(phone, newSummarizeMessages, newMinSeconds, newMinWords, newUseBullets, newFullText) {
    try {
        const navigatorParameters = getNavigatorUrlParameters()
        const response = await fetch('../updateUserSummaryConfiguration?'+
                                    'phone='+encodeURIComponent(phone)+'&'+
                                    'summarizeMessages='+encodeURIComponent(newSummarizeMessages)+'&'+
                                    'minSeconds='+encodeURIComponent(newMinSeconds)+'&'+
                                    'minWords='+encodeURIComponent(newMinWords)+'&'+
                                    'useBullets='+encodeURIComponent(newUseBullets)+'&'+
                                    'fullText='+encodeURIComponent(newFullText)+'&'+
                                    navigatorParameters
                                    );
        data = await response.json()
        return(data[0].id)
    } catch(error) {
        console.error('Error:', error);
    }
}

async function updatePauseTranscriptions(email, newState ) { //newState: false to Reactivate transcriptions. true to pause transcriptions
    try {
        const response = await fetch('../updatePauseTranscriptions?'+
                                        'email='+encodeURIComponent(email)+'&'+
                                        'newState='+encodeURIComponent(newState)
                                        );
        const result = await response.json();        
    } catch(error) {
        console.error('Error in updatePauseTranscriptions:', error);
    }
}

// Function to get phone information
async function getPhoneInformation(phone) {
    console.log("Getting info of phone:", phone);        
    try {
        const response = await fetch(`../getPhoneInfo?phone=${encodeURIComponent(phone)}`);
        data = await response.json()
        return(data)        
    } catch(error) {
        console.error('Error:', error);
    }        
}

// Function to get phone contacts
async function getPhoneContacts(email) {
    try {
        const response = await fetch(`../getPhoneContacts?email=${encodeURIComponent(email)}`);
        data = await response.json()
        return(data)        
    } catch(error) {
        console.error('Error:', error);
    }        
}

// Function to get phone contacts for testing purposes
async function getPhoneContactsDummy(phone) {
    console.log("Getting contacts of phone:", phone);        
    try {

        const data = JSON.parse(`{
            "contacts": [
                {
                    "id": "5491199998888",
                    "name": "Gabriel Reiter"
                },
                {
                    "id": "5491199998881",
                    "name": "Oscar Guindzberg"
                }
            ],
            "groups": [
                {
                    "id": "120111111111111111",
                    "name": "dev group1"
                },
                {
                    "id": "120111111111111112",
                    "name": "dev group2"
                },
                {
                    "id": "120111111111111113",
                    "name": "dev group3"
                }
            ]
        }`)
        return(data)        
    } catch(error) {
        console.error('Error:', error);
    }        
}


function getModes() {
    const modes = [
        { code: 1, text: i18next.t('modeRespond') },
        { code: 2, text: i18next.t('modePrivate') },
        { code: 4, text: i18next.t('modeOff') }
    ];
    return(modes)
}

function getModeDescription(modeId) {
    switch (modeId) {
        case 1: return(i18next.t('modeRespond')); break;
        case 2: return(i18next.t('modePrivate')); break;
        case 3: return(i18next.t('modeRespondPrivate')); break;
        case 4: return(i18next.t('modeOff')); break;
    }
}

async function modeIdfromDescription(modeDescription) {
    try {
        const response = await fetch(`../getModeId?modeDescription=${encodeURIComponent(modeDescription)}`);
        data = await response.json()
        return('data', data)        
    } catch(error) {
        console.error('Error:', error);
    }        
}

async function modeDescriptionfromId(modeId) {
    try {
        const response = await fetch(`../getModeDescription?modeId=${encodeURIComponent(modeId)}`);
        data = await response.json()
        return(data)        
    } catch(error) {
        console.error('Error:', error);
    }        
}

async function getConnectedUsers() {
    try {
        const response = await fetch(`../getConnectedUsers`);
        data = await response.json()
        return(data)        
    } catch(error) {
        console.error('Error:', error);
    }        
}

async function getDisconnectedUsers() {
    try {
        const response = await fetch(`../getDisconnectedUsers`);
        data = await response.json()
        return(data)        
    } catch(error) {
        console.error('Error:', error);
    }        
}

async function getConfigurationByEmail(email) {
    try {
        const response = await fetch('../getConfigurationByEmail?'+
                                    'email='+encodeURIComponent(email)
                                    );
        data = await response.json()
        return(data)        
    } catch(error) {
        console.error('Error:', error);
        throw error;
    }        
}

// Function to insert user event log
async function insertUserEventLog(email, event, description) {
    console.log("user event log:", email, event, description); 
    try {
        const navigatorParameters = getNavigatorUrlParameters()
        let url = '../insertUserEventLog?';
        
        // Construct query parameters
        if (email != null) {
            url += 'email=' + encodeURIComponent(email) + '&';
        }
        if (event != null) {
            url += 'event=' + encodeURIComponent(event) + '&';
        }
        if (description != null) {
            url += 'description=' + encodeURIComponent(description) + '&';
        }

        // Remove the trailing '&' if it exists
        url = url.endsWith('&') ? url.slice(0, -1) : url;

        // Append navigator parameters
        url += (url.includes('?') ? '&' : '?') + navigatorParameters;

        const response = await fetch(url);
        data = await response.json()
        return(data)        
    } catch(error) {
        console.error('Error:', error);
    }        
}

async function registerUserTryingToConnect() {
    try {
        const navigatorParameters = await getNavigatorUrlParameters2()
        const response = await fetch('../registerUserTryingToConnect?'+
                                        navigatorParameters
                                    );
        data = await response.json()
        return(data)
    } catch(error) {
        console.error('Error:', error);
    }        
}

async function getInformationFromIP() {
    try {
        const response = await fetch('/getInformationFromIP');
        data = await response.json()
        return(data)        
    } catch(error) {
        console.error('Error:', error);
    }        
}

async function getUserEventLogsByEmail(email) {
    try {
        const response = await fetch('/getUserEventLogsByEmail?'+
                                    'email='+encodeURIComponent(email)
                                    );
        data = await response.json()
        return(data)        
    } catch(error) {
        console.error('Error:', error);
        throw error;
    }        
}

async function insertWaitlistUser() {
    try {
        const navigatorParameters = await getNavigatorUrlParameters2()
        const response = await fetch('../insertWaitlistUser?'+
                                        navigatorParameters
                                    );
        data = await response.json()
        return(data)        
    } catch(error) {
        console.error('Error:', error);
    }        
}

async function sendMobileConnectionEmail() {
    try {
        const navigatorParameters = await getNavigatorUrlParameters2()
        const response = await fetch('../sendMobileConnectionEmail?'+
                                        navigatorParameters
                                    );
        data = await response.json()
        return(data)        
    } catch(error) {
        console.error('Error:', error);
    }        
}