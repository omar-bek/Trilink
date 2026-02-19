import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  nameAr?: string; // Arabic name for localization
  description?: string;
  parentId?: mongoose.Types.ObjectId;
  level: number; // 0 for root categories, 1 for sub-categories, etc.
  path: string; // Full path like "Electronics/Computers/Laptops" for efficient querying
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    nameAr: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true,
    },
    level: {
      type: Number,
      required: true,
      default: 0,
      index: true,
    },
    path: {
      type: String,
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance optimization
CategorySchema.index({ parentId: 1, isActive: 1 }); // Find children of a category
CategorySchema.index({ level: 1, isActive: 1 }); // Find all root categories or sub-categories
CategorySchema.index({ path: 1, isActive: 1 }); // Path-based queries
CategorySchema.index({ name: 1, isActive: 1 }); // Name search with active filter
CategorySchema.index({ deletedAt: 1 }); // Soft delete filter

// Compound index for hierarchical queries
CategorySchema.index({ parentId: 1, level: 1, isActive: 1 });

// Virtual for children (not stored in DB, computed on demand)
CategorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentId',
});

// Pre-save hook to calculate level and path
CategorySchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('parentId')) {
    if (this.parentId) {
      const parent = await mongoose.model<ICategory>('Category').findById(this.parentId);
      if (!parent) {
        return next(new Error('Parent category not found'));
      }
      this.level = parent.level + 1;
      this.path = parent.path ? `${parent.path}/${this.name}` : this.name;
    } else {
      this.level = 0;
      this.path = this.name;
    }
  }
  next();
});

// Soft delete query helper
(CategorySchema.query as any).active = function (this: mongoose.Query<any, any>) {
  return this.where({ deletedAt: null, isActive: true });
};

export const Category = mongoose.model<ICategory>('Category', CategorySchema);
