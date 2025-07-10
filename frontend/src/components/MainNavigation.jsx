import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, TrendingUp, TrendingDown, User, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Dashboard from './Dashboard';
import MoneyLentSection from './MoneyLentSection';
import MoneyBorrowedSection from './MoneyBorrowedSection';

export default function MainNavigation() {
  const [currentView, setCurrentView] = useState('dashboard');
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <Dashboard />
            
            {/* Navigation Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" 
                    onClick={() => setCurrentView('money-lent')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium text-green-600">
                    Money Lent
                  </CardTitle>
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    View and manage money you've lent to family members
                  </p>
                  <Button className="mt-4 w-full" variant="outline">
                    View Money Lent →
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" 
                    onClick={() => setCurrentView('money-borrowed')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium text-red-600">
                    Money Borrowed
                  </CardTitle>
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    View and manage money you've borrowed from family members
                  </p>
                  <Button className="mt-4 w-full" variant="outline">
                    View Money Borrowed →
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      
      case 'money-lent':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => setCurrentView('dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
              <h1 className="text-2xl font-bold text-green-600">Money Lent</h1>
            </div>
            <MoneyLentSection />
          </div>
        );
      
      case 'money-borrowed':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => setCurrentView('dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
              <h1 className="text-2xl font-bold text-red-600">Money Borrowed</h1>
            </div>
            <MoneyBorrowedSection />
          </div>
        );
      
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 sm:p-6">
        {/* Header with user info */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-center flex-1">
            {currentView === 'dashboard' && (
              <>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">Loan Tracker</h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Manage your family loans and track transactions
                </p>
              </>
            )}
          </div>
          
          {/* User Menu */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex items-center space-x-2 text-sm">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{user?.name}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleLogout}
              className="flex items-center space-x-1"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
        
        {renderCurrentView()}
      </div>
    </div>
  );
}

