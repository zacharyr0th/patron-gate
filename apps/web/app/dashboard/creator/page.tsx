"use client";

import { useEffect, useState } from "react";
import { Badge, Card, Skeleton, TierCard } from "@repo/ui";
import Link from "next/link";

interface Creator {
  userId: string;
  displayName: string;
  category?: string;
  totalRevenue: string;
  totalMembers: number;
  bannerUrl?: string;
}

interface Tier {
  id: string;
  tierId: number;
  name: string;
  priceMonthly: string;
  priceYearly: string;
  benefits: string[];
  maxMembers: number;
  currentMembers: number;
  active: boolean;
}

interface RevenueEvent {
  id: string;
  eventType: string;
  amount: string;
  memberWallet: string;
  tierId?: number;
  createdAt: string;
}

interface Analytics {
  totalRevenue: string;
  totalMembers: number;
  activeTiers: number;
  recentRevenue: RevenueEvent[];
}

export default function CreatorDashboardPage() {
  const [session, setSession] = useState<any>(null);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCreatorData();
  }, []);

  const fetchCreatorData = async () => {
    try {
      setLoading(true);

      // Fetch session first (required for other requests)
      const sessionRes = await fetch("/api/auth/session");
      const sessionData = await sessionRes.json();

      if (!sessionData.success || !sessionData.data) {
        window.location.href = "/login";
        return;
      }

      if (!sessionData.data.isCreator) {
        window.location.href = "/dashboard";
        return;
      }

      setSession(sessionData.data);

      // Fetch all data in parallel
      const [creatorRes, tiersRes, analyticsRes, revenueRes] = await Promise.all([
        fetch(`/api/creators/${sessionData.data.userId}`),
        fetch(`/api/tiers/${sessionData.data.walletAddress}`),
        fetch(`/api/analytics/creator/${sessionData.data.userId}`),
        fetch(`/api/analytics/revenue/${sessionData.data.walletAddress}`),
      ]);

      const [creatorData, tiersData, analyticsData, revenueData] = await Promise.all([
        creatorRes.json(),
        tiersRes.json(),
        analyticsRes.json(),
        revenueRes.json(),
      ]);

      if (creatorData.success) {
        setCreator(creatorData.data);
      }

      if (tiersData.success) {
        setTiers(tiersData.data || []);
      }

      if (analyticsData.success) {
        setAnalytics({
          ...analyticsData.data,
          recentRevenue: revenueData.success ? revenueData.data.recentEvents || [] : [],
        });
      }
    } catch {
      // Silent fail - UI will show empty state
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: string) => {
    const aptAmount = Number(amount) / 100000000;
    return `${aptAmount.toFixed(2)} APT`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-1/3 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Creator Profile Not Found</h2>
          <p className="text-muted-foreground mb-4">Please complete your creator profile setup</p>
          <Link
            href="/creators/initialize"
            className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Setup Creator Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Creator Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {creator.displayName}</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Link href="/dashboard" className="px-3 sm:px-4 py-2 border rounded-md hover:bg-accent text-sm">
            Member View
          </Link>
          <Link
            href={`/creators/${session?.walletAddress}`}
            className="px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
          >
            View Profile
          </Link>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <Card className="p-4 sm:p-6">
          <div className="text-xs sm:text-sm text-muted-foreground mb-1">Total Revenue</div>
          <div className="text-lg sm:text-2xl font-bold">
            {formatAmount(analytics?.totalRevenue || creator.totalRevenue)}
          </div>
        </Card>
        <Card className="p-4 sm:p-6">
          <div className="text-xs sm:text-sm text-muted-foreground mb-1">Total Members</div>
          <div className="text-lg sm:text-2xl font-bold">
            {analytics?.totalMembers || creator.totalMembers}
          </div>
        </Card>
        <Card className="p-4 sm:p-6">
          <div className="text-xs sm:text-sm text-muted-foreground mb-1">Active Tiers</div>
          <div className="text-lg sm:text-2xl font-bold">
            {analytics?.activeTiers || tiers.filter((t) => t.active).length}
          </div>
        </Card>
        <Card className="p-4 sm:p-6">
          <div className="text-xs sm:text-sm text-muted-foreground mb-1">Avg. per Member</div>
          <div className="text-lg sm:text-2xl font-bold">
            {creator.totalMembers > 0
              ? formatAmount(
                  String(Math.floor(Number(creator.totalRevenue) / creator.totalMembers))
                )
              : "0.00 APT"}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Membership Tiers */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Membership Tiers</h2>
              <Link
                href="/tiers/create"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
              >
                Create New Tier
              </Link>
            </div>

            {tiers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  You haven't created any membership tiers yet
                </p>
                <Link
                  href="/tiers/create"
                  className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Create Your First Tier
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tiers.map((tier) => (
                  <div key={tier.id} className="relative">
                    <TierCard tier={tier} onPurchase={() => {}} showPurchase={false} />
                    {!tier.active && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary">Inactive</Badge>
                      </div>
                    )}
                    <div className="mt-2 text-sm text-muted-foreground text-center">
                      {tier.currentMembers} / {tier.maxMembers} members
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Content Management */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Content</h2>
              <Link
                href="/content/upload"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
              >
                Upload Content
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              Manage your exclusive content for members
            </p>
          </Card>
        </div>

        {/* Sidebar - Recent Revenue */}
        <div>
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Recent Revenue</h2>

            {!analytics?.recentRevenue || analytics.recentRevenue.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No revenue events yet
              </p>
            ) : (
              <div className="space-y-3">
                {analytics.recentRevenue.slice(0, 10).map((event) => (
                  <div
                    key={event.id}
                    className="p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium capitalize">
                        {event.eventType.replace("_", " ")}
                      </span>
                      <span className="text-sm font-bold text-green-600">
                        +{formatAmount(event.amount)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {event.memberWallet.substring(0, 8)}...
                      {event.memberWallet.substring(event.memberWallet.length - 6)}
                    </p>
                    {event.tierId !== undefined && (
                      <p className="text-xs text-muted-foreground mt-1">Tier {event.tierId}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(event.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <Card className="p-6 mt-6">
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                href="/posts/create"
                className="block w-full px-4 py-2 text-sm border rounded-md hover:bg-accent text-center"
              >
                Create Post
              </Link>
              <Link
                href="/content/upload"
                className="block w-full px-4 py-2 text-sm border rounded-md hover:bg-accent text-center"
              >
                Upload Content
              </Link>
              <Link
                href="/tiers/create"
                className="block w-full px-4 py-2 text-sm border rounded-md hover:bg-accent text-center"
              >
                Create Tier
              </Link>
              <Link
                href={`/creators/${session?.walletAddress}`}
                className="block w-full px-4 py-2 text-sm border rounded-md hover:bg-accent text-center"
              >
                Edit Profile
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
