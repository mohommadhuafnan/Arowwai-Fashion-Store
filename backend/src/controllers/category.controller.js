const Category = require('../models/Category.model');

const DEFAULT_CATEGORIES = [
  { name: 'Men', slug: 'men', type: 'men' },
  { name: 'Women', slug: 'women', type: 'women' },
  { name: 'Kids', slug: 'kids', type: 'kids' },
  { name: 'Shoes', slug: 'shoes', type: 'shoes' },
  { name: 'Accessories', slug: 'accessories', type: 'accessories' },
  { name: 'Sportswear', slug: 'sportswear', type: 'sportswear' },
  { name: 'Casual Wear', slug: 'casual-wear', type: 'casual' },
  { name: 'Formal Wear', slug: 'formal-wear', type: 'formal' },
  { name: 'Summer Collection', slug: 'summer-collection', type: 'summer' },
  { name: 'Winter Collection', slug: 'winter-collection', type: 'winter' },
];

const getCategories = async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
  res.json({ success: true, data: categories });
};

const createCategory = async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json({ success: true, data: category });
};

const updateCategory = async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
  res.json({ success: true, data: category });
};

const deleteCategory = async (req, res) => {
  await Category.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ success: true, message: 'Category deactivated' });
};

const seedCategories = async (req, res) => {
  for (const cat of DEFAULT_CATEGORIES) {
    await Category.findOneAndUpdate({ slug: cat.slug }, cat, { upsert: true });
  }
  const categories = await Category.find({ isActive: true });
  res.json({ success: true, data: categories, message: 'Categories seeded' });
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory, seedCategories };
