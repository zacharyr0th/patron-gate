"use client";

import { use, useEffect, useState } from "react";
import { Badge, ContentCard, MembershipPurchaseModal, Skeleton, TierCard } from "@repo/ui";

interface Creator {
  userId: string;
  displayName: string;
  category?: string;
  totalMembers: number;
  bannerUrl?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    website?: string;
  };
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

interface Content {
  id: string;
  title: string;
  description?: string;
  contentType: string;
  thumbnailUrl?: string;
  viewCount: number;
  streamCount: number;
  tierRequirement?: number;
  isPublic: boolean;
  uploadedAt: string;
}

export default function CreatorProfilePage({
  params,
}: {
  params: Promise<{ wallet: string }>;
}) {
  const { wallet } = use(params);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [user, setUser] = useState<any>(null);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  useEffect(() => {
    fetchCreatorData();
  }, [wallet]);

  const fetchCreatorData = async () => {
    try {
      setLoading(true);

      // Fetch user by wallet
      const userRes = await fetch(`/api/users/${wallet}`);
      const userData = await userRes.json();

      if (userData.success && userData.data) {
        setUser(userData.data);

        // Fetch creator profile
        const creatorRes = await fetch(`/api/creators/${userData.data.id}`);
        const creatorData = await creatorRes.json();

        if (creatorData.success) {
          setCreator(creatorData.data);
        }
      }

      // Fetch tiers
      const tiersRes = await fetch(`/api/tiers/${wallet}?active=true`);
      const tiersData = await tiersRes.json();

      if (tiersData.success) {
        setTiers(tiersData.data || []);
      }

      // Fetch public content
      if (userData.success && userData.data) {
        const contentRes = await fetch(`/api/content/list?creator=${userData.data.id}&public=true`);
        const contentData = await contentRes.json();

        if (contentData.success) {
          setContent(contentData.data?.content || []);
        }
      }
    } catch (error) {
      console.error("Failed to fetch creator data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-48 w-full mb-4" />
        <Skeleton className="h-8 w-1/3 mb-2" />
        <Skeleton className="h-4 w-1/4 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (!creator || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Creator Not Found</h2>
          <p className="text-muted-foreground">This creator profile does not exist</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Banner */}
      {creator.bannerUrl ? (
        <div className="h-64 overflow-hidden">
          <img
            src={creator.bannerUrl}
            alt={creator.displayName}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="h-64 bg-gradient-to-r from-primary/20 to-primary/5" />
      )}

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="py-6 sm:py-8 border-b">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold mb-2">{creator.displayName}</h1>
              <p className="text-muted-foreground text-sm sm:text-base truncate max-w-[300px] sm:max-w-none">{wallet}</p>
            </div>
            {creator.category && <Badge className="self-start">{creator.category}</Badge>}
          </div>

          <div className="flex flex-wrap gap-3 sm:gap-4 mb-4 text-sm sm:text-base">
            <div>
              <span className="font-semibold">{creator.totalMembers}</span>
              <span className="text-muted-foreground ml-1">members</span>
            </div>
            <div>
              <span className="font-semibold">{tiers.length}</span>
              <span className="text-muted-foreground ml-1">tiers</span>
            </div>
            <div>
              <span className="font-semibold">{content.length}</span>
              <span className="text-muted-foreground ml-1">posts</span>
            </div>
          </div>

          {/* Social Links */}
          {creator.socialLinks && (
            <div className="flex gap-4">
              {creator.socialLinks.website && (
                <a
                  href={creator.socialLinks.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Website
                </a>
              )}
              {creator.socialLinks.twitter && (
                <a
                  href={`https://twitter.com/${creator.socialLinks.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Twitter
                </a>
              )}
            </div>
          )}
        </div>

        {/* Membership Tiers */}
        {tiers.length > 0 && (
          <div className="py-8 border-b">
            <h2 className="text-2xl font-bold mb-6">Membership Tiers</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {tiers.map((tier) => (
                <TierCard
                  key={tier.id}
                  tier={tier}
                  onPurchase={() => {
                    setSelectedTier(tier);
                    setIsPurchaseModalOpen(true);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Public Content */}
        {content.length > 0 && (
          <div className="py-8">
            <h2 className="text-2xl font-bold mb-6">Public Content</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {content.map((item) => (
                <ContentCard key={item.id} content={item} />
              ))}
            </div>
          </div>
        )}

        {content.length === 0 && tiers.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">This creator hasn't set up their page yet</p>
          </div>
        )}
      </div>

      {selectedTier && (
        <MembershipPurchaseModal
          isOpen={isPurchaseModalOpen}
          onClose={() => {
            setIsPurchaseModalOpen(false);
            setSelectedTier(null);
          }}
          tier={selectedTier}
          creatorWallet={wallet}
          creatorName={creator?.displayName || "Creator"}
        />
      )}
    </div>
  );
}
