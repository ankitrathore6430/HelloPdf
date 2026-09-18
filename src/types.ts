export type ToolCategory =
  | 'all'
  | 'trending'
  | 'organize'
  | 'convert'
  | 'convert-to-pdf'
  | 'convert-from-pdf'
  | 'optimize'
  | 'security'
  | 'edit-annotate'
  | 'business'
  | 'advanced';

export type ToolBadge = 'Top 1' | 'Essential' | 'Popular' | 'Trending' | 'Security' | 'Pro' | 'New' | 'Ranked' | 'Business';

export interface ToolItem {
  id: string;
  rank: number;
  name: string;
  shortDesc: string;
  category: ToolCategory;
  iconName: string;
  badge?: ToolBadge;
  rating: number;
  usageCount: string;
  acceptFiles: string;
  multipleFiles?: boolean;
  accentColor: string;
  keywords: string[];
  featured?: boolean;
}

export type SortOption = 'rank' | 'popular' | 'rating' | 'name';

export interface CategoryInfo {
  id: ToolCategory;
  name: string;
  description: string;
  icon: string;
  count: number;
}
