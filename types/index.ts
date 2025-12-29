export type ClothingItem = {
    id: string;
    created_at: string;
    image_url: string;
    tags: ClothingTags; // Stored as JSONB
    is_clean: boolean;
};

export type ClothingTags = {
    category: 'Top' | 'Bottom' | 'Shoe' | 'Outerwear' | 'Accessory';
    sub_category?: string;
    color?: string;
    pattern?: string;
    fabric?: string;
    formality?: 'Casual' | 'Business' | 'Formal';
    details?: string[];
};

export type OutfitRecommendation = {
    selected_item_ids: string[];
    reasoning: string;
};
