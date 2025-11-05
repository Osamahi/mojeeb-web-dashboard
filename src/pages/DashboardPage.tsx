import { motion } from 'framer-motion';
import { Bot, MessageSquare, Users, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';

const stats = [
  { name: 'Total Agents', value: '12', icon: Bot, change: '+2 this month', trend: 'up' },
  { name: 'Conversations', value: '1,234', icon: MessageSquare, change: '+15% from last week', trend: 'up' },
  { name: 'Active Users', value: '456', icon: Users, change: '+8% from last week', trend: 'up' },
  { name: 'Engagement', value: '89%', icon: TrendingUp, change: '+3% from last week', trend: 'up' },
];

export const DashboardPage = () => {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Dashboard</h1>
        <p className="text-neutral-600">Welcome back! Here's what's happening with your agents.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hoverable>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600 mb-1">{stat.name}</p>
                  <p className="text-3xl font-bold text-neutral-900 mb-2">{stat.value}</p>
                  <p className="text-xs text-green-600">{stat.change}</p>
                </div>
                <div className="p-3 bg-primary-50 rounded-xl">
                  <stat.icon className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-neutral-50 rounded-lg">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-900">New agent created</p>
                <p className="text-xs text-neutral-600">Support Bot - 2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-neutral-50 rounded-lg">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-900">45 new conversations</p>
                <p className="text-xs text-neutral-600">Across all agents - Today</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full p-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:shadow-glow transition-all text-left">
              <p className="font-medium">Create New Agent</p>
              <p className="text-sm text-white/80">Set up a new AI agent in minutes</p>
            </button>
            <button className="w-full p-4 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-all text-left">
              <p className="font-medium text-neutral-900">View Analytics</p>
              <p className="text-sm text-neutral-600">See detailed performance metrics</p>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
