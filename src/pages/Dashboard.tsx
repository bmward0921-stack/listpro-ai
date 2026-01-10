import { useListings, useListingStats } from '@/hooks/useListings';
import { useActivityLog } from '@/hooks/useActivityLog';
import StatCard from '@/components/ui/stat-card';
import PlatformBadge from '@/components/PlatformBadge';
import ActivityFeed from '@/components/ActivityFeed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, TrendingUp, DollarSign, ShoppingBag } from 'lucide-react';
import { PLATFORM_LABELS, Platform } from '@/types/listing';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Link } from 'react-router-dom';

const PLATFORM_COLORS: Record<Platform, string> = {
  facebook: '#3b82f6',
  poshmark: '#f43f5e',
  squarespace: '#64748b',
};

const Dashboard = () => {
  const { listings, loading } = useListings();
  const { activities, loading: activitiesLoading } = useActivityLog();
  const stats = useListingStats(listings);

  const pieData = Object.entries(stats.platformBreakdown).map(([platform, data]) => ({
    name: PLATFORM_LABELS[platform as Platform],
    value: data.total,
    color: PLATFORM_COLORS[platform as Platform],
  }));

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Overview of your multi-platform listings
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Listings"
          value={stats.totalListings}
          subtitle="Across all platforms"
          icon={Package}
        />
        <StatCard
          title="Active Listings"
          value={stats.activeListings}
          subtitle="Available or reserved"
          icon={ShoppingBag}
        />
        <StatCard
          title="Items Sold"
          value={stats.soldItems}
          subtitle="Total sold items"
          icon={TrendingUp}
        />
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          subtitle={`Profit: $${stats.totalProfit.toLocaleString()}`}
          icon={DollarSign}
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Platform Distribution */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Platform Distribution</h2>
          <p className="text-sm text-muted-foreground">Listings by platform</p>
          
          {pieData.length > 0 ? (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-4 flex h-64 items-center justify-center text-muted-foreground">
              No listings yet
            </div>
          )}
        </div>

        {/* Team Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Team Activity</CardTitle>
            <p className="text-sm text-muted-foreground">Recent changes by team members</p>
          </CardHeader>
          <CardContent>
            <ActivityFeed 
              activities={activities} 
              loading={activitiesLoading} 
              maxItems={5}
            />
          </CardContent>
        </Card>
      </div>

      {/* Platform Performance */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Platform Performance</h2>
        <p className="text-sm text-muted-foreground">Revenue and sales by platform</p>
        
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {Object.entries(stats.platformBreakdown).map(([platform, data]) => (
            <div
              key={platform}
              className="rounded-lg border border-border bg-muted/30 p-4"
            >
              <PlatformBadge platform={platform as Platform} />
              <div className="mt-3 space-y-1">
                <p className="text-2xl font-bold">${data.revenue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">
                  {data.sold} sold of {data.total} listed
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
