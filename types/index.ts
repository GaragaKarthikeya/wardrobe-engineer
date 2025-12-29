export type ClothingItem = {
    id: string;
    created_at: string;
    image_url: string;
    tags: ClothingTags;
    is_clean: boolean;
};

export type ClothingTags = {
    category: 'Top' | 'Bottom' | 'Shoe' | 'Outerwear' | 'Accessory';
    sub_category?: string;
    color?: string;
    secondary_color?: string;
    pattern?: string;
    fabric?: string;
    fit?: 'Slim' | 'Regular' | 'Relaxed' | 'Oversized';
    formality?: 'Casual' | 'Smart Casual' | 'Business' | 'Formal';
    seasons?: string[];
    occasions?: string[];
    style_notes?: string;
};

export type OutfitRecommendation = {
    selected_item_ids: string[];
    outfit_type?: string;
    reasoning: string;
};
