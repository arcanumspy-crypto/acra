const path = require('path')
const fs = require('fs/promises')
const { chromium } = require('playwright')
const cron = require('node-cron')
const config = require('./config')

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119 Safari/537.36'
const OUTPUT_DIR = path.join(__dirname, '..', '..', 'tmp', 'facebook-ad-library')
const API_URL = process.env.SCRAPER_API_URL || 'http://localhost:3000/api/facebook-ads/import'
const API_SECRET = process.env.SCRAPER_API_SECRET
const RUN_ONCE = process.env.SCRAPER_RUN_ONCE === 'true'
const seenAds = new Map()

async function runCycle() {
  for (const niche of config.niches) {
    try {
      console.log(`🔍 Coletando anúncios para "${niche.name}" (${niche.query})...`)
      const ads = await scrapeNiche(niche)
      if (!ads.length) {
        console.warn(`⚠️ Nenhum anúncio encontrado para ${niche.name}`)
        continue
      }
      const filePath = await persistSnapshot(niche.name, ads)
      console.log(`💾 Snapshot salvo em ${filePath}`)
      await sendToBackend(niche, ads)
    } catch (error) {
      console.error(`❌ Erro ao processar o nicho ${niche.name}:`, error.message)
    }
  }
}

async function scrapeNiche(niche) {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ userAgent: USER_AGENT })
  const page = await context.newPage()
  const country = niche.country || config.defaultCountry
  const searchUrl = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=${country}&q=${encodeURIComponent(niche.query)}`

  try {
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForTimeout(config.waitForResultsMs)
    await autoScroll(page)

    const rawAds = await page.evaluate((maxAds) => {
      const cards = Array.from(document.querySelectorAll('[data-ad-preview-id]'))
      return cards.slice(0, maxAds).map((card) => {
        const adId = card.getAttribute('data-ad-preview-id') || card.dataset.adPreviewId || Math.random().toString(36).slice(2)
        const adTextNode =
          card.querySelector('[data-ad-preview-detail="ad_creative_body_text"]') ||
          card.querySelector('[data-ad-preview-detail="ad_creative_body"]') ||
          card.querySelector('[data-test-id="ad-library-ad-message"]') ||
          card.querySelector('[dir="auto"]')
        const creativeNodes = card.querySelectorAll('img[src], video[src], video source[src], img[data-src]')
        const creativeAssets = Array.from(creativeNodes).map((node) => {
          const tag = node.tagName?.toLowerCase()
          const src = node.src || node.currentSrc || node.getAttribute('data-src')
          if (!src) return null
          const type = tag === 'video' ? 'video' : 'image'
          return { url: src, type }
        }).filter(Boolean)

        const landingAnchor =
          card.querySelector('a[href*="l.facebook.com/l.php"]') ||
          card.querySelector('a[rel="noopener nofollow"]')

        const pageAnchor =
          card.querySelector('[data-pagelet*="PageHeader"] a[href*="facebook.com"]') ||
          card.querySelector('a[aria-label][href*="facebook.com"]')

        const timingBlock = card.querySelector('[data-ad-preview-detail="ad_delivery_start_end"]')
        const impressionsBlock = card.querySelector('[data-ad-preview-detail="impressions"]')

        return {
          platformId: adId,
          adUrl: `https://www.facebook.com/ads/library/?id=${adId}`,
          adText: adTextNode?.innerText?.trim() || '',
          creativeAssets,
          landingPageUrl: landingAnchor?.href || null,
          pageName: pageAnchor?.textContent?.trim() || null,
          pageProfileUrl: pageAnchor?.href || null,
          runStatus: timingBlock?.textContent?.trim() || null,
          impressions: impressionsBlock?.textContent?.trim() || null,
          rawHtml: card.outerHTML.slice(0, 8000)
        }
      })
    }, config.maxAdsPerNiche)

    return rawAds
      .filter((ad) => ad.creativeAssets?.length)
      .map((ad) => {
        const dedupedAssets = dedupeCreatives(ad.creativeAssets)
        const runCount = registerAdRun(ad.platformId)
        return {
          platformId: ad.platformId,
          adUrl: ad.adUrl,
          adText: sanitizeText(ad.adText),
          pageName: ad.pageName,
          pageProfileUrl: ad.pageProfileUrl,
          landingPageUrl: decodeLandingUrl(ad.landingPageUrl),
          creativeAssets: dedupedAssets,
          runStatus: ad.runStatus,
          impressions: ad.impressions,
          country,
          isLikelyScaled: dedupedAssets.length >= 3 || runCount >= 3,
          raw: {
            htmlSample: ad.rawHtml
          }
        }
      })
  } finally {
    await browser.close()
  }
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0
      const distance = 600
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight
        window.scrollBy(0, distance)
        totalHeight += distance
        if (totalHeight >= scrollHeight) {
          clearInterval(timer)
          resolve(null)
        }
      }, 400)
    })
  })
}

function dedupeCreatives(assets) {
  const seen = new Set()
  const result = []
  for (const asset of assets) {
    if (!asset?.url) continue
    if (seen.has(asset.url)) continue
    seen.add(asset.url)
    result.push(asset)
  }
  return result
}

function decodeLandingUrl(url) {
  if (!url) return null
  try {
    const parsed = new URL(url)
    const redirect = parsed.searchParams.get('u')
    if (redirect) {
      return decodeURIComponent(redirect)
    }
    return url
  } catch {
    return url
  }
}

function sanitizeText(text) {
  if (!text) return null
  return text.replace(/\s+/g, ' ').trim().slice(0, 1000)
}

function registerAdRun(platformId) {
  const next = (seenAds.get(platformId) || 0) + 1
  seenAds.set(platformId, next)
  if (seenAds.size > 500) {
    const firstKey = seenAds.keys().next().value
    seenAds.delete(firstKey)
  }
  return next
}

async function persistSnapshot(nicheName, ads) {
  await fs.mkdir(OUTPUT_DIR, { recursive: true })
  const slug = nicheName.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')
  const file = path.join(OUTPUT_DIR, `${Date.now()}-${slug || 'niche'}.json`)
  const payload = {
    niche: nicheName,
    collectedAt: new Date().toISOString(),
    ads
  }
  await fs.writeFile(file, JSON.stringify(payload, null, 2), 'utf-8')
  return file
}

async function sendToBackend(niche, ads) {
  if (!API_SECRET) {
    throw new Error('SCRAPER_API_SECRET não configurado. Configure antes de enviar os dados.')
  }

  const body = {
    category: niche.category,
    niche: niche.name,
    country: niche.country || config.defaultCountry,
    source: 'facebook',
    ads
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-scraper-secret': API_SECRET
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`API respondeu ${response.status}: ${errorBody}`)
  }

  const json = await response.json()
  console.log(`✅ ${niche.name}: ${json.processed} anúncios enviados para a API.`)
  return json
}

function startScheduler() {
  if (RUN_ONCE) {
    runCycle().then(() => {
      console.log('🛑 Execução única finalizada.')
      process.exit(0)
    })
    return
  }

  console.log(`⏱️ Scheduler ativo: ${config.schedule}`)
  runCycle()
  cron.schedule(config.schedule, () => {
    runCycle().catch((error) => {
      console.error('Erro na execução agendada:', error.message)
    })
  })
}

if (require.main === module) {
  startScheduler()
}

module.exports = {
  runCycle,
  scrapeNiche
}


