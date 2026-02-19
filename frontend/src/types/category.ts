export interface Category {
    id: string;
    name: string;
    nameAr?: string;
    description?: string;
    parentId?: string;
    parentName?: string;
    level: number;
    path: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CategoryTree extends Category {
    children?: CategoryTree[];
}

export interface CreateCategoryDto {
    name: string;
    nameAr?: string;
    description?: string;
    parentId?: string;
}

export interface UpdateCategoryDto {
    name?: string;
    nameAr?: string;
    description?: string;
    parentId?: string;
    isActive?: boolean;
}

export interface CompanyCategory {
    companyId: string;
    categoryId: string;
    category: Category;
}
