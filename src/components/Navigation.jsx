'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { User, LogOut, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Navigation() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4 flex justify-between items-center gap-2">
        <nav className="flex min-w-0 items-center gap-1 sm:gap-3">
          <Link href="/dashboard" className="font-bold text-base sm:text-lg mr-1 sm:mr-4 whitespace-nowrap">
            Loan Tracker
          </Link>
          <Link
            href="/dashboard"
            className={`text-sm px-2 py-1.5 rounded transition-colors ${
              pathname === '/dashboard' ? 'font-semibold bg-muted' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/money-lent"
            className={`text-sm px-2 py-1.5 rounded transition-colors flex items-center gap-1 ${
              pathname === '/money-lent'
                ? 'font-semibold text-green-600 bg-green-50'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Money Lent</span>
          </Link>
          <Link
            href="/money-borrowed"
            className={`text-sm px-2 py-1.5 rounded transition-colors flex items-center gap-1 ${
              pathname === '/money-borrowed'
                ? 'font-semibold text-red-600 bg-red-50'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingDown className="h-4 w-4" />
            <span className="hidden sm:inline">Money Borrowed</span>
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <div className="flex items-center space-x-2 text-sm">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline max-w-[10rem] truncate">{user?.name}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            aria-label="Logout"
            className="flex items-center space-x-1"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
