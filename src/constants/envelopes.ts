/**
 * The seven built-in budget envelopes, the four dashboard groups, and the
 * helpers that turn a household-made envelope into the same shape.
 *
 * The seven are app constants, not user data: their ids, names, icons and
 * grouping live here. Custom envelopes are rows in `household_envelopes` and
 * arrive with the snapshot; their uuid is used as `EnvelopeId`, so the plan,
 * expense sheet and history all treat both kinds the same way.
 */

import type { LucideIcon } from 'lucide-react-native';
import {
  Briefcase,
  Bus,
  Car,
  Gift,
  GraduationCap,
  Heart,
  House,
  PawPrint,
  PiggyBank,
  Pill,
  Plane,
  ShoppingBag,
  ShoppingBasket,
  Wallet,
  Wifi,
  Zap,
} from 'lucide-react-native';

import type { CustomEnvelope, EnvelopeIcon, EnvelopeLimits } from '@/domain/types';
import type { ThemeColors } from '@/theme';

export type BuiltInEnvelopeId =
  | 'room-rent'
  | 'utilities'
  | 'internet'
  | 'groceries'
  | 'commute'
  | 'her-kharcha'
  | 'medicine';

/**
 * Any envelope key: one of the seven built-ins or a custom envelope's uuid.
 * The `string & {}` arm keeps editor completions for the seven while letting a
 * database-minted uuid through without a cast.
 */
export type EnvelopeId = BuiltInEnvelopeId | (string & {});

export type EnvelopeGroupId = 'groceries' | 'nest' | 'her' | 'commuteCare';

export type Tone = 'lilac' | 'amber' | 'mint' | 'rose';

export interface Envelope {
  id: EnvelopeId;
  /** Full name used on the Monthly Plan screen. */
  name: string;
  /** Label used on dashboard cards and chips. */
  shortName: string;
  /** Default monthly limit in whole PKR; 0 for a custom envelope. */
  limit: number;
  /** Built-in group, or null for a household-made envelope. */
  group: EnvelopeGroupId | null;
  /** Her Personal Kharcha is the only envelope that belongs to one partner. */
  isHers: boolean;
  tone: Tone;
  icon: LucideIcon;
}

export interface EnvelopeGroup {
  id: EnvelopeGroupId;
  name: string;
  envelopeIds: EnvelopeId[];
  tone: Tone;
  icon: LucideIcon;
}

/** Default household income in whole PKR. */
export const DEFAULT_INCOME = 60_000;

export const ENVELOPES: readonly Envelope[] = [
  {
    id: 'room-rent',
    name: 'Room Rent',
    shortName: 'Room Rent',
    limit: 18_000,
    group: 'nest',
    isHers: false,
    tone: 'lilac',
    icon: House,
  },
  {
    id: 'utilities',
    name: 'Electricity, Gas & Water',
    shortName: 'Utilities',
    limit: 6_000,
    group: 'nest',
    isHers: false,
    tone: 'amber',
    icon: Zap,
  },
  {
    id: 'internet',
    name: 'Internet & Mobile',
    shortName: 'Internet',
    limit: 5_030,
    group: 'nest',
    isHers: false,
    tone: 'lilac',
    icon: Wifi,
  },
  {
    id: 'groceries',
    name: 'Kitchen & Groceries',
    shortName: 'Groceries & Kitchen',
    limit: 15_000,
    group: 'groceries',
    isHers: false,
    tone: 'mint',
    icon: ShoppingBasket,
  },
  {
    id: 'commute',
    name: 'Daily Commute',
    shortName: 'Commute',
    limit: 5_000,
    group: 'commuteCare',
    isHers: false,
    tone: 'lilac',
    icon: Bus,
  },
  {
    id: 'her-kharcha',
    name: 'Her Personal Kharcha',
    shortName: "Wife's Kharcha",
    limit: 3_000,
    group: 'her',
    isHers: true,
    tone: 'rose',
    icon: Heart,
  },
  {
    id: 'medicine',
    name: 'Medicine & Care',
    shortName: 'Medicine & Care',
    limit: 2_500,
    group: 'commuteCare',
    isHers: false,
    tone: 'mint',
    icon: Pill,
  },
] as const;

/**
 * Dashboard grouping. Card titles follow the Figma file; the brief's longer
 * names ("Our Nest & Bills", "Her Kharcha & Joy") were not used so the screen
 * matches the design.
 */
export const ENVELOPE_GROUPS: readonly EnvelopeGroup[] = [
  {
    id: 'groceries',
    name: 'Groceries & Kitchen',
    envelopeIds: ['groceries'],
    tone: 'lilac',
    icon: ShoppingBasket,
  },
  {
    id: 'nest',
    name: 'Housing & Bills',
    envelopeIds: ['room-rent', 'utilities', 'internet'],
    tone: 'amber',
    icon: House,
  },
  {
    id: 'her',
    name: "Wife's Kharcha",
    envelopeIds: ['her-kharcha'],
    tone: 'rose',
    icon: Heart,
  },
  {
    id: 'commuteCare',
    name: 'Commute & Care',
    envelopeIds: ['commute', 'medicine'],
    tone: 'lilac',
    icon: Car,
  },
] as const;

/** Total of the default limits — 54,530. */
export const DEFAULT_LIMIT_TOTAL = ENVELOPES.reduce((sum, envelope) => sum + envelope.limit, 0);

export function getEnvelope(id: EnvelopeId): Envelope {
  const envelope = ENVELOPES.find((candidate) => candidate.id === id);
  if (!envelope) throw new Error(`Unknown envelope: ${id}`);
  return envelope;
}

/** Lucide component for each key an envelope row may store. */
export const ENVELOPE_ICONS: Record<EnvelopeIcon, LucideIcon> = {
  wallet: Wallet,
  'piggy-bank': PiggyBank,
  'graduation-cap': GraduationCap,
  gift: Gift,
  plane: Plane,
  briefcase: Briefcase,
  'paw-print': PawPrint,
  'shopping-bag': ShoppingBag,
};

/** A custom row rendered in the same shape as a built-in envelope. */
export function customEnvelopeView(envelope: CustomEnvelope): Envelope {
  return {
    id: envelope.id,
    name: envelope.name,
    shortName: envelope.name,
    // No default limit: the slider scale comes from the saved month limit.
    limit: 0,
    group: null,
    isHers: false,
    tone: envelope.tone,
    icon: ENVELOPE_ICONS[envelope.icon] ?? Wallet,
  };
}

/**
 * Looks up a built-in envelope or one of the household's custom rows.
 * Returns null for an id this build does not know (for example a newer app
 * version created it), so a single bad row can never crash a screen.
 */
export function findEnvelope(
  id: EnvelopeId,
  custom: readonly CustomEnvelope[] = [],
): Envelope | null {
  const builtIn = ENVELOPES.find((candidate) => candidate.id === id);
  if (builtIn) return builtIn;

  const row = custom.find((candidate) => candidate.id === id);
  return row ? customEnvelopeView(row) : null;
}

export function getGroup(id: EnvelopeGroupId): EnvelopeGroup {
  const group = ENVELOPE_GROUPS.find((candidate) => candidate.id === id);
  if (!group) throw new Error(`Unknown envelope group: ${id}`);
  return group;
}

/** Every envelope at zero — the shape a month has before any limits are saved. */
export function emptyLimits(): EnvelopeLimits {
  return ENVELOPES.reduce(
    (limits, envelope) => ({ ...limits, [envelope.id]: 0 }),
    {} as EnvelopeLimits,
  );
}

/** True when `value` is one of the seven built-in envelope ids. */
export function isBuiltInEnvelopeId(value: string): value is BuiltInEnvelopeId {
  return ENVELOPES.some((envelope) => envelope.id === value);
}

/* -------------------------------------------------------------------------- */
/* Tones                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Icon-tile tint as a Tailwind class — the className twin of
 * `toneStyle().surface`, kept beside it so the two can never drift apart.
 */
export function toneSurfaceClass(tone: Tone): string {
  switch (tone) {
    case 'mint':
      return 'bg-emerald-soft-strong';
    case 'amber':
      return 'bg-amber';
    case 'rose':
      return 'bg-rose';
    case 'lilac':
    default:
      return 'bg-lilac';
  }
}

export interface ToneStyle {
  /** Icon tile background — also a Tailwind class for the same colour. */
  surface: string;
  /** Icon stroke colour. */
  icon: string;
  /** Progress fill. */
  fill: string;
  /** Pill background. */
  pill: string;
  /** Pill text. */
  pillInk: string;
}

export function toneStyle(tone: Tone, colors: ThemeColors): ToneStyle {
  switch (tone) {
    case 'mint':
      return {
        surface: colors['emerald-soft-strong'],
        icon: colors.primary,
        fill: colors.accent,
        pill: colors['emerald-soft'],
        pillInk: colors.primary,
      };
    case 'amber':
      return {
        surface: colors.amber,
        icon: colors['amber-ink'],
        fill: colors['amber-accent'],
        pill: colors['amber-soft-badge'],
        pillInk: colors['amber-ink'],
      };
    case 'rose':
      return {
        surface: colors.rose,
        icon: colors['rose-ink'],
        fill: colors['rose-accent'],
        pill: colors['rose-soft'],
        pillInk: colors['rose-ink'],
      };
    case 'lilac':
    default:
      return {
        surface: colors.lilac,
        icon: colors['ink-2'],
        fill: colors.accent,
        pill: colors.track,
        pillInk: colors['ink-2'],
      };
  }
}
