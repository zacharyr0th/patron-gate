"use client";

import { useEffect, useState, useRef } from "react";
import { Play, Pause, Music, Video, Image, File, Lock } from "lucide-react";
import Link from "next/link";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { MembershipPurchaseModal } from "@repo/ui";

interface Content {
  id: string;
  title: string;
  description?: string;
  contentType: string;
  fileSize: number;
  isPublic: boolean;
  creatorWallet: string;
  uploadedAt: string;
  streamCount: number;
  tierRequirement?: number;
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

export default function BrowsePage() {
  const { connected, account } = useWallet();
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Purchase modal state
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<{ wallet: string; name: string } | null>(null);
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch("/api/content/list");
        const data = await response.json();
        if (data.success) {
          setContent(data.data.content || []);
        }
      } catch (error) {
        console.error("Failed to fetch content:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  const handlePlay = async (item: Content) => {
    // If already playing this item, pause it
    if (playingId === item.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // If content is public, just play it
    if (item.isPublic) {
      playAudio(item);
      return;
    }

    // For gated content, check if user is connected
    if (!connected || !account?.address) {
      setAccessError("Connect your wallet to play this content");
      setTimeout(() => setAccessError(null), 3000);
      return;
    }

    // Try to play - the download endpoint will check access
    const audio = new Audio(`/api/content/${item.id}/download`);

    audio.onerror = async () => {
      // Access denied - show purchase modal
      await showPurchaseModal(item);
    };

    audio.oncanplaythrough = () => {
      audio.play();
      audioRef.current = audio;
      setPlayingId(item.id);
    };

    audio.onended = () => setPlayingId(null);
    audio.load();
  };

  const playAudio = (item: Content) => {
    const audio = new Audio(`/api/content/${item.id}/download`);
    audio.play();
    audio.onended = () => setPlayingId(null);
    audioRef.current = audio;
    setPlayingId(item.id);
  };

  const showPurchaseModal = async (item: Content) => {
    try {
      // Fetch creator's tiers
      const tiersRes = await fetch(`/api/tiers/${item.creatorWallet}?active=true`);
      const tiersData = await tiersRes.json();

      if (tiersData.success && tiersData.data?.length > 0) {
        // Get the cheapest tier or the one matching the requirement
        const tiers = tiersData.data as Tier[];
        const requiredTier = item.tierRequirement
          ? tiers.find((t) => t.tierId === item.tierRequirement) || tiers[0]
          : tiers[0];

        setSelectedTier(requiredTier);
        setSelectedCreator({
          wallet: item.creatorWallet,
          name: item.creatorWallet.slice(0, 8) + "...",
        });
        setIsPurchaseModalOpen(true);
      } else {
        setAccessError("No membership tiers available for this creator");
        setTimeout(() => setAccessError(null), 3000);
      }
    } catch (error) {
      console.error("Failed to fetch tiers:", error);
      setAccessError("Failed to load membership options");
      setTimeout(() => setAccessError(null), 3000);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "audio":
        return <Music className="h-8 w-8" />;
      case "video":
        return <Video className="h-8 w-8" />;
      case "image":
        return <Image className="h-8 w-8" />;
      default:
        return <File className="h-8 w-8" />;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-black dark:text-white">Browse</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Stream exclusive content</p>
      </div>

      {/* Access error toast */}
      {accessError && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-red-500 text-white rounded-lg shadow-lg text-sm">
          {accessError}
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : content.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">No content yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {content.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                {/* Play button for audio */}
                {item.contentType === "audio" ? (
                  <button
                    onClick={() => handlePlay(item)}
                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-opacity relative ${
                      item.isPublic
                        ? "bg-black dark:bg-white hover:opacity-80"
                        : "bg-gray-700 dark:bg-gray-300 hover:opacity-80"
                    }`}
                  >
                    {playingId === item.id ? (
                      <Pause className="h-5 w-5 text-white dark:text-black" />
                    ) : (
                      <Play className="h-5 w-5 text-white dark:text-black ml-0.5" />
                    )}
                    {/* Lock overlay for gated content */}
                    {!item.isPublic && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                        <Lock className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>
                ) : (
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 relative">
                    {getIcon(item.contentType)}
                    {!item.isPublic && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                        <Lock className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/content/${item.id}`}
                      className="font-medium text-black dark:text-white truncate hover:underline"
                    >
                      {item.title}
                    </Link>
                    {!item.isPublic && (
                      <span className="text-xs px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded">
                        Members
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/creators/${item.creatorWallet}`}
                    className="text-sm text-gray-500 dark:text-gray-400 truncate block hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    {item.creatorWallet.slice(0, 8)}...{item.creatorWallet.slice(-6)}
                  </Link>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs text-gray-400">
                    <span className="uppercase">{item.contentType}</span>
                    <span>•</span>
                    <span>{formatSize(item.fileSize)}</span>
                    <span>•</span>
                    <span>{item.streamCount} plays</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Membership Purchase Modal */}
      {selectedTier && selectedCreator && (
        <MembershipPurchaseModal
          isOpen={isPurchaseModalOpen}
          onClose={() => {
            setIsPurchaseModalOpen(false);
            setSelectedTier(null);
            setSelectedCreator(null);
          }}
          tier={selectedTier}
          creatorWallet={selectedCreator.wallet}
          creatorName={selectedCreator.name}
        />
      )}
    </div>
  );
}
