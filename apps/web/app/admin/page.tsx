"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Upload, Music, Video, Image, File } from "lucide-react";

interface Content {
  id: string;
  title: string;
  description?: string;
  contentType: string;
  fileSize: number;
  streamCount: number;
  uploadedAt: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { connected, account } = useWallet();
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ blobUrl: string; explorerUrl: string } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [library, setLibrary] = useState<Content[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(true);

  useEffect(() => {
    if (!connected) {
      router.push("/login");
    }
  }, [connected, router]);

  useEffect(() => {
    if (account?.address) {
      fetchLibrary();
    }
  }, [account?.address]);

  const fetchLibrary = async () => {
    try {
      const response = await fetch(`/api/content/list?creator=${account?.address}`);
      const data = await response.json();
      if (data.success) {
        setLibrary(data.data.content || []);
      }
    } catch (err) {
      console.error("Failed to fetch library:", err);
    } finally {
      setLoadingLibrary(false);
    }
  };

  if (!connected) {
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
      setSuccess(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !title || !account?.address) return;

    setIsUploading(true);
    setError(null);
    setSuccess(null);
    setStatus("Preparing upload...");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("creatorWallet", account.address.toString());

      setStatus(`Uploading ${(selectedFile.size / 1024 / 1024).toFixed(1)}MB to Shelby...`);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Upload failed");
      }

      setSuccess({
        blobUrl: data.data.blobUrl,
        explorerUrl: data.data.explorerUrl,
      });
      setSelectedFile(null);
      setTitle("");
      setDescription("");
      setStatus("");

      // Refresh library
      fetchLibrary();
    } catch (err: any) {
      setError(err.message || "Upload failed");
      setStatus("");
    } finally {
      setIsUploading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "audio":
        return <Music className="h-4 w-4" />;
      case "video":
        return <Video className="h-4 w-4" />;
      case "image":
        return <Image className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-black dark:text-white">Admin</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Upload and manage your content
        </p>
      </div>

      <div className="flex-1 overflow-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Form */}
        <div>
          <h2 className="text-lg font-medium text-black dark:text-white mb-4">Upload New</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 text-sm bg-green-50 dark:bg-green-900/20 rounded-lg space-y-2">
                <p className="text-green-600 dark:text-green-400 font-medium">Upload successful!</p>
                <a
                  href={success.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 underline block truncate text-xs"
                >
                  View on Shelby Explorer
                </a>
              </div>
            )}

            {status && (
              <div className="p-3 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full" />
                {status}
              </div>
            )}

            <div>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 text-center">
                <input
                  type="file"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="hidden"
                  id="file-upload"
                  accept="video/*,audio/*,image/*"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="h-6 w-6 text-gray-400" />
                  {selectedFile ? (
                    <span className="text-sm text-black dark:text-white">
                      {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Click to select (max 100MB)
                    </span>
                  )}
                </label>
              </div>
            </div>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              disabled={isUploading}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-gray-400"
            />

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              disabled={isUploading}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-gray-400 resize-none"
            />

            <button
              type="submit"
              disabled={isUploading || !selectedFile || !title}
              className="w-full px-4 py-2.5 bg-black dark:bg-white text-white dark:text-black text-sm font-medium hover:opacity-90 transition-opacity rounded-full disabled:opacity-50"
            >
              {isUploading ? "Uploading..." : "Upload"}
            </button>
          </form>
        </div>

        {/* Library */}
        <div>
          <h2 className="text-lg font-medium text-black dark:text-white mb-4">Your Library</h2>
          {loadingLibrary ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : library.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No content uploaded yet</p>
          ) : (
            <div className="space-y-2">
              {library.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-800 rounded-lg"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                    {getIcon(item.contentType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-black dark:text-white truncate">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{formatSize(item.fileSize)}</span>
                      <span>•</span>
                      <span>{item.streamCount} plays</span>
                      <span>•</span>
                      <span>{formatDate(item.uploadedAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
