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

export interface CategoryResponse {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  parentId?: string;
  parentName?: string;
  level: number;
  path: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryTreeResponse extends CategoryResponse {
  children?: CategoryTreeResponse[];
}
