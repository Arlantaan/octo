// Contact channels, defined once and used across the site.

export const WHATSAPP_NUMBER = '220877872586'
export const WHATSAPP_DISPLAY = '+220 877 872 586'
export const WHATSAPP_GREETING = "Hi Abdulla! 👋 I found you on OctopusTech and I'd like to talk about a project."

/** WhatsApp click-to-chat link that opens the app with a friendly first message already typed */
export const whatsappLink = (text: string = WHATSAPP_GREETING) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
