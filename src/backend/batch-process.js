require('dotenv').config({ path: '.env.local' })
const mandrillFunctions = require('./mandrill-functions.js');
const mailchimpFunctions = require('./mailchimp-functions.js');
const supabase = require('./supabase.js');

let batchProcessTimoutId;
let batchProcessIntervalId;

exports.startBatchProcess = function () {
    // Schedule the email sending to run every day at 10:00 AM
    const DAILY_BATCH_PROCESS_HOURS = 10;
    const DAILY_BATCH_PROCESS_MINUTES = 0;

    const now = new Date();
    const nextScheduledTime = new Date();
    
    // Set the time to the specified hours and minutes
    nextScheduledTime.setHours(DAILY_BATCH_PROCESS_HOURS, DAILY_BATCH_PROCESS_MINUTES, 0, 0);
    // If the specified time is already passed today, schedule for tomorrow
    if (now > nextScheduledTime) {
        nextScheduledTime.setDate(nextScheduledTime.getDate() + 1);
    }
    // Calculate the time difference in milliseconds until the specified time
    const timeUntilNextScheduledTime = nextScheduledTime - now;
    // Use setTimeout to wait until the specified time
    batchProcessTimoutId = setTimeout(() => {
        executeBatchProcess()        
        // Run the batch process every 1 day
        const oneDayInMillis = 24 * 60 * 60 * 1000;
        batchProcessIntervalId = setInterval(() => executeBatchProcess(), oneDayInMillis);
    }, timeUntilNextScheduledTime);
}

exports.stopBatchProcess = function () {
    clearTimeout(batchProcessTimoutId);
    clearInterval(batchProcessIntervalId);
}


function executeBatchProcess() {
    console.log('Running the batch process...');
    sendUnfinishedSignupDaysAgoEmails();
}


async function sendUnfinishedSignupDaysAgoEmails () {
    const daysAgoList = getDaysAgoList();

    // If there are no days to process (Saturday or Sunday), do nothing
    if (daysAgoList.length === 0) {
        return;
    }

    for (const daysAgo of daysAgoList) {
        const usersToSendEmail = await supabase.getUnfinishedSignupsDaysAgo(daysAgo);
        for (const user of usersToSendEmail) {
            const { email, given_name, browser_language } = user;
            const isSubscribedToMailchimp = await mailchimpFunctions.isSubscribedToMailchimp(email);
            if (isSubscribedToMailchimp) {
                try {
                    await mandrillFunctions.sendUnfinishedSignupDaysAgoEmail(email, given_name, browser_language);
                } catch (error) {
                    console.error(`Error sending email to ${email}: `, error);
                }
            }
        }
    }
};

// Returns a list of days ago to process based on the current day of the week.
// Weekdays return specific days ago for unfinished signups, while weekends return an empty list.
const getDaysAgoList = () => {
    const UNFINISHED_SIGNUP_DAYS_AGO = 4
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    switch(dayOfWeek){
        case 0:
            // Sunday
            return []
        case 1:
            // Monday
            return [UNFINISHED_SIGNUP_DAYS_AGO, UNFINISHED_SIGNUP_DAYS_AGO + 1]
        case 2:
            // Tuesday
            return [UNFINISHED_SIGNUP_DAYS_AGO]
        case 3:
            // Wednesday
            return [UNFINISHED_SIGNUP_DAYS_AGO]
        case 4:
            // Thursday
            return [UNFINISHED_SIGNUP_DAYS_AGO]
        case 5:
            // Friday
            return [UNFINISHED_SIGNUP_DAYS_AGO, UNFINISHED_SIGNUP_DAYS_AGO - 1]
        case 6:
            // Saturday
            return []   
    }
};