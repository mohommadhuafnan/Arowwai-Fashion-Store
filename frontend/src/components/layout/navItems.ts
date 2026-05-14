import {
  LayoutDashboard, ShoppingCart, Package, Tags, Warehouse, Users, Truck,
  UserCog, BarChart3, Brain, Building2, Settings, LucideIcon,
} from 'lucide-react';

export const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pos', label: 'POS Billing', icon: ShoppingCart },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/categories', label: 'Categories', icon: Tags },
  { href: '/inventory', label: 'Inventory', icon: Warehouse },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/suppliers', label: 'Suppliers', icon: Truck },
  { href: '/employees', label: 'Employees', icon: UserCog },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/analytics', label: 'AI Analytics', icon: Brain },
  { href: '/branches', label: 'Branches', icon: Building2 },
  { href: '/settings', label: 'Settings', icon: Settings },
];
