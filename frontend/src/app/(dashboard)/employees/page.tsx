'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DataTable from '@/components/ui/DataTable';
import { employeeAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

const DEMO = [
  { _id: '1', employeeId: 'EMP-001', user: { firstName: 'Amit', lastName: 'Verma', email: 'amit@trendypos.ai', role: 'manager' }, department: 'Sales', salary: 45000, commissionRate: 5, totalCommission: 12500 },
  { _id: '2', employeeId: 'EMP-002', user: { firstName: 'Sneha', lastName: 'Reddy', email: 'sneha@trendypos.ai', role: 'cashier' }, department: 'Sales', salary: 28000, commissionRate: 3, totalCommission: 8200 },
  { _id: '3', employeeId: 'EMP-003', user: { firstName: 'Karan', lastName: 'Mehta', email: 'karan@trendypos.ai', role: 'inventory_staff' }, department: 'Warehouse', salary: 32000, commissionRate: 0, totalCommission: 0 },
];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState(DEMO);

  useEffect(() => {
    employeeAPI.getAll().then((res) => { if (res.data.data?.length) setEmployees(res.data.data); }).catch(() => {});
  }, []);

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div>
        <h1 className="text-2xl font-bold">Employees</h1>
        <p className="text-sm text-white/50">Staff management, attendance & commissions</p>
      </div>

      <DataTable
        columns={[
          { key: 'user', label: 'Employee', render: (e) => {
            const u = e.user as { firstName: string; lastName: string; email: string };
            return <div><p className="font-medium">{u?.firstName} {u?.lastName}</p><p className="text-[10px] text-white/40">{e.employeeId as string}</p></div>;
          }},
          { key: 'role', label: 'Role', render: (e) => <span className="capitalize">{(e.user as { role: string })?.role?.replace('_', ' ')}</span> },
          { key: 'department', label: 'Department' },
          { key: 'salary', label: 'Salary', render: (e) => formatCurrency(e.salary as number) },
          { key: 'totalCommission', label: 'Commission', render: (e) => formatCurrency(e.totalCommission as number) },
        ]}
        data={employees as unknown as Record<string, unknown>[]}
      />
    </motion.div>
  );
}
