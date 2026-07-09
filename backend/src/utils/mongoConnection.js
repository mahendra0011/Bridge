const dns = require('dns')
dns.setServers(['1.1.1.1', '8.8.8.8'])
const { URL } = require('url')
const https = require('https')

/**
 * Resolve SRV record via Google DNS-over-HTTPS (bypasses ISP DNS blocks).
 */
function resolveSrvViaDoH(hostname) {
  return new Promise((resolve, reject) => {
    const url = `https://dns.google/resolve?name=${hostname}&type=SRV`
    https.get(url, { headers: { Accept: 'application/dns-json' } }, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          if (json.Status !== 0) {
            return reject(new Error(`DNS status: ${json.Status}`))
          }
          if (!json.Answer || json.Answer.length === 0) {
            return reject(new Error('No SRV records found'))
          }
          const records = json.Answer.map(a => {
            // Format: "0 10 27017 cluster0-shard-00-00.avvnhcg.mongodb.net."
            const parts = a.data.split(' ')
            return {
              priority: parseInt(parts[0], 10),
              weight: parseInt(parts[1], 10),
              port: parseInt(parts[2], 10),
              name: parts[3].replace(/\.$/, '') // remove trailing dot
            }
          })
          resolve(records)
        } catch (e) {
          reject(e)
        }
      })
    }).on('error', reject)
  })
}

/**
 * If the URI is mongodb+srv://, resolve the SRV record via Google DNS-over-HTTPS
 * and convert it to a standard mongodb:// URI with all hosts/ports.
 * Falls back to the original URI if resolution fails.
 */
async function resolveMongoUri(uri) {
  try {
    const parsed = new URL(uri)

    // Only resolve SRV for mongodb+srv scheme
    if (!parsed.protocol.startsWith('mongodb+srv:')) {
      return uri
    }

    const srvName = `_mongodb._tcp.${parsed.hostname}`

    // Try 1: DNS-over-HTTPS via Google (most reliable, bypasses ISP DNS blocks)
    try {
      console.log('🔍 Resolving SRV via Google DNS-over-HTTPS:', srvName)
      const records = await resolveSrvViaDoH(srvName)

      const hosts = records
        .sort((a, b) => a.priority - b.priority || b.weight - a.weight)
        .map(r => `${r.name}:${r.port}`)
        .join(',')

      const authPart = parsed.username
        ? `${decodeURIComponent(parsed.username)}:${decodeURIComponent(parsed.password)}@`
        : ''

      const searchParams = new URLSearchParams(parsed.searchParams)
      const opts = searchParams.toString()

      // Atlas requires TLS when using non-SRV connection strings
      const tlsParam = opts ? '&ssl=true' : '?ssl=true'
      const resolved = `mongodb://${authPart}${hosts}${parsed.pathname}${opts ? '?' + opts + '&ssl=true' : '?ssl=true'}`
      console.log('✅ SRV resolved via DNS-over-HTTPS successfully')
      return resolved
    } catch (dohErr) {
      console.warn('⚠️ DoH failed:', dohErr.message)
    }

    // Try 2: Native DNS with custom servers
    try {
      dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1'])
      console.log('🔍 Resolving SRV via native DNS (Google):', srvName)
      const records = await dns.promises.resolveSrv(srvName)

      const hosts = records
        .sort((a, b) => a.priority - b.priority || b.weight - a.weight)
        .map(r => `${r.name}:${r.port}`)
        .join(',')

      const authPart = parsed.username
        ? `${decodeURIComponent(parsed.username)}:${decodeURIComponent(parsed.password)}@`
        : ''

      const searchParams = new URLSearchParams(parsed.searchParams)
      const opts = searchParams.toString()

      // Atlas requires TLS when using non-SRV connection strings
      const resolved = `mongodb://${authPart}${hosts}${parsed.pathname}${opts ? '?' + opts + '&ssl=true' : '?ssl=true'}`
      console.log('✅ SRV resolved via native DNS successfully')
      return resolved
    } catch (nativeErr) {
      console.warn('⚠️ Native DNS failed:', nativeErr.message)
    }

    // Final fallback: return original URI as-is
    console.warn('⚠️ All SRV resolution methods failed — using original +srv URI')
    return uri
  } catch (err) {
    console.warn('URI parse failed, using original:', err.message)
    return uri
  }
}

module.exports = { resolveMongoUri }

