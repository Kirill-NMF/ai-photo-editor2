export type PaywallTrigger = "limit" | "download" | "presets" | "pricing";

export interface PromptSuggestion {
  id: string;
  prompt: string;
  category: string;
}

export interface PromptPack {
  id: "quick" | "swag" | "trap-album" | "studio-photo" | "social-cover";
  label: string;
  title: string;
  isPremium: boolean;
  suggestions: PromptSuggestion[];
}

export const PREMIUM_PLAN = {
  monthlyPriceUsd: 30,
  monthlyGenerations: 100,
  features: [
    "100 AI generations every month",
    "High-resolution downloads",
    "Premium prompt preset collections",
  ],
} as const;

export function shouldBlockGeneration({ remaining, isAdmin }: { remaining: number; isAdmin: boolean }): boolean {
  return !isAdmin && remaining <= 0;
}

export const PROMPT_PACKS: PromptPack[] = [
  {
    id: "quick",
    label: "Quick",
    title: "Quick Suggestions",
    isPremium: false,
    suggestions: [
      { id: "quick-athletic", prompt: "Render the subject with a 50% more athletic physique. Keep the clothing exactly the same, but show the physical changes through the fabric.", category: "Change body" },
      { id: "quick-rocky", prompt: "Dress the user in ASAP Rocky-inspired clothing made entirely of flowing, reflective liquid gold. Use high-contrast reflections and an expensive luxury look.", category: "Change clothes" },
      { id: "quick-pigeon", prompt: "Place a colossal, building-sized pigeon with a Godzilla-like head and fire-red eyes behind the subject in the city.", category: "Background object" },
      { id: "quick-thermal", prompt: "Apply a thermal heat-map aura around the body, fading from bright orange and red into deep blue with subtle VHS distortion.", category: "Cool aura" },
      { id: "quick-oil", prompt: "Transform the image into a cracked 17th-century oil painting with deep shadows, heavy brushstrokes, and a golden varnish finish.", category: "Adjust style" },
    ],
  },
  {
    id: "swag",
    label: "Swag",
    title: "Swag Suggestions",
    isPremium: true,
    suggestions: [
      { id: "swag-chrome", prompt: "Create a luxury streetwear editorial with chrome accessories and sharp flash lighting.", category: "Premium wardrobe" },
      { id: "swag-backstage", prompt: "Turn the scene into a flash-lit backstage portrait with bold jewelry and candid energy.", category: "Premium lighting" },
      { id: "swag-campaign", prompt: "Build a high-fashion campaign portrait with a dramatic pose and clean art direction.", category: "Premium composition" },
    ],
  },
  {
    id: "trap-album",
    label: "Trap Album",
    title: "Trap Album Suggestions",
    isPremium: true,
    suggestions: [
      { id: "trap-metal", prompt: "Design a dark cinematic album cover with metallic type and a focused central portrait.", category: "Premium cover" },
      { id: "trap-neon", prompt: "Create a neon city portrait with deep shadows, heavy film grain, and nocturnal color.", category: "Premium atmosphere" },
      { id: "trap-surreal", prompt: "Compose a surreal album image with an oversized object and dramatic low-angle framing.", category: "Premium concept" },
    ],
  },
  {
    id: "studio-photo",
    label: "Studio Photo",
    title: "Studio Photo Suggestions",
    isPremium: true,
    suggestions: [
      { id: "studio-beauty", prompt: "Apply clean beauty lighting on a seamless neutral backdrop with natural skin texture.", category: "Premium studio" },
      { id: "studio-rim", prompt: "Create a glossy campaign portrait with controlled highlights and a precise rim light.", category: "Premium lighting" },
      { id: "studio-magazine", prompt: "Turn the image into a polished magazine headshot with subtle professional retouching.", category: "Premium retouch" },
    ],
  },
  {
    id: "social-cover",
    label: "Social Cover",
    title: "Social Media Cover Suggestions",
    isPremium: true,
    suggestions: [
      { id: "social-youtube", prompt: "Create a YouTube thumbnail with a clear focal hierarchy and space for a short headline.", category: "Premium social" },
      { id: "social-story", prompt: "Build a vertical story cover with the subject centered and safe space for interface overlays.", category: "Premium social" },
      { id: "social-square", prompt: "Design a square campaign cover with bold typography and a strong profile-picture crop.", category: "Premium social" },
    ],
  },
];
