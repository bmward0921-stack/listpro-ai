import { useListings, useListingStats } from '@/hooks/useListings';
import StatCard from '@/components/ui/stat-card';
import PlatformBadge from '@/components/PlatformBadge';
import StatusBadge from '@/components/StatusBadge';
import { Package, TrendingUp, DollarSign, ShoppingBag } from 'lucide-react';
import { PLATFORM_LABELS, Platform } from '@/types/listing';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const PLATFORM_COLORS: Record<Platform, string> = {
  facebook: '#3b82f6',
  poshmark: '#f43f5e',
  squarespace: '#64748b',
};

const Dashboard = () => {
  const { listings, loading } = useListings();
  const stats = useListingStats(listings);

  const pieData = Object.entries(stats.platformBreakdown).map(([platform, data]) => ({
    name: PLATFORM_LABELS[platform as Platform],
    value: data.total,
    color: PLATFORM_COLORS[platform as Platform],
  }));

  const recentActivity = listings
    .flatMap(listing =>
      listing.platforms.map(p => ({
        listing,
        platform: p,
        date: p.soldAt || p.listedAt || listing.$createdAt,
        type: p.soldAt ? 'sold' : 'listed',
      }))
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

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

        {/* Recent Activity */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <p className="text-sm text-muted-foreground">Latest updates on your listings</p>
          
          <div className="mt-4 space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <Link
                  key={`${activity.listing.$id}-${activity.platform.platform}-${index}`}
                  to={`/listings/${activity.listing.$id}`}
                  className="flex items-center gap-4 rounded-lg p-2 transition-colors hover:bg-muted/50"
                >
                  {activity.listing.imageUrl ? (
                    <img
                      src={activity.listing.imageUrl}
                      alt={activity.listing.title}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{activity.listing.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <PlatformBadge platform={activity.platform.platform} />
                      <StatusBadge status={activity.platform.status} />
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{activity.type === 'sold' ? 'Sold' : 'Listed'}</p>
                    <p>{formatDistanceToNow(new Date(activity.date), { addSuffix: true })}</p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="flex h-40 items-center justify-center text-muted-foreground">
                No activity yet
              </div>
            )}
          </div>
        </div>
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
