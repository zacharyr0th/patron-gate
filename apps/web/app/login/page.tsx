"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();
  const { connected } = useWallet();

  useEffect(() => {
    if (connected) {
      router.push("/dashboard");
    }
  }, [connected, router]);

  return (
    <div className="h-full flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-sm w-full text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-black dark:text-white">Connect Wallet</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Use the button in the header to connect your Aptos wallet
          </p>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          <a
            href="https://petra.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors underline"
          >
            Learn about Aptos wallets
          </a>
        </p>
      </div>
    </div>
  );
}
