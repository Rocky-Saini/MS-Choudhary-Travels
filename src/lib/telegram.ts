const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8833877568:AAE9ENgti6zSGBs2I9zspih9SSb47cqPGDk'
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '1497012506'

export async function sendTelegramNotification(message: string) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      }),
    })
  } catch (error) {
    console.error('Telegram notification failed:', error)
  }
}
