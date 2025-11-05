import { useQuery } from '@tanstack/react-query';
import { Users, Shield, UserCog, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { userService } from '../services/userService';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import type { RoleStatistic } from '../types';

export default function UserStatsCards() {
  const { data: roleStats, isLoading } = useQuery({
    queryKey: ['roleStatistics'],
    queryFn: () => userService.getRoleStatistics(),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6 flex items-center justify-center">
            <Spinner size="sm" />
          </Card>
        ))}
      </div>
    );
  }

  const getTotalUsers = (): number => {
    if (!roleStats) return 0;
    return roleStats.reduce((sum: number, stat: RoleStatistic) => sum + stat.count, 0);
  };

  const getAdminCount = (): number => {
    if (!roleStats) return 0;
    const superAdmin = roleStats.find((s: RoleStatistic) => s.role === 'SuperAdmin')?.count || 0;
    const admin = roleStats.find((s: RoleStatistic) => s.role === 'Admin')?.count || 0;
    return superAdmin + admin;
  };

  const getCustomerCount = (): number => {
    if (!roleStats) return 0;
    return roleStats.find((s: RoleStatistic) => s.role === 'Customer')?.count || 0;
  };

  const getAgentCount = (): number => {
    if (!roleStats) return 0;
    const aiAgent = roleStats.find((s: RoleStatistic) => s.role === 'AiAgent')?.count || 0;
    const humanAgent = roleStats.find((s: RoleStatistic) => s.role === 'HumanAgent')?.count || 0;
    return aiAgent + humanAgent;
  };

  const stats = [
    {
      title: 'Total Users',
      value: getTotalUsers(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Administrators',
      value: getAdminCount(),
      icon: Shield,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Customers',
      value: getCustomerCount(),
      icon: UserPlus,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Agents',
      value: getAgentCount(),
      icon: UserCog,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 font-medium mb-1">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-neutral-900">
                  {stat.value.toLocaleString()}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
