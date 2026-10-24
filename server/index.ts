import 'dotenv/config'
import { createApp } from './app'
import { config } from './extract'
const port = Number(process.env.PORT) || 4000
// Hosts need 0.0.0.0 to receive traffic; locally we stay on loopback unless HOST says otherwise.
const host = process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1')
const c = config()
if (!c.configured) console.warn('WARNING: AI_PROVIDER=gemini but GEMINI_API_KEY is not set. Extraction will fail until it is.')
createApp().listen(port, host, () => console.log(`Semestra API on http://${host}:${port} (${c.provider}, ${c.model})`))
