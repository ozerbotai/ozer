const I18nManager = require('./i18n-manager');

const templateWhatsappDisconnected = (name, language, textOrHtml) => {
    const i18n = new I18nManager();
    
    if (textOrHtml === 'html') {
      return(`
        <p>
        ${i18n.getWL('TEMPLATE_EMAIL_WHATSAPP_DISCONNECTED_GREETING', language)} ${name}:
        <br/>
        ${i18n.getWL('TEMPLATE_EMAIL_WHATSAPP_DISCONNECTED_DESCRIPTION_ONE', language)}
        <br/>
        ${i18n.getWL('TEMPLATE_EMAIL_WHATSAPP_DISCONNECTED_DESCRIPTION_TWO', language)}
        <br/>
        ${i18n.getWL('TEMPLATE_EMAIL_WHATSAPP_DISCONNECTED_DESCRIPTION_THREE', language)}
        <br/>
        ${i18n.getWL('TEMPLATE_EMAIL_WHATSAPP_DISCONNECTED_TEAM', language)}
        </p>
        `)
    } else {
      return(`
${i18n.getWL('TEMPLATE_EMAIL_WHATSAPP_DISCONNECTED_GREETING', language)} ${name}:
${i18n.getWL('TEMPLATE_EMAIL_WHATSAPP_DISCONNECTED_DESCRIPTION_ONE', language)}
${i18n.getWL('TEMPLATE_EMAIL_WHATSAPP_DISCONNECTED_DESCRIPTION_TWO', language)}
${i18n.getWL('TEMPLATE_EMAIL_WHATSAPP_DISCONNECTED_DESCRIPTION_THREE', language)}
${i18n.getWL('TEMPLATE_EMAIL_WHATSAPP_DISCONNECTED_TEAM', language)}
        `)
    }
  }

const templateNewUser = (name, language, textOrHtml) => {
  const i18n = new I18nManager();
  
  if (textOrHtml === 'html') {
    return(`
      <p>
      ${i18n.getWL('TEMPLATE_EMAIL_NEW_USER_GREETING', language)} ${name}:
      <br/>
      ${i18n.getWL('TEMPLATE_EMAIL_NEW_USER_DESCRIPTION', language)}
      <br/>
      ${i18n.getWL('TEMPLATE_EMAIL_NEW_USER_TEAM', language)}
      </p>
      `)
  } else {
    return(`
${i18n.getWL('TEMPLATE_EMAIL_NEW_USER_GREETING', language)} ${name}:
${i18n.getWL('TEMPLATE_EMAIL_NEW_USER_DESCRIPTION', language)}
${i18n.getWL('TEMPLATE_EMAIL_NEW_USER_TEAM', language)}
      `)
  }
}

module.exports = { templateWhatsappDisconnected, templateNewUser };