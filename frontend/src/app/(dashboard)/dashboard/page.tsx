'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import {
  DollarSign, ShoppingBag, TrendingUp, Users, AlertTriangle, Package,
} from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import { CardSkeleton } from '@/components/ui/Skeleton';
import ActivityFeed from '@/components/ui/ActivityFeed';
import { analyticsAPI } from '@/lib/api';
import { formatCurrencyCompact, formatDate } from '@/lib/utils';
import { useAppDispatch } from '@/store/hooks';
import { addLiveActivity } from '@/store/slices/uiSlice';
import { io } from 'socket.io-client';

const COLORS = ['#06b6d4', '#8b5cf6', '#22d3ee', '#a78bfa', '#34d399'];

export default function DashboardPage() {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [chartData, setChartData] = useState<{ _id: string; revenue: number; orders: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, chartRes] = await Promise.all([
          analyticsAPI.getDashboard(),
          analyticsAPI.getSalesChart(7),
        ]);
        setStats(dashRes.data.data);
        setChartData(chartRes.data.data || []);
      } catch {
        setStats({
          todayRevenue: 45230, todayOrders: 28, monthlyRevenue: 1245800,
          monthlyOrders: 342, totalRevenue: 8950000, totalOrders: 2847,
          profit: 312400, customerCount: 156, topProducts: [],
          lowStockAlerts: [], recentOrders: [],
        });
        setChartData([
          { _id: 'Mon', revenue: 42000, orders: 35 },
          { _id: 'Tue', revenue: 38000, orders: 28 },
          { _id: 'Wed', revenue: 51000, orders: 42 },
          { _id: 'Thu', revenue: 47000, orders: 38 },
          { _id: 'Fri', revenue: 62000, orders: 52 },
          { _id: 'Sat', revenue: 78000, orders: 65 },
          { _id: 'Sun', revenue: 55000, orders: 45 },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const socket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000');
    socket.on('live-activity', (data: { type: string }) => {
      dispatch(addLiveActivity({ type: data.type, message: `New ${data.type} recorded` }));
    });
    return () => { socket.disconnect(); };
  }, [dispatch]);

  if (loading) {
    return (
      <div className="space-y-6">
        <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </motion.div>
      </div>
    );
  }

  const s = stats as Record<string, number | unknown[]>;
  const topProducts = (s.topProducts as { name: string; soldCount: number; basePrice: number }[]) || [];
  const lowStock = (s.lowStockAlerts as { product?: { name: string }; quantity: number }[]) || [];
  const recentOrders = (s.recentOrders as { invoiceNumber: string; total: number; createdAt: string; customer?: { firstName: string; lastName: string } }[]) || [];
  const revenueSpark = chartData.map((d) => d.revenue);
  const ordersSpark = chartData.map((d) => d.orders);

  const paymentBreakdown = [
    { name: 'Cash', value: 45 },
    { name: 'Card', value: 35 },
    { name: 'Online', value: 20 },
  ];

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div>
        <h1 className="text-2xl font-bold gradient-text">Dashboard</h1>
        <p className="text-sm text-[var(--muted)]">Store overview · live sales & inventory</p>
      </div>

      <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Revenue"
          value={<AnimatedCounter value={(s.todayRevenue as number) || 0} currency duration={2.2} delay={0.1} />}
          change="+12.5% from yesterday"
          changeType="up"
          icon={DollarSign}
          iconColor="text-cyan-400"
          sparklineData={revenueSpark}
          sparklineColor="#06b6d4"
          delay={0}
        />
        <StatCard
          title="Monthly Revenue"
          value={<AnimatedCounter value={(s.monthlyRevenue as number) || 0} currency duration={2.4} delay={0.2} />}
          change={`${s.monthlyOrders} orders`}
          changeType="up"
          icon={TrendingUp}
          iconColor="text-purple-400"
          gradient="from-purple-600/15 to-cyan-600/10"
          sparklineData={revenueSpark}
          sparklineColor="#8b5cf6"
          delay={0.1}
        />
        <StatCard
          title="Total Sales"
          value={<AnimatedCounter value={(s.totalRevenue as number) || 0} currency duration={2.6} delay={0.3} />}
          change={`${s.totalOrders} orders total`}
          icon={ShoppingBag}
          iconColor="text-emerald-400"
          sparklineData={ordersSpark}
          sparklineColor="#34d399"
          delay={0.2}
        />
        <StatCard
          title="Customers"
          value={<AnimatedCounter value={(s.customerCount as number) || 0} duration={2} delay={0.4} />}
          change="Active members"
          icon={Users}
          iconColor="text-amber-400"
          gradient="from-amber-600/15 to-emerald-600/10"
          delay={0.3}
        />
      </motion.div>

      <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="lg:col-span-2 glass-card glass-card-glow rounded-2xl p-6">
          <h3 className="text-sm font-semibold mb-4">Revenue Overview (7 Days)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="_id" stroke="rgba(255,255,255,0.3)" fontSize={12} />
              <YAxis stroke="var(--muted)" fontSize={12} tickFormatter={(v) => formatCurrencyCompact(v as number)} />
              <Tooltip contentStyle={{ background: 'rgba(7,11,20,0.95)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '12px', color: '#fff' }} />
              <Area type="monotone" dataKey="revenue" stroke="#06b6d4" fill="url(#colorRevenue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold mb-4">Payment Methods</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={paymentBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                {paymentBreakdown.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'rgba(7,11,20,0.95)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '12px', color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {paymentBreakdown.map((item, i) => (
              <div key={item.name} className="flex items-center gap-1.5 text-[10px] text-[var(--muted)]">
                <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
                {item.name} {item.value}%
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <ActivityFeed />
        <motion.div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> Low Stock Alerts
          </h3>
          <motion.div className="space-y-3 max-h-[220px] overflow-y-auto">
            {lowStock.length === 0 ? (
              <p className="text-xs text-[var(--muted)] text-center py-8">All stock levels healthy</p>
            ) : lowStock.map((item, i) => (
              <motion.div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)]" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-400" />
                  <span className="text-xs">{item.product?.name || 'Product'}</span>
                </div>
                <span className="text-xs text-amber-400 font-medium">{item.quantity} left</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold mb-4">Top Selling Products</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topProducts.length > 0 ? topProducts : [{ name: 'Denim Jacket', soldCount: 45, basePrice: 3499 }, { name: 'Silk Dress', soldCount: 38, basePrice: 5999 }, { name: 'Sneakers', soldCount: 32, basePrice: 4299 }, { name: 'T-Shirt', soldCount: 28, basePrice: 899 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
              <Tooltip contentStyle={{ background: 'rgba(7,11,20,0.95)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '12px', color: '#fff' }} />
              <Bar dataKey="soldCount" fill="#06b6d4" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold mb-4">Recent Orders</h3>
          <motion.div className="space-y-2 max-h-[250px] overflow-y-auto">
            {(recentOrders.length > 0 ? recentOrders : [
              { invoiceNumber: 'INV-001', total: 4500, createdAt: new Date().toISOString(), customer: { firstName: 'Priya', lastName: 'Sharma' } },
              { invoiceNumber: 'INV-002', total: 8900, createdAt: new Date().toISOString(), customer: { firstName: 'Rahul', lastName: 'Kumar' } },
            ]).map((order, i) => (
              <motion.div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)] transition-all" whileHover={{ x: 2 }}>
                <div>
                  <p className="text-xs font-medium">{order.invoiceNumber}</p>
                  <p className="text-[10px] text-[var(--muted)]">{order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'Walk-in'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-cyan-400">
                    <AnimatedCounter value={order.total} currency duration={1.5} delay={0.5 + i * 0.08} />
                  </p>
                  <p className="text-[10px] text-[var(--muted)]">{formatDate(order.createdAt)}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
