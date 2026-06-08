import { setDefaultResultOrder } from 'node:dns'

// Node's fetch (undici) may try IPv6 first and hang for 10s when IPv6 is broken
// on the host/network. Forcing IPv4-first resolution fixes connect timeouts to
// api.telegram.org. (curl worked because it uses IPv4.)
try {
  setDefaultResultOrder('ipv4first')
} catch {
  // ignore — not critical if it fails
}

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8833877568:AAE9ENgti6zSGBs2I9zspih9SSb47cqPGDk'
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '1497012506'

export async function sendTelegramNotification(message: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`

  const send = async (body: Record<string, unknown>) => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000)
    try {
      return await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timer)
    }
  }

  try {
    // First attempt with Markdown formatting
    const res = await send({ chat_id: TELEGRAM_CHAT_ID, text: message, parse_mode: 'Markdown' })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Telegram Markdown send failed:', res.status, errText)
      // Markdown parsing can fail on special characters — retry as plain text so the
      // admin still gets notified.
      const plainRes = await send({ chat_id: TELEGRAM_CHAT_ID, text: message })
      if (!plainRes.ok) {
        console.error('Telegram plain-text send failed:', plainRes.status, await plainRes.text())
      }
    }
  } catch (error) {
    console.error('Telegram notification failed:', error)
  }
}
