'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { loansApi } from '@/lib/api';
import { format } from 'date-fns';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import LoanForm from './LoanForm';
import PersonTransactionDetails from './PersonTransactionDetails';

export default function MoneyBorrowedSection() {
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);
  const queryClient = useQueryClient();

  const { data: allLoans, isLoading, error } = useQuery({
    queryKey: ['loans'],
    queryFn: loansApi.getAll,
  });

  const borrowedLoans = allLoans?.filter((loan) => loan.type === 'taken') || [];

  const deleteMutation = useMutation({
    mutationFn: loansApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['overview'] });
    },
  });

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', minimumFractionDigits: 0 }).format(amount);

  const TX_LABELS = { given: 'Lent', paidBack: 'Paid Back', taken: 'Borrowed', returned: 'Returned' };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this loan? This will also delete all related transactions.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (loan) => { setEditingLoan(loan); setIsFormOpen(true); };
  const handleViewDetails = (loan) => { setSelectedLoan(loan); setIsDetailsOpen(true); };
  const handleFormClose = () => { setIsFormOpen(false); setEditingLoan(null); };

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Money Borrowed</CardTitle></CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-muted rounded"></div>)}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader><CardTitle>Money Borrowed</CardTitle></CardHeader>
        <CardContent><p className="text-destructive">Error loading loans</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-red-600">Money Borrowed</CardTitle>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingLoan(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Person
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingLoan ? 'Edit Loan' : 'Add New Person (Money Borrowed)'}</DialogTitle>
            </DialogHeader>
            <LoanForm loan={editingLoan} onClose={handleFormClose} defaultType="taken" />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {borrowedLoans.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No money borrowed records found. Add your first loan to get started.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Person Name</TableHead>
                <TableHead className="text-center">Current Balance (I will Pay)</TableHead>
                <TableHead>Last Transaction</TableHead>
                <TableHead className="w-[10px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {borrowedLoans.map((loan) => (
                <TableRow key={loan._id}>
                  <TableCell className="font-medium">{loan.personName}</TableCell>
                  <TableCell className={`font-semibold text-center ${loan.currentBalance > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                    {formatCurrency(loan.currentBalance)}
                  </TableCell>
                  <TableCell>
                    {loan.lastTransaction ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{formatCurrency(loan.lastTransaction.amount)}</span>
                        <span className="text-xs text-muted-foreground">
                          {TX_LABELS[loan.lastTransaction.type]} &middot;{' '}
                          {format(new Date(loan.lastTransaction.transactionDate), 'MMM d, yyyy')}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(loan)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(loan)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(loan._id)} disabled={deleteMutation.isPending}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-7xl">
            <DialogHeader>
              <DialogTitle>{selectedLoan?.personName} - Transaction Details</DialogTitle>
            </DialogHeader>
            {selectedLoan && (
              <PersonTransactionDetails loanId={selectedLoan._id} onClose={() => setIsDetailsOpen(false)} />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
