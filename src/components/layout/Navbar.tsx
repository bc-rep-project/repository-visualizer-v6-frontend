import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Visualizations', href: '/visualizations' },
  { label: 'Analysis', href: '/analysis' },
];

export default function Navbar() {
  const router = useRouter();

  return (
    <nav className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center px-2 py-1 text-sm font-medium transition-colors 
                  ${router.pathname === item.href 
                    ? 'text-primary border-b-2 border-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 text-muted-foreground hover:text-foreground">
              <SearchIcon className="h-5 w-5" />
            </button>
            <button className="p-2 text-muted-foreground hover:text-foreground">
              <BellIcon className="h-5 w-5" />
            </button>
            <button className="p-2 text-muted-foreground hover:text-foreground">
              <SettingsIcon className="h-5 w-5" />
            </button>
            <button className="ml-2">
              <img
                src="https://github.com/shadcn.png"
                alt="Avatar"
                className="h-8 w-8 rounded-full"
              />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function BellIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}

function SettingsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
} 