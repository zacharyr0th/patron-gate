"use client";

import Image from "next/image";
import Link from "next/link";
import { Upload, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { LoginButton } from "./auth/login-button";

const navLinks = [
  { href: "/browse", label: "Browse" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/admin", label: "Admin" },
];

export function Header() {
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-black">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <span className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
              <Image
                src="/logo.png"
                alt="PatronGate"
                width={32}
                height={32}
                className="rounded-lg"
              />
              PatronGate
            </span>
            <nav className="hidden sm:flex items-center gap-6">
              {navLinks.map((link) => (
                <span key={link.href} className="text-sm text-gray-500 dark:text-gray-400">
                  {link.label}
                </span>
              ))}
            </nav>
          </div>
          <div className="h-10 w-32 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-black">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-semibold text-gray-900 transition-opacity hover:opacity-80 dark:text-gray-100"
          >
            <Image src="/logo.png" alt="PatronGate" width={32} height={32} className="rounded-lg" />
            PatronGate
          </Link>
          <nav className="hidden sm:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Upload
          </Link>
          <LoginButton />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
          <nav className="flex flex-col px-4 py-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
