import mongoose from 'mongoose';
import { CompanyCategory } from '../modules/company-categories/schema';
import { Company } from '../modules/companies/schema';
import { Category } from '../modules/categories/schema';

/**
 * Seed company-category relationships
 * Assigns relevant categories to companies based on their type
 */
export const seedCompanyCategories = async (
    companyIds: Record<string, mongoose.Types.ObjectId>,
    categoryIds: Record<string, mongoose.Types.ObjectId>
): Promise<void> => {
    console.log('🔗 Seeding Company-Category Relationships...');

    // Define category assignments based on company type
    const assignments: Array<{
        companyKey: string;
        categoryNames: string[];
    }> = [
            // Buyer companies - typically need various categories
            {
                companyKey: 'Buyer',
                categoryNames: [
                    'Information Technology',
                    'Office Supplies',
                    'Construction & Building Materials',
                    'Medical & Healthcare',
                    'Food & Beverages',
                    'Cleaning & Maintenance',
                    'Security & Safety',
                ],
            },

            // Supplier companies - specialize in specific categories
            {
                companyKey: 'Supplier',
                categoryNames: [
                    'Information Technology',
                    'Computers & Laptops',
                    'Printers & Scanners',
                    'Networking Equipment',
                    'Software & Licenses',
                ],
            },
            {
                companyKey: 'Supplier1',
                categoryNames: [
                    'Information Technology',
                    'Computers & Laptops',
                    'Printers & Scanners',
                    'Networking Equipment',
                    'Software & Licenses',
                ],
            },
            {
                companyKey: 'Supplier2',
                categoryNames: [
                    'Office Supplies',
                    'Office Furniture',
                    'Stationery',
                    'Office Equipment',
                ],
            },
            {
                companyKey: 'TSME-2024-001',
                categoryNames: [
                    'Information Technology',
                    'Computers & Laptops',
                    'Printers & Scanners',
                    'Networking Equipment',
                    'Software & Licenses',
                ],
            },
            {
                companyKey: 'MEPS-2024-001',
                categoryNames: [
                    'Office Supplies',
                    'Office Furniture',
                    'Stationery',
                    'Office Equipment',
                ],
            },
            {
                companyKey: 'GIS-2024-001',
                categoryNames: [
                    'Construction & Building Materials',
                    'Cement & Concrete',
                    'Steel & Metal',
                    'Electrical Supplies',
                    'Plumbing Materials',
                ],
            },

            // Logistics companies
            {
                companyKey: 'ALN-2024-001',
                categoryNames: [
                    'Logistics & Transportation',
                    'Freight Services',
                    'Warehousing',
                ],
            },
            {
                companyKey: 'EES-2024-001',
                categoryNames: [
                    'Logistics & Transportation',
                    'Freight Services',
                    'Warehousing',
                    'Customs Clearance',
                ],
            },

            // Clearance companies
            {
                companyKey: 'UCCS-2024-001',
                categoryNames: [
                    'Logistics & Transportation',
                    'Customs Clearance',
                ],
            },

            // Service Provider companies
            {
                companyKey: 'GQIS-2024-001',
                categoryNames: [
                    'Information Technology',
                    'IT Services',
                    'Cleaning & Maintenance',
                    'Maintenance Services',
                    'Security & Safety',
                    'Security Systems',
                ],
            },
        ];

    let totalAssignments = 0;

    for (const assignment of assignments) {
        const companyId = companyIds[assignment.companyKey];
        if (!companyId) {
            console.warn(`  ⚠️  Company "${assignment.companyKey}" not found`);
            continue;
        }

        // Verify company exists
        const company = await Company.findById(companyId);
        if (!company) {
            console.warn(`  ⚠️  Company "${assignment.companyKey}" not found in database`);
            continue;
        }

        for (const categoryName of assignment.categoryNames) {
            const categoryId = categoryIds[categoryName];
            if (!categoryId) {
                console.warn(`  ⚠️  Category "${categoryName}" not found`);
                continue;
            }

            // Verify category exists
            const category = await Category.findById(categoryId);
            if (!category) {
                console.warn(`  ⚠️  Category "${categoryName}" not found in database`);
                continue;
            }

            // Check if relationship already exists
            const existing = await CompanyCategory.findOne({
                companyId: companyId,
                categoryId: categoryId,
            });

            if (!existing) {
                await CompanyCategory.create({
                    companyId: companyId,
                    categoryId: categoryId,
                });
                totalAssignments++;
                console.log(`  ✓ Assigned "${categoryName}" to ${company.name}`);
            }
        }
    }

    console.log(`\n✅ Seeded ${totalAssignments} company-category relationships\n`);
};
