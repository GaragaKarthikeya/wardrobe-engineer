export type ClothingItem = {
    id: string;
    created_at: string;
    image_url: string;
    tags: ClothingTags;
    is_clean: boolean;
};

export type ClothingTags = {
    // Required fields
    category: 'Top' | 'Bottom' | 'Shoe' | 'Outerwear' | 'Accessory';
    sub_category: string;
    color: string;
    formality: 'Casual' | 'Smart Casual' | 'Business' | 'Formal';

    // Optional rich metadata
    secondary_color?: string;
    pattern?: string;
    fabric?: string;
    texture?: string;
    fit?: string;
    length?: string;
    neckline?: string;
    sleeve_length?: string;
    closure?: string;
    details?: string[];
    brand_visible?: boolean;
    brand_guess?: string;
    seasons?: string[];
    occasions?: string[];
    style_tags?: string[];
    color_temperature?: 'Warm' | 'Cool' | 'Neutral';
    versatility_score?: number;
    care_guess?: string[];
    style_notes?: string;

    // Allow any additional AI-generated fields
    [key: string]: unknown;
};

export type OutfitRecommendation = {
    selected_item_ids: string[];
    outfit_type?: string;
    reasoning: string;
};
