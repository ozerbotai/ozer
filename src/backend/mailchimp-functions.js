require('dotenv').config({ path: '.env.local' })
const crypto = require('crypto');
const mailchimp = require('@mailchimp/mailchimp_marketing');

const apiKey = process.env.MAILCHIMP_KEY || '';
const serverPrefix = process.env.MAILCHIMP_SERVER_PREFIX || '';
const listId = process.env.MAILCHIMP_LIST_ID || '';


mailchimp.setConfig({
  apiKey: apiKey,
  server: serverPrefix,
});

const addToMailchimpAudience = async ( email, firstName, lastName, language ) => {
  if (process.env.ENVIRONMENT === 'prod') {
    if (!email) {
      return { success: false, error: "Email is required." };
    }

    const isoLanguage = language.slice(0, 2).toLowerCase();

    try {
      const response = await mailchimp.lists.addListMember(listId, {
        email_address: email,
        status: 'subscribed',
        merge_fields: {
          FNAME: firstName,
          LNAME: lastName,
          LANGUAGE: isoLanguage,
        },
      });

      console.log(`User ${email} added to audience successfully.`, response.merge_fields);
      return { success: true };
    } catch (error) {
      console.error(`Error adding user ${email} to audience:`, error.response.body || error.message);
      return { success: false };
    }
  }
};

// Checks if an email is subscribed to a Mailchimp list, returns `true` if subscribed, `false` otherwise.
const isSubscribedToMailchimp = async (email) => {
  // Generate the MD5 hash of the lowercase email address
  const emailHash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');

  try {
    const response = await mailchimp.lists.getListMember(listId, emailHash);

    if (response.status === 'subscribed') {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    if (error.status === 404) {
      return false;
    }
    console.error(`Error checking subscription status for ${email}:`, error.response.body || error.message);
    return false;
  }
};


module.exports = { addToMailchimpAudience, isSubscribedToMailchimp };