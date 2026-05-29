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
    <header className="border-b">
      <div className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
        <nav className="flex items-center space-x-1 sm:space-x-4">
          <Link href="/dashboard" className="font-bold text-lg mr-2 sm:mr-4">
            Loan Tracker
          </Link>
          <Link
            href="/dashboard"
            className={`text-sm px-2 py-1 rounded transition-colors ${
              pathname === '/dashboard' ? 'font-semibold bg-muted' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/money-lent"
            className={`text-sm px-2 py-1 rounded transition-colors flex items-center gap-1 ${
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
            className={`text-sm px-2 py-1 rounded transition-colors flex items-center gap-1 ${
              pathname === '/money-borrowed'
                ? 'font-semibold text-red-600 bg-red-50'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingDown className="h-4 w-4" />
            <span className="hidden sm:inline">Money Borrowed</span>
          </Link>
        </nav>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="flex items-center space-x-2 text-sm">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{user?.name}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
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
