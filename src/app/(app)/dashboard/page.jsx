import Dashboard from '@/components/Dashboard';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Loan Tracker</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Manage your family loans and track transactions
        </p>
      </div>

      <Dashboard />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/money-lent">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium text-green-600">Money Lent</CardTitle>
              <TrendingUp className="h-6 w-6 text-green-600" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View and manage money you&apos;ve lent to family members
              </p>
              <div className="mt-4 w-full border rounded-md px-4 py-2 text-center text-sm">
                View Money Lent →
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/money-borrowed">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium text-red-600">Money Borrowed</CardTitle>
              <TrendingDown className="h-6 w-6 text-red-600" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View and manage money you&apos;ve borrowed from family members
              </p>
              <div className="mt-4 w-full border rounded-md px-4 py-2 text-center text-sm">
                View Money Borrowed →
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
