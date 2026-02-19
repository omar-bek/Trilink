import mongoose from 'mongoose';
import { Category } from '../modules/categories/schema';

export interface SeedCategory {
  name: string;
  nameAr?: string;
  description?: string;
  parentName?: string; // For hierarchical structure
}

/**
 * Seed categories with hierarchical structure
 * Returns a map of category names to ObjectIds for reference
 */
export const seedCategories = async (): Promise<Record<string, mongoose.Types.ObjectId>> => {
  console.log('📂 Seeding Categories...');

  // Define categories in hierarchical structure
  const categoriesData: SeedCategory[] = [
    // Level 0: Root Categories
    {
      name: 'Information Technology',
      nameAr: 'تقنية المعلومات',
      description: 'IT equipment, software, and services',
    },
    {
      name: 'Office Supplies',
      nameAr: 'مستلزمات المكتب',
      description: 'Office furniture, equipment, and supplies',
    },
    {
      name: 'Construction & Building Materials',
      nameAr: 'البناء ومواد البناء',
      description: 'Construction materials and building supplies',
    },
    {
      name: 'Medical & Healthcare',
      nameAr: 'الطبية والرعاية الصحية',
      description: 'Medical equipment and healthcare supplies',
    },
    {
      name: 'Food & Beverages',
      nameAr: 'الطعام والمشروبات',
      description: 'Food products and beverages',
    },
    {
      name: 'Logistics & Transportation',
      nameAr: 'اللوجستيات والنقل',
      description: 'Transportation and logistics services',
    },
    {
      name: 'Cleaning & Maintenance',
      nameAr: 'التنظيف والصيانة',
      description: 'Cleaning supplies and maintenance services',
    },
    {
      name: 'Security & Safety',
      nameAr: 'الأمن والسلامة',
      description: 'Security equipment and safety supplies',
    },
    {
      name: 'Energy & Utilities',
      nameAr: 'الطاقة والمرافق',
      description: 'Energy solutions and utility services',
    },
    {
      name: 'Education & Training',
      nameAr: 'التعليم والتدريب',
      description: 'Educational materials and training services',
    },

    // Level 1: Sub-categories under Information Technology
    {
      name: 'Computers & Laptops',
      nameAr: 'أجهزة الكمبيوتر وأجهزة الكمبيوتر المحمولة',
      description: 'Desktop computers, laptops, and workstations',
      parentName: 'Information Technology',
    },
    {
      name: 'Networking Equipment',
      nameAr: 'معدات الشبكات',
      description: 'Routers, switches, and network infrastructure',
      parentName: 'Information Technology',
    },
    {
      name: 'Software & Licenses',
      nameAr: 'البرمجيات والتراخيص',
      description: 'Software applications and licenses',
      parentName: 'Information Technology',
    },
    {
      name: 'Printers & Scanners',
      nameAr: 'الطابعات والماسحات الضوئية',
      description: 'Printing and scanning equipment',
      parentName: 'Information Technology',
    },
    {
      name: 'IT Services',
      nameAr: 'خدمات تقنية المعلومات',
      description: 'IT support and consulting services',
      parentName: 'Information Technology',
    },

    // Level 1: Sub-categories under Office Supplies
    {
      name: 'Office Furniture',
      nameAr: 'أثاث المكتب',
      description: 'Desks, chairs, and office furniture',
      parentName: 'Office Supplies',
    },
    {
      name: 'Stationery',
      nameAr: 'القرطاسية',
      description: 'Pens, paper, and office stationery',
      parentName: 'Office Supplies',
    },
    {
      name: 'Office Equipment',
      nameAr: 'معدات المكتب',
      description: 'Filing cabinets, whiteboards, and office equipment',
      parentName: 'Office Supplies',
    },

    // Level 1: Sub-categories under Construction & Building Materials
    {
      name: 'Cement & Concrete',
      nameAr: 'الأسمنت والخرسانة',
      description: 'Cement, concrete, and related materials',
      parentName: 'Construction & Building Materials',
    },
    {
      name: 'Steel & Metal',
      nameAr: 'الصلب والمعادن',
      description: 'Steel bars, metal sheets, and metal products',
      parentName: 'Construction & Building Materials',
    },
    {
      name: 'Electrical Supplies',
      nameAr: 'المستلزمات الكهربائية',
      description: 'Electrical wires, switches, and electrical supplies',
      parentName: 'Construction & Building Materials',
    },
    {
      name: 'Plumbing Materials',
      nameAr: 'مواد السباكة',
      description: 'Pipes, fittings, and plumbing supplies',
      parentName: 'Construction & Building Materials',
    },

    // Level 1: Sub-categories under Medical & Healthcare
    {
      name: 'Medical Equipment',
      nameAr: 'المعدات الطبية',
      description: 'Medical devices and equipment',
      parentName: 'Medical & Healthcare',
    },
    {
      name: 'Pharmaceuticals',
      nameAr: 'الأدوية',
      description: 'Medications and pharmaceutical products',
      parentName: 'Medical & Healthcare',
    },
    {
      name: 'Hospital Supplies',
      nameAr: 'مستلزمات المستشفى',
      description: 'Hospital consumables and supplies',
      parentName: 'Medical & Healthcare',
    },

    // Level 1: Sub-categories under Food & Beverages
    {
      name: 'Food Products',
      nameAr: 'منتجات غذائية',
      description: 'Food items and groceries',
      parentName: 'Food & Beverages',
    },
    {
      name: 'Beverages',
      nameAr: 'المشروبات',
      description: 'Drinks and beverages',
      parentName: 'Food & Beverages',
    },
    {
      name: 'Catering Services',
      nameAr: 'خدمات التموين',
      description: 'Catering and food service providers',
      parentName: 'Food & Beverages',
    },

    // Level 1: Sub-categories under Logistics & Transportation
    {
      name: 'Freight Services',
      nameAr: 'خدمات الشحن',
      description: 'Freight and cargo transportation',
      parentName: 'Logistics & Transportation',
    },
    {
      name: 'Warehousing',
      nameAr: 'التخزين',
      description: 'Warehouse and storage services',
      parentName: 'Logistics & Transportation',
    },
    {
      name: 'Customs Clearance',
      nameAr: 'التخليص الجمركي',
      description: 'Customs clearance and documentation services',
      parentName: 'Logistics & Transportation',
    },

    // Level 1: Sub-categories under Cleaning & Maintenance
    {
      name: 'Cleaning Supplies',
      nameAr: 'مواد التنظيف',
      description: 'Cleaning chemicals and supplies',
      parentName: 'Cleaning & Maintenance',
    },
    {
      name: 'Cleaning Equipment',
      nameAr: 'معدات التنظيف',
      description: 'Cleaning machines and equipment',
      parentName: 'Cleaning & Maintenance',
    },
    {
      name: 'Maintenance Services',
      nameAr: 'خدمات الصيانة',
      description: 'Facility maintenance and repair services',
      parentName: 'Cleaning & Maintenance',
    },

    // Level 1: Sub-categories under Security & Safety
    {
      name: 'Security Systems',
      nameAr: 'أنظمة الأمن',
      description: 'CCTV, access control, and security systems',
      parentName: 'Security & Safety',
    },
    {
      name: 'Safety Equipment',
      nameAr: 'معدات السلامة',
      description: 'Safety gear and protective equipment',
      parentName: 'Security & Safety',
    },
    {
      name: 'Fire Safety',
      nameAr: 'سلامة الحريق',
      description: 'Fire extinguishers and fire safety equipment',
      parentName: 'Security & Safety',
    },
  ];

  const categoryMap: Record<string, mongoose.Types.ObjectId> = {};

  // First, create all root categories (level 0)
  for (const categoryData of categoriesData) {
    if (!categoryData.parentName) {
      const category = await Category.create({
        name: categoryData.name,
        nameAr: categoryData.nameAr,
        description: categoryData.description,
        parentId: null,
        level: 0,
        path: categoryData.name,
        isActive: true,
      });
      categoryMap[categoryData.name] = category._id;
      console.log(`  ✓ Created category: ${categoryData.name}`);
    }
  }

  // Then, create sub-categories (level 1)
  for (const categoryData of categoriesData) {
    if (categoryData.parentName) {
      const parentId = categoryMap[categoryData.parentName];
      if (!parentId) {
        console.warn(`  ⚠️  Parent category "${categoryData.parentName}" not found for "${categoryData.name}"`);
        continue;
      }

      const parentCategory = await Category.findById(parentId);
      if (!parentCategory) {
        console.warn(`  ⚠️  Parent category "${categoryData.parentName}" not found in database`);
        continue;
      }

      const category = await Category.create({
        name: categoryData.name,
        nameAr: categoryData.nameAr,
        description: categoryData.description,
        parentId: parentId,
        level: 1,
        path: `${parentCategory.path}/${categoryData.name}`,
        isActive: true,
      });
      categoryMap[categoryData.name] = category._id;
      console.log(`  ✓ Created sub-category: ${categoryData.name} (under ${categoryData.parentName})`);
    }
  }

  console.log(`\n✅ Seeded ${Object.keys(categoryMap).length} categories\n`);
  return categoryMap;
};
