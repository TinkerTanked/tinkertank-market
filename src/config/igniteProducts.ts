/**
 * Ignite Session Configuration
 * 
 * This file contains Ignite session definitions with both test and production Stripe IDs.
 * The correct IDs are selected based on the NEXT_PUBLIC_STRIPE_MODE environment variable.
 */

export interface IgniteSessionConfig {
  id: string
  name: string
  programType: 'in-school' | 'drop-off' | 'school-pickup'
  location: string
  address?: string
  dayOfWeek: string[]
  startTime: string
  endTime: string
  priceWeekly: number
  stripePriceId: string
  stripeProductId: string
}

// Stripe TEST mode IDs (for local development)
const TEST_STRIPE_IDS = {
  'ignite-balgowlah-wed': { priceId: 'price_1StKP9DqupgKyrhoQxEg01ua', productId: 'prod_Tr2UrvopQoseGC' },
  'ignite-balgowlah-thu': { priceId: 'price_1StKPADqupgKyrhoUmdMDcHc', productId: 'prod_Tr2UButkR3rLsu' },
  'ignite-ics-tue': { priceId: 'price_1StKPBDqupgKyrhoFBdlmoKk', productId: 'prod_Tr2USER37jHSqK' },
  'ignite-nb-monfri': { priceId: 'price_1StKPCDqupgKyrho8MVv42fB', productId: 'prod_Tr2U8LvoUYQpUW' },
  'ignite-nb-sat': { priceId: 'price_1StKPEDqupgKyrhomgKCSdXu', productId: 'prod_Tr2UV2dbzeRGem' },
  'ignite-brookvale-cc': { priceId: 'price_1StKPFDqupgKyrhoqs9xI4mj', productId: 'prod_Tr2UeutYss76YJ' },
  'ignite-manly-library': { priceId: 'price_1StKPGDqupgKyrhoqKltUzlP', productId: 'prod_Tr2UMLGLz5ASmm' },
  'ignite-brookvale-ps': { priceId: 'price_1StKPHDqupgKyrhoDoXly8g2', productId: 'prod_Tr2UsGEvnSNaK0' },
  'ignite-manly-village': { priceId: 'price_1StKPIDqupgKyrhoYd0u5j2S', productId: 'prod_Tr2UHCCqGtGvCB' },
  'ignite-nb-ps': { priceId: 'price_1StKPKDqupgKyrho5L0t4yPu', productId: 'prod_Tr2U80JbdBmEQS' },
  'ignite-redlands': { priceId: 'price_1StKPLDqupgKyrhoXcJwf3Bp', productId: 'prod_Tr2UjbbOsxA9Yu' },
  'ignite-stmarys': { priceId: 'price_1StKPMDqupgKyrho5Yb1KWKj', productId: 'prod_Tr2UU6GWX0k98g' }
} as const

// Stripe PRODUCTION mode IDs (for production deployment)
const PROD_STRIPE_IDS = {
  'ignite-balgowlah-wed': { priceId: 'price_1Su9JTDqupgKyrho9wIuGaqS', productId: 'prod_Trt5hst8hahf4U' },
  'ignite-balgowlah-thu': { priceId: 'price_1Su9JUDqupgKyrhob01PL3JS', productId: 'prod_Trt5EQZQcp1YJX' },
  'ignite-ics-tue': { priceId: 'price_1Su9JVDqupgKyrhozbrw1ER7', productId: 'prod_Trt5soXUfDu6Vq' },
  'ignite-nb-monfri': { priceId: 'price_1Su9JXDqupgKyrhoWRBAADxP', productId: 'prod_Trt5KoEzbHLSEk' },
  'ignite-nb-sat': { priceId: 'price_1Su9JYDqupgKyrhoZBqrL43R', productId: 'prod_Trt5rd49MqV1Pv' },
  'ignite-brookvale-cc': { priceId: 'price_1Su9JZDqupgKyrhobc0WCIRS', productId: 'prod_Trt5kBHgfTRNOY' },
  'ignite-manly-library': { priceId: 'price_1Su9JbDqupgKyrhoEkaPRyys', productId: 'prod_Trt5thpP2Vu8Ze' },
  'ignite-brookvale-ps': { priceId: 'price_1Su9JcDqupgKyrhoImgjMexo', productId: 'prod_Trt5nii5M9iQoF' },
  'ignite-manly-village': { priceId: 'price_1Su9JeDqupgKyrhoC822jky2', productId: 'prod_Trt5JJHA2nTXxV' },
  'ignite-nb-ps': { priceId: 'price_1Su9JfDqupgKyrhoeKneIv7H', productId: 'prod_Trt5Uer7uihqjb' },
  'ignite-redlands': { priceId: 'price_1Su9JgDqupgKyrhoudkyZNhg', productId: 'prod_Trt5IodbfvxFMA' },
  'ignite-stmarys': { priceId: 'price_1Su9JiDqupgKyrho6sG10bqE', productId: 'prod_Trt5Z8qkkm8dbm' }
} as const

type SessionId = keyof typeof TEST_STRIPE_IDS

function getStripeIds(sessionId: SessionId): { priceId: string; productId: string } {
  const isProduction = process.env.NEXT_PUBLIC_STRIPE_MODE === 'production'
  return isProduction ? PROD_STRIPE_IDS[sessionId] : TEST_STRIPE_IDS[sessionId]
}

// Base session data (without Stripe IDs)
const BASE_SESSIONS: Omit<IgniteSessionConfig, 'stripePriceId' | 'stripeProductId'>[] = [
  // In-School (green)
  {
    id: 'ignite-balgowlah-wed',
    name: 'In-School Ignite - Balgowlah Heights Public',
    programType: 'in-school',
    location: 'Balgowlah Heights Public',
    dayOfWeek: ['wednesday'],
    startTime: '12:45',
    endTime: '13:45',
    priceWeekly: 25.99
  },
  {
    id: 'ignite-balgowlah-thu',
    name: 'In-School Ignite - Balgowlah Heights Public',
    programType: 'in-school',
    location: 'Balgowlah Heights Public',
    dayOfWeek: ['thursday'],
    startTime: '15:45',
    endTime: '17:15',
    priceWeekly: 29.99
  },
  {
    id: 'ignite-ics-tue',
    name: 'In-School Ignite - International Chinese School',
    programType: 'in-school',
    location: 'International Chinese School',
    dayOfWeek: ['tuesday'],
    startTime: '16:00',
    endTime: '17:30',
    priceWeekly: 30.99
  },
  // Drop-Off Studio (blue)
  {
    id: 'ignite-nb-monfri',
    name: 'Drop-Off Studio Ignite - Neutral Bay',
    programType: 'drop-off',
    location: 'Neutral Bay Studio',
    address: '50 Yeo St, Neutral Bay NSW 2089',
    dayOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    startTime: '15:30',
    endTime: '17:30',
    priceWeekly: 39.99
  },
  {
    id: 'ignite-nb-sat',
    name: 'Drop-Off Studio Ignite - Neutral Bay',
    programType: 'drop-off',
    location: 'Neutral Bay Studio',
    address: '50 Yeo St, Neutral Bay NSW 2089',
    dayOfWeek: ['saturday'],
    startTime: '10:00',
    endTime: '12:00',
    priceWeekly: 39.99
  },
  {
    id: 'ignite-brookvale-cc',
    name: 'Drop-Off Studio Ignite - Brookvale Community Centre',
    programType: 'drop-off',
    location: 'Brookvale Community Centre',
    address: '2 Alfred Rd, Brookvale NSW 2100',
    dayOfWeek: ['monday'],
    startTime: '15:30',
    endTime: '17:30',
    priceWeekly: 39.99
  },
  {
    id: 'ignite-manly-library',
    name: 'Drop-Off Studio Ignite - Manly Creative Library',
    programType: 'drop-off',
    location: 'Manly Creative Library',
    address: '1 Market Ln, Manly NSW 2095',
    dayOfWeek: ['wednesday'],
    startTime: '15:30',
    endTime: '17:30',
    priceWeekly: 39.99
  },
  // School Pickup (orange)
  {
    id: 'ignite-brookvale-ps',
    name: 'School Pickup Ignite - Brookvale Public School',
    programType: 'school-pickup',
    location: 'Brookvale Public School',
    dayOfWeek: ['monday'],
    startTime: '15:00',
    endTime: '17:30',
    priceWeekly: 44.99
  },
  {
    id: 'ignite-manly-village',
    name: 'School Pickup Ignite - Manly Village Public School',
    programType: 'school-pickup',
    location: 'Manly Village Public School',
    dayOfWeek: ['wednesday'],
    startTime: '15:00',
    endTime: '17:30',
    priceWeekly: 54.99
  },
  {
    id: 'ignite-nb-ps',
    name: 'School Pickup Ignite - Neutral Bay Public School',
    programType: 'school-pickup',
    location: 'Neutral Bay Public School',
    dayOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    startTime: '15:00',
    endTime: '17:30',
    priceWeekly: 54.99
  },
  {
    id: 'ignite-redlands',
    name: 'School Pickup Ignite - Redlands School',
    programType: 'school-pickup',
    location: 'Redlands School',
    dayOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    startTime: '15:00',
    endTime: '17:30',
    priceWeekly: 54.99
  },
  {
    id: 'ignite-stmarys',
    name: 'School Pickup Ignite - St Marys Catholic School',
    programType: 'school-pickup',
    location: 'St Marys Catholic School',
    dayOfWeek: ['wednesday'],
    startTime: '15:00',
    endTime: '17:30',
    priceWeekly: 54.99
  }
]

// Build the full sessions list with correct Stripe IDs based on environment
export function getIgniteSessions(): IgniteSessionConfig[] {
  return BASE_SESSIONS.map(session => {
    const stripeIds = getStripeIds(session.id as SessionId)
    return {
      ...session,
      stripePriceId: stripeIds.priceId,
      stripeProductId: stripeIds.productId
    }
  })
}

// Export for use in components
export const IGNITE_SESSIONS = getIgniteSessions()
