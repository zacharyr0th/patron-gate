"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Membership {
  id: string;
  creatorWallet: string;
  tierId: number;
  expiryTime: string;
  creator?: {
    displayName: string;
  };
  tier?: {
    name: string;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const { connected, account } = useWallet();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [isCreator, setIsCreator] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!connected) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      if (!account?.address) return;

      try {
        // Check if user is a creator
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        if (sessionData.success && sessionData.data?.isCreator) {
          setIsCreator(true);
        }

        const membershipsRes = await fetch(`/api/memberships/${account.address}?active=true`);
        const membershipsData = await membershipsRes.json();

        if (membershipsData.success) {
          setMemberships(membershipsData.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [connected, account, router]);

  if (!connected) {
    return null;
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-black dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Manage your memberships</p>
        </div>
        {isCreator ? (
          <Link
            href="/dashboard/creator"
            className="self-start px-4 py-2 text-sm font-medium bg-black dark:bg-white text-white dark:text-black rounded-full hover:opacity-90 transition-opacity"
          >
            Creator Dashboard
          </Link>
        ) : (
          <Link
            href="/creators/initialize"
            className="self-start px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
          >
            Become a Creator
          </Link>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {memberships.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No active memberships</p>
            <Link
              href="/browse"
              className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black text-sm font-medium hover:opacity-90 transition-opacity rounded-full"
            >
              Browse Creators
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {memberships.map((membership) => (
              <div
                key={membership.id}
                className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg"
              >
                <h3 className="font-medium text-black dark:text-white">
                  {membership.creator?.displayName || membership.creatorWallet.slice(0, 8) + "..."}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {membership.tier?.name || `Tier ${membership.tierId}`}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  Expires {new Date(membership.expiryTime).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
