import type {
  ReferralCampaign,
  ReferralEligibilityResponse,
  ReferralRedemptionsResponse,
  ReferrerRewardInfo,
} from '../oauth/types.js'

export async function fetchReferralEligibility(
  _campaign: ReferralCampaign = 'claude_code_guest_pass',
): Promise<ReferralEligibilityResponse> {
  return { eligible: false } as unknown as ReferralEligibilityResponse
}

export async function fetchReferralRedemptions(
  _campaign = 'claude_code_guest_pass',
): Promise<ReferralRedemptionsResponse> {
  return { redemptions: [] } as unknown as ReferralRedemptionsResponse
}

export function checkCachedPassesEligibility(): {
  eligible: boolean
  needsRefresh: boolean
  hasCache: boolean
} {
  return {
    eligible: false,
    needsRefresh: false,
    hasCache: false,
  }
}

export function formatCreditAmount(_reward: ReferrerRewardInfo): string {
  return '$0'
}

export function getCachedReferrerReward(): ReferrerRewardInfo | null {
  return null
}

export function getCachedRemainingPasses(): number | null {
  return null
}

export async function fetchAndStorePassesEligibility(): Promise<ReferralEligibilityResponse | null> {
  return null
}

export async function getCachedOrFetchPassesEligibility(): Promise<ReferralEligibilityResponse | null> {
  return null
}

export async function prefetchPassesEligibility(): Promise<void> {}
