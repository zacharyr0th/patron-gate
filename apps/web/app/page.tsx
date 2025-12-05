"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="h-full flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <section className="text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="space-y-4">
            <h1 className="tracking-tight leading-[1.1] text-black dark:text-white">
              <span className="block text-5xl sm:text-6xl lg:text-7xl font-light">
                Exclusive content,
              </span>
              <span className="block text-3xl sm:text-4xl lg:text-5xl font-medium mt-2">
                owned by creators
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
              Decentralized streaming. Instant payouts.
            </p>
          </div>

          <div className="flex gap-4 justify-center items-center flex-wrap">
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black text-sm font-medium hover:opacity-90 transition-opacity rounded-full"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors rounded-full"
            >
              Learn more
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
