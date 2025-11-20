// Tier utility functions for GoalCoin MVP

export type TierType = 'base' | 'staked' | 'hidden';

export interface TierInfo {
  name: string;
  displayName: string;
  price: number;
  burnMultiplier: number;
  xpMultiplier: number;
  streakCap: number;
  badge: string;
  visible: boolean;
}

export const TIER_CONFIG: Record<string, TierInfo> = {
  '19': {
    name: 'base',
    displayName: 'Base Member',
    price: 19,
    burnMultiplier: 1.00,
    xpMultiplier: 1.00,
    streakCap: 5,
    badge: 'Base Member',
    visible: true,
  },
  '35': {
    name: 'staked',
    displayName: 'Staked Member',
    price: 35,
    burnMultiplier: 1.20,
    xpMultiplier: 1.10,
    streakCap: 7,
    badge: 'Staked Member',
    visible: true,
  },
  '49': {
    name: 'hidden',
    displayName: 'Premium',
    price: 49,
    burnMultiplier: 1.50,
    xpMultiplier: 1.20,
    streakCap: 10,
    badge: 'Premium',
    visible: false, // HIDDEN FOR MVP
  },
};

export function getTierInfo(paymentTier?: string | number): TierInfo {
  const tierKey = paymentTier?.toString() || '19';
  return TIER_CONFIG[tierKey] || TIER_CONFIG['19'];
}

export function getTierBadge(paymentTier?: string | number): string {
  return getTierInfo(paymentTier).badge;
}

export function getBurnMultiplier(paymentTier?: string | number): number {
  return getTierInfo(paymentTier).burnMultiplier;
}

export function getXPMultiplier(paymentTier?: string | number): number {
  return getTierInfo(paymentTier).xpMultiplier;
}

export function getStreakCap(paymentTier?: string | number): number {
  return getTierInfo(paymentTier).streakCap;
}

export function isStakedMember(paymentTier?: string | number): boolean {
  return getTierInfo(paymentTier).name === 'staked';
}

export function getVisibleTiers(): TierInfo[] {
  return Object.values(TIER_CONFIG).filter(tier => tier.visible);
}
