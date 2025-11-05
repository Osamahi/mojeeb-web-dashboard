/**
 * Team Stats Cards
 * Displays key team metrics in a grid
 */

import { useQuery } from '@tanstack/react-query';
import { Users, UserCheck, Shield, UserCog } from 'lucide-react';
import { motion } from 'framer-motion';
import { teamService } from '../services/teamService';
import { Spinner } from '@/components/ui/Spinner';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  iconColor: string;
  delay?: number;
}

function StatCard({ icon: Icon, label, value, iconColor, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white border border-neutral-200 rounded-lg p-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-neutral-600 mb-1">{label}</p>
          <p className="text-3xl font-bold text-neutral-950">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${iconColor}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

interface TeamStatsCardsProps {
  agentId: string;
}

export default function TeamStatsCards({ agentId }: TeamStatsCardsProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['team-stats', agentId],
    queryFn: () => teamService.getTeamStats(agentId),
    enabled: !!agentId,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white border border-neutral-200 rounded-lg p-6 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-neutral-200 rounded w-20 mb-2"></div>
                <div className="h-8 bg-neutral-200 rounded w-16"></div>
              </div>
              <div className="w-12 h-12 bg-neutral-200 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={Users}
        label="Total Team Members"
        value={stats.total_members}
        iconColor="bg-blue-500"
        delay={0}
      />
      <StatCard
        icon={UserCheck}
        label="Online Now"
        value={stats.online_members}
        iconColor="bg-green-500"
        delay={0.1}
      />
      <StatCard
        icon={Shield}
        label="Admins"
        value={stats.admins_count + stats.super_admins_count}
        iconColor="bg-orange-500"
        delay={0.2}
      />
      <StatCard
        icon={UserCog}
        label="Agents"
        value={stats.agents_count}
        iconColor="bg-purple-500"
        delay={0.3}
      />
    </div>
  );
}
