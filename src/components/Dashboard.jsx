'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Users } from 'lucide-react';
import { summaryApi } from '@/lib/api';

export default function Dashboard() {
  const { data: overview, isLoading, error } = useQuery({
    queryKey: ['overview'],
    queryFn: summaryApi.getOverview,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <p className="text-red-600 text-center">Error loading dashboard data</p>
      </Card>
    );
  }

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    })
      .format(amount)
      .replace('BDT', 'BDT');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Lent</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-green-600">
            {formatCurrency(overview?.totalLent || 0)}
          </div>
          <p className="text-xs text-muted-foreground">{overview?.activeLentLoans || 0} active loans</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Taken</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-red-600">
            {formatCurrency(overview?.totalTaken || 0)}
          </div>
          <p className="text-xs text-muted-foreground">{overview?.activeTakenLoans || 0} active loans</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Amount</CardTitle>
          <DollarSign className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className={`text-xl sm:text-2xl font-bold ${(overview?.netAmount || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(overview?.netAmount || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            {(overview?.netAmount || 0) >= 0 ? 'You are owed' : 'You owe'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
          <Users className="h-4 w-4 text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">{overview?.totalLoans || 0}</div>
          <p className="text-xs text-muted-foreground">All loan records</p>
        </CardContent>
      </Card>
    </div>
  );
}
