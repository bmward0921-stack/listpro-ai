import { useListings, useListingStats } from '@/hooks/useListings';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { PLATFORM_LABELS, Platform } from '@/types/listing';
import PlatformBadge from '@/components/PlatformBadge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, DollarSign, Percent, ShoppingBag, Receipt } from 'lucide-react';
import StatCard from '@/components/ui/stat-card';

const PLATFORM_COLORS: Record<Platform, string> = {
  facebook: '#3b82f6',
  poshmark: '#f43f5e',
  squarespace: '#64748b',
};

const Analytics = () => {
  const { listings, loading } = useListings();
  const stats = useListingStats(listings);
  const { calculatePlatformFee } = useAdminSettings();

  // Prepare data for charts
  const platformRevenueData = Object.entries(stats.platformBreakdown).map(([platform, data]) => ({
    name: PLATFORM_LABELS[platform as Platform],
    grossRevenue: data.grossRevenue,
    fees: data.fees,
    revenue: data.revenue,
    sold: data.sold,
    platform: platform as Platform,
  }));

  const platformPieData = Object.entries(stats.platformBreakdown).map(([platform, data]) => ({
    name: PLATFORM_LABELS[platform as Platform],
    value: data.revenue,
    color: PLATFORM_COLORS[platform as Platform],
  }));

  // Category breakdown
  const categoryBreakdown = listings.reduce((acc, listing) => {
    if (!acc[listing.category]) {
      acc[listing.category] = { count: 0, revenue: 0 };
    }
    acc[listing.category].count++;
    listing.platforms.forEach((p) => {
      if (p.status === 'sold') {
        acc[listing.category].revenue += p.price;
      }
    });
    return acc;
  }, {} as Record<string, { count: number; revenue: number }>);

  const categoryData = Object.entries(categoryBreakdown)
    .map(([category, data]) => ({
      name: category,
      items: data.count,
      revenue: data.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Top selling items with platform fees
  const topSelling = listings
    .map((listing) => {
      const soldPlatforms = listing.platforms.filter((p) => p.status === 'sold');
      const grossRevenue = soldPlatforms.reduce((sum, p) => sum + p.price, 0);
      const fees = soldPlatforms.reduce((sum, p) => sum + calculatePlatformFee(p.platform, p.price), 0);
      const netRevenue = grossRevenue - fees;
      const profit = netRevenue - (soldPlatforms.length > 0 ? listing.costPrice : 0);
      return {
        ...listing,
        grossRevenue,
        fees,
        totalRevenue: netRevenue,
        profit,
        soldCount: soldPlatforms.length,
      };
    })
    .filter((l) => l.soldCount > 0)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5);

  const profitMargin = stats.totalRevenue > 0
    ? ((stats.totalProfit / stats.totalRevenue) * 100).toFixed(1)
    : 0;

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
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="mt-1 text-muted-foreground">
          Track your sales performance across all platforms
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Gross Revenue"
          value={`$${stats.totalGrossRevenue.toLocaleString()}`}
          subtitle="Before fees"
          icon={DollarSign}
        />
        <StatCard
          title="Platform Fees"
          value={`$${stats.totalFees.toLocaleString()}`}
          subtitle="Total deducted"
          icon={Receipt}
        />
        <StatCard
          title="Net Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          subtitle="After fees"
          icon={DollarSign}
        />
        <StatCard
          title="Total Profit"
          value={`$${stats.totalProfit.toLocaleString()}`}
          subtitle={`${profitMargin}% margin`}
          icon={TrendingUp}
        />
        <StatCard
          title="Items Sold"
          value={stats.soldItems}
          icon={ShoppingBag}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue by Platform */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Revenue by Platform</h2>
          <p className="text-sm text-muted-foreground">Compare earnings across platforms</p>
          
          {platformRevenueData.length > 0 ? (
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`$${value}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                    {platformRevenueData.map((entry) => (
                      <Cell key={entry.platform} fill={PLATFORM_COLORS[entry.platform]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-4 flex h-72 items-center justify-center text-muted-foreground">
              No sales data yet
            </div>
          )}
        </div>

        {/* Revenue Distribution */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Revenue Distribution</h2>
          <p className="text-sm text-muted-foreground">Share of revenue by platform</p>
          
          {platformPieData.some((d) => d.value > 0) ? (
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={platformPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {platformPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`$${value}`, 'Revenue']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-4 flex h-72 items-center justify-center text-muted-foreground">
              No sales data yet
            </div>
          )}
        </div>
      </div>

      {/* Category Performance & Top Selling */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category Performance */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Top Categories</h2>
          <p className="text-sm text-muted-foreground">Best performing product categories</p>
          
          {categoryData.length > 0 ? (
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`$${value}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-4 flex h-72 items-center justify-center text-muted-foreground">
              No category data yet
            </div>
          )}
        </div>

        {/* Top Selling Items */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Top Selling Items</h2>
          <p className="text-sm text-muted-foreground">Your best performing products</p>
          
          <div className="mt-4 space-y-4">
            {topSelling.length > 0 ? (
              topSelling.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-lg border border-border p-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  {item.images && item.images.length > 0 ? (
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${item.totalRevenue}</p>
                    <p className="text-xs text-green-600">+${item.profit} profit</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex h-48 items-center justify-center text-muted-foreground">
                No sold items yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Platform Summary Table */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Platform Summary</h2>
        <p className="text-sm text-muted-foreground">Detailed breakdown by platform (including fees)</p>
        
        <div className="mt-4 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 text-left text-sm font-medium text-muted-foreground">Platform</th>
                <th className="py-3 text-right text-sm font-medium text-muted-foreground">Listed</th>
                <th className="py-3 text-right text-sm font-medium text-muted-foreground">Sold</th>
                <th className="py-3 text-right text-sm font-medium text-muted-foreground">Gross</th>
                <th className="py-3 text-right text-sm font-medium text-muted-foreground">Fees</th>
                <th className="py-3 text-right text-sm font-medium text-muted-foreground">Net Revenue</th>
                <th className="py-3 text-right text-sm font-medium text-muted-foreground">Conversion</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.platformBreakdown).map(([platform, data]) => (
                <tr key={platform} className="border-b border-border/50">
                  <td className="py-3">
                    <PlatformBadge platform={platform as Platform} />
                  </td>
                  <td className="py-3 text-right font-medium">{data.total}</td>
                  <td className="py-3 text-right font-medium">{data.sold}</td>
                  <td className="py-3 text-right font-medium">${data.grossRevenue.toLocaleString()}</td>
                  <td className="py-3 text-right font-medium text-orange-600">-${data.fees.toFixed(2)}</td>
                  <td className="py-3 text-right font-medium text-green-600">${data.revenue.toFixed(2)}</td>
                  <td className="py-3 text-right font-medium">
                    {data.total > 0 ? ((data.sold / data.total) * 100).toFixed(0) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
