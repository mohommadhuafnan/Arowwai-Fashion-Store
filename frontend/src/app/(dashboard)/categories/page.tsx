'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tags } from 'lucide-react';
import { categoryAPI } from '@/lib/api';

const DEFAULT = [
  { _id: '1', name: 'Men', slug: 'men', type: 'men', isActive: true },
  { _id: '2', name: 'Women', slug: 'women', type: 'women', isActive: true },
  { _id: '3', name: 'Kids', slug: 'kids', type: 'kids', isActive: true },
  { _id: '4', name: 'Shoes', slug: 'shoes', type: 'shoes', isActive: true },
  { _id: '5', name: 'Accessories', slug: 'accessories', type: 'accessories', isActive: true },
  { _id: '6', name: 'Sportswear', slug: 'sportswear', type: 'sportswear', isActive: true },
  { _id: '7', name: 'Casual Wear', slug: 'casual-wear', type: 'casual', isActive: true },
  { _id: '8', name: 'Formal Wear', slug: 'formal-wear', type: 'formal', isActive: true },
  { _id: '9', name: 'Summer Collection', slug: 'summer-collection', type: 'summer', isActive: true },
  { _id: '10', name: 'Winter Collection', slug: 'winter-collection', type: 'winter', isActive: true },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState(DEFAULT);

  useEffect(() => {
    categoryAPI.getAll().then((res) => { if (res.data.data?.length) setCategories(res.data.data); }).catch(() => {});
  }, []);

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div>
        <h1 className="text-2xl font-bold">Categories</h1>
        <p className="text-sm text-white/50">Organize your fashion collections</p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {categories.map((cat, i) => (
          <motion.div
            key={cat._id}
            className="glass-card rounded-2xl p-5 text-center group cursor-pointer hover:border-purple-500/30 transition-all"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -4 }}
          >
            <motion.div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600/20 to-cyan-600/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Tags className="w-5 h-5 text-purple-400" />
            </motion.div>
            <p className="text-sm font-medium">{cat.name}</p>
            <p className="text-[10px] text-white/40 mt-1 capitalize">{cat.type}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
