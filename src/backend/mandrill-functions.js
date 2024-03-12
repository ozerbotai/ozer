const MailChimp = require('@mailchimp/mailchimp_transactional');
const emailTemplates = require('./email-templates.js')
const languageSelectionLogic = require('./language-selection-logic.js');
const supabase = require('./supabase.js');
const I18nManager = require('./i18n-manager.js');
require('dotenv').config({ path: '.env.local' })

const API_KEY = process.env.MANDRILL_KEY || '';
const mandrill = MailChimp(API_KEY);

const sendWhatsappDisconnectedEmail = async ( email ) => {
    if (process.env.MAILS_ACTIVE === 'YES') {
        const i18n = new I18nManager();

        const config = await supabase.getConfigurationByEmail(email)

        try {
            const response = await mandrill.messages.send({
                message: {
                    to: [ {email: config.email, type: 'to'} ],
                    from_name: process.env.FROM_NAME_MANDRILL,
                    from_email: process.env.FROM_EMAIL_MANDRILL,
                    bcc_address: process.env.OZER_TEAM_EMAIL,
                    subject: i18n.getWL('TEMPLATE_EMAIL_WHATSAPP_DISCONNECTED_SUBJECT', config.language),
                    text: emailTemplates.templateWhatsappDisconnected(config.given_name, config.language, 'text'),
                    html: emailTemplates.templateWhatsappDisconnected(config.given_name, config.language, 'html'),
                    tags: ['whatsapp_disconnected', config.language.toLowerCase(), process.env.ENVIRONMENT]
                },
            });

            if (response?.[0]?.status === 'rejected') {
                throw new Error('Email rejected by Mandrill');
            }
            
            console.log(`Whatsapp disconnected email sent: to ${config.email}` + JSON.stringify(response));
            return { success: true };
        } catch (error) {
            console.log(`Error sending whatsapp disconnected email to ${config.email}:`, error);
            return { success: false };
        }
    } else {
        return
    }
};

const sendServerUpEmail = async () => {
    if (process.env.MAILS_ACTIVE === 'YES') {
        try {
            const response = await mandrill.messages.send({
                message: {
                    to: [ {email: process.env.OZER_TEAM_EMAIL, type: 'to'} ],
                    from_name: process.env.FROM_NAME_MANDRILL,
                    from_email: process.env.FROM_EMAIL_MANDRILL,
                    subject: 'Server is Up - ' + process.env.ENVIRONMENT + ' - ' + new Date().toISOString(),
                    text: 'The server went up.',
                    tags: ['server_went_up', process.env.ENVIRONMENT]
                },
            });

            if (response?.[0]?.status === 'rejected') {
                throw new Error('Email rejected by Mandrill');
            }
            
            console.log('Server up email sent:' + JSON.stringify(response));
            return { success: true };
        } catch (error) {
            console.log('Error sending server up email:', error);
            return { success: false };
        }
    } else {
        return
    }
};

const sendServerDownEmail = async () => {
    if (process.env.MAILS_ACTIVE === 'YES') {
        try {
            const response = await mandrill.messages.send({
                message: {
                    to: [ {email: process.env.OZER_TEAM_EMAIL, type: 'to'} ],
                    from_name: process.env.FROM_NAME_MANDRILL,
                    from_email: process.env.FROM_EMAIL_MANDRILL,
                    subject: 'Server is Down - ' + process.env.ENVIRONMENT + ' - ' + new Date().toISOString(),
                    text: 'The server went down.',
                    tags: ['server_went_down', process.env.ENVIRONMENT]
                },
            });

            if (response?.[0]?.status === 'rejected') {
                throw new Error('Email rejected by Mandrill');
            }
            
            console.log('Server down email sent:' + JSON.stringify(response));
            return { success: true };
        } catch (error) {
            console.log('Error sending server down email:', error);
            return { success: false };
        }
    } else {
        return
    }
};

const sendNewUserEmail = async ( email ) => {
    if (process.env.MAILS_ACTIVE === 'YES') {
        const i18n = new I18nManager();

        const config = await supabase.getConfigurationByEmail(email)

        try {
            const response = await mandrill.messages.send({
                message: {
                    to: [ {email: config.email, type: 'to'} ],
                    from_name: process.env.FROM_NAME_MANDRILL,
                    from_email: process.env.FROM_EMAIL_MANDRILL,
                    bcc_address: process.env.OZER_TEAM_EMAIL,
                    subject: i18n.getWL('TEMPLATE_EMAIL_NEW_USER_SUBJECT', config.language),
                    text: emailTemplates.templateNewUser(config.given_name, config.language, 'text'),
                    html: emailTemplates.templateNewUser(config.given_name, config.language, 'html'),
                    tags: ['new_user', config.language.toLowerCase(), process.env.ENVIRONMENT]
                },
            });

            if (response?.[0]?.status === 'rejected') {
                throw new Error('Email rejected by Mandrill');
            }
            
            console.log(`New user email sent: to ${config.email}` + JSON.stringify(response));
            return { success: true };
        } catch (error) {
            console.log(`Error sending new user email to ${config.email}:`, error);
            return { success: false };
        }
    } else {
        return
    }
};

const sendMobileConnectionEmail = async ( email, givenName, browserLanguage ) => {
    if (process.env.MAILS_ACTIVE === 'YES') {
        const i18n = new I18nManager();

        try {
            const userLanguage = languageSelectionLogic.detectbrowserLanguage(browserLanguage);
            const templateName = userLanguage === 'EN' ? 'mobile-signups-immediate-english' : 'mobile-signups-immediate-spanish';

            const response = await mandrill.messages.sendTemplate({
                template_name: templateName,
                template_content: [],
                message: {
                    to: [ {email: email, type: 'to'} ],
                    from_name: process.env.FROM_NAME_MANDRILL,
                    from_email: process.env.FROM_EMAIL_MANDRILL,
                    subject: `${givenName}, ${i18n.getWL('TEMPLATE_EMAIL_MOBILE_CONNECTION_SUBJECT', userLanguage)}`,
                    global_merge_vars: [
                        {
                            name: 'MC_PREVIEW_TEXT',
                            content: i18n.getWL('TEMPLATE_EMAIL_MOBILE_CONNECTION_SUBTITLE', userLanguage)
                        },
                        {
                            name: 'FNAME',
                            content: givenName
                        }
                    ],
                    tags: ['mobile_signups_immediate', userLanguage.toLowerCase(), process.env.ENVIRONMENT]
                },
            });

            if (response?.[0]?.status === 'rejected') {
                throw new Error('Email rejected by Mandrill');
            }
            
            console.log(`Mobile connection email sent: to ${email}` + JSON.stringify(response));
            return { success: true };
        } catch (error) {
            console.log(`Error sending mobile connection email to ${email}:`, error);
            return { success: false };
        }
    } else {
        return
    }
};

const sendUnfinishedSignupDaysAgoEmail = async (email, givenName, browserLanguage) => {
    if (process.env.MAILS_ACTIVE === 'YES') {
        const i18n = new I18nManager();
        try {
            const userLanguage = languageSelectionLogic.detectbrowserLanguage(browserLanguage);
            const templateName = userLanguage === 'EN' ? 'unifinished-signup-days-ago-english' : 'unifinished-signup-days-ago-spanish';

            const unsubscribeLink = `https://bot.${process.env.MAILCHIMP_SERVER_PREFIX}.list-manage.com/unsubscribe?u=${process.env.MAILCHIMP_USER_ID}&id=${process.env.MAILCHIMP_LIST_ID}`;

            const response = await mandrill.messages.sendTemplate({
                template_name: templateName,
                template_content: [],
                message: {
                    to: [{ email: email, type: 'to' }],
                    from_name: process.env.FROM_NAME_MANDRILL,
                    from_email: process.env.FROM_EMAIL_MANDRILL,
                    subject: `${givenName}, ${i18n.getWL('TEMPLATE_EMAIL_UNFINISHED_SIGNUP_DAYS_AGO_SUBJECT', userLanguage)}`,
                    global_merge_vars: [
                        {
                            name: 'MC_PREVIEW_TEXT',
                            content: i18n.getWL('TEMPLATE_EMAIL_UNFINISHED_SIGNUP_DAYS_AGO_SUBTITLE', userLanguage)
                        },
                        {
                            name: 'FNAME',
                            content: givenName
                        },
                        {
                            name: 'UNSUB_LINK',
                            content: unsubscribeLink
                        }
                    ],
                    tags: ['unfinished_signup_days_ago', userLanguage.toLowerCase(), process.env.ENVIRONMENT]
                },
            });

            if (response?.[0]?.status === 'rejected') {
                throw new Error('Email rejected by Mandrill');
            }
            
            console.log(`Unfinished sign up days ago email sent: to ${email} ` + JSON.stringify(response));
            return { success: true };
        } catch (error) {
            console.log(`Error sending Unfinished sign up days ago email to ${email}: `, error);
            return { success: false };
        }
    }
};

module.exports = { sendWhatsappDisconnectedEmail, sendServerUpEmail, sendServerDownEmail, sendNewUserEmail, sendMobileConnectionEmail, sendUnfinishedSignupDaysAgoEmail };