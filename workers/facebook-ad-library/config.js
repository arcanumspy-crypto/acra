const defaultNiches = [
  { name: 'Emagrecimento', query: 'emagrecimento', category: 'Emagrecimento', country: 'BR' },
  { name: 'Finanças', query: 'investimento', category: 'Finanças', country: 'BR' },
  { name: 'Saúde', query: 'saúde', category: 'Saúde', country: 'BR' }
]

function parseNiches() {
  if (!process.env.FB_SCRAPER_NICHES) return defaultNiches
  try {
    const parsed = JSON.parse(process.env.FB_SCRAPER_NICHES)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item) => ({
        name: item.name || item.niche || 'Nicho',
        query: item.query || item.name || 'marketing',
        category: item.category || item.name || 'Geral',
        country: item.country || process.env.FB_SCRAPER_COUNTRY || 'BR'
      }))
    }
  } catch (error) {
    console.warn('FB_SCRAPER_NICHES inválido, usando lista padrão.', error)
  }
  return defaultNiches
}

module.exports = {
  schedule: process.env.FB_SCRAPER_CRON || '*/2 * * * *',
  defaultCountry: process.env.FB_SCRAPER_COUNTRY || 'BR',
  maxAdsPerNiche: Number(process.env.FB_SCRAPER_MAX_ADS || 15),
  waitForResultsMs: Number(process.env.FB_SCRAPER_WAIT_MS || 12000),
  niches: parseNiches()
}


