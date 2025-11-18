
export enum TattooStyle {
  FINELINE = 'Fine-line',
  REALISM = 'Realism',
  TRIBAL = 'Tribal',
  ANIME = 'Anime',
  GOTHIC = 'Gothic',
  WATERCOLOR = 'Watercolor',
  MINIMALIST = 'Minimalist',
  TRADITIONAL = 'Traditional',
  NEO_TRADITIONAL = 'Neo-traditional',
  BLACKWORK = 'Blackwork',
  GEOMETRIC = 'Geometric',
  BIOMECHANICAL = 'Biomechanical',
}

export interface TattooVariation {
  style_name: string;
  short_description: string;
  image_prompt: string;
  image: string;
}

export interface TattooConcept {
  id: string;
  concept_name: string;
  summary: string;
  meaning_and_symbols: Array<{ symbol: string; meaning: string }>;
  variations: TattooVariation[];
  artist_prompt: string;
  placement_suggestions: string[];
  color_palette_hint?: string[];
  interview: Array<{ q: string; a: string }>;
  safety_flags: {
    contains_personal_identifiers: boolean;
    moderation_reason: string | null;
  };
}

export interface EditorLayer {
  id: string;
  image: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  isBase: boolean;
}