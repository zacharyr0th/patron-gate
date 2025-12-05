"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { ChevronDown, LogOut, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

export function LoginButton() {
  const { connect, disconnect, account, connected, wallets } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleConnect = async (walletName: string) => {
    try {
      await connect(walletName);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  };

  const formatAddress = (address: string | { toString(): string }) => {
    const addrStr = typeof address === "string" ? address : address.toString();
    return `${addrStr.slice(0, 6)}...${addrStr.slice(-4)}`;
  };

  if (!mounted) {
    return <div className="h-10 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />;
  }

  if (connected && account) {
    return (
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 rounded-full bg-black dark:bg-white px-4 py-2 text-sm font-medium text-white dark:text-black">
          <Wallet className="h-4 w-4" />
          <span>{formatAddress(account.address)}</span>
        </div>
        <button
          type="button"
          onClick={handleDisconnect}
          className="rounded-full p-2 text-gray-600 transition-all hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
          aria-label="Disconnect wallet"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-full bg-black dark:bg-white px-6 py-2 text-sm font-medium text-white dark:text-black transition-all hover:bg-gray-800 dark:hover:bg-gray-200"
      >
        <Wallet className="h-4 w-4" />
        <span>Connect Wallet</span>
        <ChevronDown className="h-4 w-4" />
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Your Wallet</DialogTitle>
            <DialogDescription>
              Choose a wallet to connect to PatronGate. You'll need an Aptos wallet to access
              memberships and content.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {wallets.length === 0 ? (
              <div className="py-8 text-center">
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  No Aptos wallets detected.
                </p>
                <a
                  href="https://petra.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                >
                  Install Petra Wallet
                </a>
              </div>
            ) : (
              wallets.map((wallet) => (
                <button
                  key={wallet.name}
                  type="button"
                  onClick={() => handleConnect(wallet.name)}
                  className="flex w-full items-center gap-4 rounded-lg border border-gray-200 p-4 transition-all hover:border-blue-500 hover:bg-blue-50 dark:border-gray-700 dark:hover:border-blue-500 dark:hover:bg-blue-950"
                >
                  {wallet.icon && (
                    <img src={wallet.icon} alt={wallet.name} className="h-10 w-10 rounded-lg" />
                  )}
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {wallet.name}
                    </div>
                    {wallet.url && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">{wallet.url}</div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="mt-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              By connecting your wallet, you agree to PatronGate's Terms of Service and Privacy
              Policy.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
