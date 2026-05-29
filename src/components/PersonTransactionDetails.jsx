'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { transactionsApi, loansApi } from '@/lib/api';
import { Plus, Edit, Trash2, Mail } from 'lucide-react';
import TransactionForm from './TransactionForm';

export default function PersonTransactionDetails({ loanId }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const queryClient = useQueryClient();

  const { data: loan, isLoading: loanLoading } = useQuery({
    queryKey: ['loan', loanId],
    queryFn: () => loansApi.getById(loanId),
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['transactions', loanId],
    queryFn: () => transactionsApi.getByLoanId(loanId),
  });

  const deleteMutation = useMutation({
    mutationFn: transactionsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', loanId] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['overview'] });
    },
  });

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', minimumFractionDigits: 0 }).format(amount);

  const typeLabel = { given: 'Money Given', paidBack: 'Money Paid Back', taken: 'Money Taken', returned: 'Money Returned' };
  const typeColor = {
    given: 'bg-red-100 text-red-800',
    paidBack: 'bg-green-100 text-green-800',
    taken: 'bg-blue-100 text-blue-800',
    returned: 'bg-purple-100 text-purple-800',
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTransaction(null);
  };

  if (isLoading || loanLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-muted rounded"></div>)}
      </div>
    );
  }

  if (error) return <p className="text-destructive">Error loading transaction history</p>;

  return (
    <div className="space-y-6">
      <div className="bg-muted/50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold">
              {loan.type === 'given' ? 'Current Balance (Need to Pay)' : 'Current Balance (I will Pay)'}: {formatCurrency(loan.currentBalance)}
            </h3>
            {loan.contactEmail && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Mail className="h-3.5 w-3.5" />
                {loan.contactEmail}
              </p>
            )}
          </div>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingTransaction(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}</DialogTitle>
              </DialogHeader>
              <TransactionForm loan={loan} transaction={editingTransaction} onClose={handleFormClose} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div>
        <h4 className="text-lg font-semibold mb-4">Transaction History</h4>
        {transactions?.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No transactions found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions?.map((t) => (
                <TableRow key={t._id}>
                  <TableCell>{new Date(t.transactionDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge className={typeColor[t.type]}>{typeLabel[t.type]}</Badge>
                  </TableCell>
                  <TableCell className="font-semibold">{formatCurrency(t.amount)}</TableCell>
                  <TableCell>{t.method}</TableCell>
                  <TableCell className="max-w-xs truncate">{t.notes || '-'}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(t)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(t._id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
