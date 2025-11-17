/**
 * Tier name mapping utility
 * Maps old tier names to new tier names as requested by James
 */

export const TIER_NAMES = {
  // Old names -> New names
  FAN: 'Minted',
  FOUNDER: 'Staked',
  PLAYER: 'Verified',
  // Additional tiers
  ASCENDANT: 'Ascendant',
  APEX: 'Apex',
} as const;

export const TIER_COLORS = {
  Minted: 'text-gray-400',
  Staked: 'text-blue-400',
  Verified: 'text-green-400',
  Ascendant: 'text-purple-400',
  Apex: 'text-yellow-400',
} as const;

export const TIER_ICONS = {
  Minted: '🪙',
  Staked: '💎',
  Verified: '✅',
  Ascendant: '⭐',
  Apex: '👑',
} as const;

/**
 * Convert old tier name to new tier name
 */
export function getTierDisplayName(tier: string | null | undefined): string {
  if (!tier) return 'Minted';
  
  // If it's already a new name, return it
  if (Object.values(TIER_NAMES).includes(tier as any)) {
    return tier;
  }
  
  // Map old name to new name
  return TIER_NAMES[tier as keyof typeof TIER_NAMES] || tier;
}

/**
 * Get tier color class
 */
export function getTierColor(tier: string | null | undefined): string {
  const displayName = getTierDisplayName(tier);
  return TIER_COLORS[displayName as keyof typeof TIER_COLORS] || 'text-gray-400';
}

/**
 * Get tier icon
 */
export function getTierIcon(tier: string | null | undefined): string {
  const displayName = getTierDisplayName(tier);
  return TIER_ICONS[displayName as keyof typeof TIER_ICONS] || '🪙';
}

/**
 * Get all tier options for dropdowns
 */
export function getAllTiers(): Array<{ value: string; label: string; icon: string }> {
  return Object.entries(TIER_NAMES).map(([oldName, newName]) => ({
    value: oldName,
    label: newName,
    icon: TIER_ICONS[newName as keyof typeof TIER_ICONS],
  }));
}
