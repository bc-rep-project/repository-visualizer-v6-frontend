import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { repositoryApi } from '@/services/api';
import { Button } from '@/components/common/Button';

interface NavbarProps {
  onMenuClick: () => void;
}

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Visualizations', href: '/visualizations' },
  { label: 'Analysis', href: '/analysis' },
];

export default function Navbar({ onMenuClick }: NavbarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const data = await repositoryApi.search(searchQuery);
      setSearchResults(data.results);
      setShowSearch(true);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  return (
    <nav className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <button
              type="button"
              className="p-2 -ml-2 text-muted-foreground hover:text-foreground lg:hidden"
              onClick={onMenuClick}
            >
              <MenuIcon className="h-6 w-6" />
            </button>
            <div className="hidden lg:flex lg:gap-8 ml-8">
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
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search repositories..."
                className="input w-64"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button 
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground"
                onClick={handleSearch}
              >
                <SearchIcon className="h-5 w-5" />
              </button>

              {showSearch && searchResults.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-background border rounded-md shadow-lg">
                  {searchResults.map((result: any, index: number) => (
                    <div
                      key={index}
                      className="p-3 hover:bg-accent cursor-pointer border-b last:border-b-0"
                      onClick={() => {
                        setShowSearch(false);
                        if (result.type === 'repository') {
                          router.push(`/repository/${result.name}`);
                        }
                      }}
                    >
                      <div className="font-medium">{result.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {result.type === 'repository' ? 'Repository' : 'File'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function MenuIcon(props: React.SVGProps<SVGSVGElement>) {
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
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
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