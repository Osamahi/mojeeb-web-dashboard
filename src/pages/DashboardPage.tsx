/**
 * Mojeeb Minimal Dashboard Page
 * Clean dashboard overview with stats and recent activity
 * NO animations, NO gradients - just clean minimal design
 */

import { Link } from 'react-router-dom';
import { Bot, MessageSquare, Users, TrendingUp, Plus, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const stats = [
  { name: 'Total Agents', value: '12', icon: Bot, change: '+2 this month', trend: 'up' },
  { name: 'Conversations', value: '1,234', icon: MessageSquare, change: '+15% from last week', trend: 'up' },
  { name: 'Active Users', value: '456', icon: Users, change: '+8% from last week', trend: 'up' },
  { name: 'Engagement', value: '89%', icon: TrendingUp, change: '+3% from last week', trend: 'up' },
];

export const DashboardPage = () => {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-950 mb-2">Dashboard</h1>
        <p className="text-neutral-600">Welcome back! Here's what's happening with your agents.</p>
      </div>

      {/* Stats Grid - Minimal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.name} compact>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600 mb-1">{stat.name}</p>
                <p className="text-2xl font-bold text-neutral-950 mb-2">{stat.value}</p>
                <p className="text-xs text-brand-green">{stat.change}</p>
              </div>
              <div className="p-2 bg-neutral-100 rounded-md">
                <stat.icon className="w-5 h-5 text-neutral-700" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <h2 className="text-xl font-semibold text-neutral-950 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-md">
              <div className="w-10 h-10 bg-brand-cyan/10 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-brand-cyan" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-950">New agent created</p>
                <p className="text-xs text-neutral-600">Support Bot - 2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-md">
              <div className="w-10 h-10 bg-brand-green/10 rounded-full flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-brand-green" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-950">45 new conversations</p>
                <p className="text-xs text-neutral-600">Across all agents - Today</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Actions - Minimal Buttons */}
        <Card>
          <h2 className="text-xl font-semibold text-neutral-950 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/agents/new" className="block">
              <div className="p-4 bg-brand-cyan text-white rounded-md hover:bg-brand-cyan/90 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <Plus className="w-5 h-5" />
                  <p className="font-medium">Create New Agent</p>
                </div>
                <p className="text-sm text-white/80">Set up a new AI agent in minutes</p>
              </div>
            </Link>
            <Link to="/analytics" className="block">
              <div className="p-4 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="w-5 h-5 text-neutral-700" />
                  <p className="font-medium text-neutral-950">View Analytics</p>
                </div>
                <p className="text-sm text-neutral-600">See detailed performance metrics</p>
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
