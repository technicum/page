/**
 * Geocoding utility using Nominatim (OpenStreetMap) — free, no API key.
 * Rate limit: 1 req/sec (fine for background geocoding on site save).
 */
const axios = require('axios')
const HEADERS = { 'User-Agent': 'PageZaper/1.0 contact@pagezaper.com' }

/**
 * Geocode a city/address string to lat, lng, state.
 * @param {string} city
 * @returns {Promise<{lat:number, lng:number, state:string}|null>}
 */
async function geocodeCity(city) {
  if (!city || !city.trim()) return null
  try {
    const { data } = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q:              city.trim() + ', India',
        format:         'json',
        limit:          1,
        countrycodes:   'in',
        addressdetails: 1
      },
      headers: HEADERS,
      timeout: 8000
    })
    if (!data || !data.length) return null
    const r    = data[0]
    const addr = r.address || {}
    return {
      lat:   parseFloat(r.lat),
      lng:   parseFloat(r.lon),
      state: addr.state || ''
    }
  } catch (e) {
    return null
  }
}

/**
 * Location autocomplete: returns city/state suggestions for a query string.
 * @param {string} q
 * @returns {Promise<Array>}
 */
async function suggestLocations(q) {
  if (!q || !q.trim()) return []
  try {
    const { data } = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q:              q.trim() + ', India',
        format:         'json',
        limit:          6,
        countrycodes:   'in',
        addressdetails: 1
      },
      headers: HEADERS,
      timeout: 5000
    })
    return (data || []).map(r => {
      const addr  = r.address || {}
      const city  = addr.city || addr.town || addr.village || addr.municipality || addr.county || ''
      const state = addr.state || ''
      // Build a clean label
      const parts = [city, state].filter(Boolean)
      return {
        label: parts.join(', ') || r.display_name.split(',').slice(0,2).join(',').trim(),
        city,
        state,
        lat:   parseFloat(r.lat),
        lng:   parseFloat(r.lon),
        type:  addr.state_district ? 'district' : (city ? 'city' : 'state')
      }
    }).filter(r => r.city || r.state)
  } catch (e) {
    return []
  }
}

module.exports = { geocodeCity, suggestLocations }
