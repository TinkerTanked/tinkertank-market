const GRAPH = 'https://graph.facebook.com/v25.0'
const CACHE_MS = 10 * 60 * 1000

interface InsightRow {
  campaign_id?: string
  campaign_name?: string
  spend?: string
  impressions?: string
  inline_link_clicks?: string
  actions?: { action_type: string; value: string }[]
  action_values?: { action_type: string; value: string }[]
}

export interface MetaAdsTotals {
  spend: number
  impressions: number
  linkClicks: number
  purchases: number
  purchaseValue: number
}

export interface MetaAdsSummary {
  last7: MetaAdsTotals
  last30: MetaAdsTotals
  campaigns: ({ id: string; name: string; status: string } & MetaAdsTotals)[]
}

// Meta's omni_purchase merges pixel and Conversions API purchases, so each sale counts once.
const PURCHASE_TYPES = ['omni_purchase', 'purchase', 'offsite_conversion.fb_pixel_purchase']

function pick(list: InsightRow['actions'], types: string[]) {
  for (const type of types) {
    const match = list?.find(entry => entry.action_type === type)
    if (match) return Number(match.value)
  }
  return 0
}

export function metaTotals(row: InsightRow | undefined): MetaAdsTotals {
  return {
    spend: Number(row?.spend ?? 0),
    impressions: Number(row?.impressions ?? 0),
    linkClicks: Number(row?.inline_link_clicks ?? 0),
    purchases: pick(row?.actions, PURCHASE_TYPES),
    purchaseValue: pick(row?.action_values, PURCHASE_TYPES)
  }
}

async function graph<T>(path: string, params: Record<string, string>, token: string): Promise<T> {
  const url = new URL(`${GRAPH}/${path}`)
  for (const [key, value] of Object.entries({ ...params, access_token: token })) url.searchParams.set(key, value)
  const response = await fetch(url, { signal: AbortSignal.timeout(8000), cache: 'no-store' })
  const body = await response.json()
  if (!response.ok || body.error) throw new Error(body.error?.message || `Meta API ${response.status}`)
  return body as T
}

let cache: { at: number; summary: MetaAdsSummary } | null = null

/** Ad spend and Meta-reported purchases for the last 7 and 30 days. Null when Meta isn't configured. */
export async function metaAdsSummary(): Promise<MetaAdsSummary | null> {
  const token = process.env.META_ADS_ACCESS_TOKEN
  const account = process.env.META_AD_ACCOUNT_ID?.replace(/^act_/, '')
  if (!token || !account) return null
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.summary

  const fields = 'spend,impressions,inline_link_clicks,actions,action_values'
  const [week, month, byCampaign, campaigns] = await Promise.all([
    graph<{ data: InsightRow[] }>(`act_${account}/insights`, { date_preset: 'last_7d', fields }, token),
    graph<{ data: InsightRow[] }>(`act_${account}/insights`, { date_preset: 'last_30d', fields }, token),
    graph<{ data: InsightRow[] }>(
      `act_${account}/insights`,
      { date_preset: 'last_30d', level: 'campaign', fields: `campaign_id,campaign_name,${fields}`, limit: '50' },
      token
    ),
    graph<{ data: { id: string; effective_status: string; stop_time?: string }[] }>(
      `act_${account}/campaigns`,
      { fields: 'effective_status,stop_time', limit: '100' },
      token
    )
  ])

  // A campaign past its end date still reports ACTIVE, so treat it as ended.
  const status = new Map(
    campaigns.data.map(campaign => [
      campaign.id,
      campaign.stop_time && new Date(campaign.stop_time) < new Date() ? 'ENDED' : campaign.effective_status
    ])
  )
  const summary: MetaAdsSummary = {
    last7: metaTotals(week.data[0]),
    last30: metaTotals(month.data[0]),
    campaigns: byCampaign.data
      .map(row => ({
        id: row.campaign_id ?? '',
        name: row.campaign_name ?? 'Campaign',
        status: status.get(row.campaign_id ?? '') ?? 'UNKNOWN',
        ...metaTotals(row)
      }))
      .filter(campaign => campaign.spend > 0)
      .sort((a, b) => b.spend - a.spend)
  }
  cache = { at: Date.now(), summary }
  return summary
}
