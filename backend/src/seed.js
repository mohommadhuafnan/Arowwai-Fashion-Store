require('dotenv').config();
const mongoose = require('mongoose');
const Branch = require('./models/Branch.model');
const Category = require('./models/Category.model');
const User = require('./models/User.model');
const Settings = require('./models/Settings.model');
const Product = require('./models/Product.model');
const Inventory = require('./models/Inventory.model');
const Customer = require('./models/Customer.model');
const Supplier = require('./models/Supplier.model');
const Employee = require('./models/Employee.model');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const branch = await Branch.findOneAndUpdate(
    { code: 'MAIN' },
    {
      name: 'Fashion Mate — Mawanella',
      code: 'MAIN',
      address: { street: 'Kegalle Road', city: 'Mawanella', state: 'Sabaragamuwa', zipCode: '71500', country: 'Sri Lanka' },
      phone: '+94 77 123 4567',
      email: 'shop@fashionmate.lk',
    },
    { upsert: true, new: true }
  );

  const categories = [
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

  const catMap = {};
  for (const cat of categories) {
    const doc = await Category.findOneAndUpdate({ slug: cat.slug }, cat, { upsert: true, new: true });
    catMap[cat.slug] = doc._id;
  }

  const admin = await User.findOne({ email: 'admin@trendypos.ai' });
  if (!admin) {
    await User.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@trendypos.ai',
      password: 'admin123',
      role: 'super_admin',
      branch: branch._id,
    });
    console.log('Admin created: admin@trendypos.ai / admin123');
  }

  const settings = [
    { key: 'currency', value: 'LKR', category: 'general' },
    { key: 'tax_rate', value: 18, category: 'general' },
    { key: 'company_name', value: 'Fashion Mate', category: 'invoice' },
    { key: 'timezone', value: 'Asia/Colombo', category: 'general' },
    { key: 'country', value: 'Sri Lanka', category: 'general' },
  ];
  for (const s of settings) {
    await Settings.findOneAndUpdate({ key: s.key }, s, { upsert: true });
  }

  const products = [
    { name: 'Classic Denim Jacket', sku: 'DJ-001', barcode: '8901234567890', basePrice: 3499, costPrice: 2100, gender: 'men', cat: 'men' },
    { name: 'Silk Evening Dress', sku: 'SD-002', barcode: '8901234567891', basePrice: 5999, costPrice: 3800, gender: 'women', cat: 'women' },
    { name: 'Running Sneakers', sku: 'SN-003', barcode: '8901234567892', basePrice: 4299, costPrice: 2600, gender: 'unisex', cat: 'shoes' },
    { name: 'Cotton T-Shirt', sku: 'TS-004', barcode: '8901234567893', basePrice: 899, costPrice: 450, gender: 'unisex', cat: 'casual-wear' },
    { name: 'Leather Belt', sku: 'BT-005', barcode: '8901234567894', basePrice: 1299, costPrice: 700, gender: 'unisex', cat: 'accessories' },
    { name: 'Wool Blazer', sku: 'BZ-006', barcode: '8901234567895', basePrice: 7499, costPrice: 4800, gender: 'men', cat: 'formal-wear' },
    { name: 'Kids Hoodie', sku: 'KH-007', barcode: '8901234567896', basePrice: 1599, costPrice: 900, gender: 'kids', cat: 'kids' },
    { name: 'Sports Leggings', sku: 'SL-008', barcode: '8901234567897', basePrice: 1899, costPrice: 1100, gender: 'women', cat: 'sportswear' },
  ];

  for (const p of products) {
    const product = await Product.findOneAndUpdate(
      { sku: p.sku },
      {
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        basePrice: p.basePrice,
        costPrice: p.costPrice,
        category: catMap[p.cat],
        branch: branch._id,
        gender: p.gender,
        totalStock: 50,
        isActive: true,
      },
      { upsert: true, new: true }
    );

    await Inventory.findOneAndUpdate(
      { product: product._id, branch: branch._id },
      { product: product._id, branch: branch._id, quantity: 50, lowStockThreshold: 5, warehouse: 'main' },
      { upsert: true, new: true }
    );
  }
  console.log(`Seeded ${products.length} products with inventory`);

  const customers = [
    { firstName: 'Nimal', lastName: 'Perera', phone: '0771234567', email: 'nimal@email.lk', membershipLevel: 'gold', totalSpent: 45000, totalOrders: 12 },
    { firstName: 'Kamani', lastName: 'Fernando', phone: '0762345678', email: 'kamani@email.lk', membershipLevel: 'silver', totalSpent: 22000, totalOrders: 7 },
    { firstName: 'Ravi', lastName: 'Silva', phone: '0753456789', membershipLevel: 'bronze', totalSpent: 8500, totalOrders: 3 },
    { firstName: 'Ayesha', lastName: 'Rahman', phone: '0784567890', email: 'ayesha@email.lk', membershipLevel: 'platinum', totalSpent: 98000, totalOrders: 28 },
  ];
  for (const c of customers) {
    await Customer.findOneAndUpdate({ phone: c.phone }, { ...c, preferredBranch: branch._id }, { upsert: true });
  }
  console.log(`Seeded ${customers.length} customers`);

  const suppliers = [
    { name: 'Colombo Textile Mills', contactPerson: 'Mr. Jayawardena', phone: '0112345678', email: 'orders@colombotextile.lk', rating: 4.5, totalPaid: 250000, totalDue: 45000 },
    { name: 'Kandy Fashion Imports', contactPerson: 'Ms. Wijesinghe', phone: '0813456789', email: 'info@kandyfashion.lk', rating: 4.2, totalPaid: 180000, totalDue: 0 },
    { name: 'Lanka Garments Ltd', contactPerson: 'Mr. Dias', phone: '0114567890', rating: 4.8, totalPaid: 420000, totalDue: 12000 },
  ];
  for (const s of suppliers) {
    await Supplier.findOneAndUpdate({ name: s.name }, s, { upsert: true });
  }
  console.log(`Seeded ${suppliers.length} suppliers`);

  const employees = [
    { firstName: 'Saman', lastName: 'Kumara', email: 'saman@fashionmate.lk', phone: '0771111111', role: 'cashier', salary: 45000, department: 'Sales' },
    { firstName: 'Priya', lastName: 'Jayasinghe', email: 'priya@fashionmate.lk', phone: '0772222222', role: 'manager', salary: 75000, department: 'Management' },
    { firstName: 'Dinesh', lastName: 'Bandara', email: 'dinesh@fashionmate.lk', phone: '0773333333', role: 'stock_keeper', salary: 40000, department: 'Inventory' },
  ];
  const adminUser = await User.findOne({ email: 'admin@trendypos.ai' });
  if (adminUser) {
    await Employee.findOneAndUpdate(
      { employeeId: 'EMP-0001' },
      {
        user: adminUser._id,
        employeeId: 'EMP-0001',
        branch: branch._id,
        department: 'Management',
        position: 'Shop Manager',
        salary: 75000,
        isActive: true,
      },
      { upsert: true }
    );
    console.log('Seeded 1 employee (linked to admin user)');
  }

  console.log('Seed completed! Fashion Mate — Mawanella ready for production demo.');
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
