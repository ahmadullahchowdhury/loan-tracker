import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { transactionsApi, loansApi } from '@/lib/api';
import { Plus, Edit, Trash2 } from 'lucide-react';
import TransactionForm from './TransactionForm';

export default function PersonTransactionDetails({ loanId }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);


  
  
  const queryClient = useQueryClient();

  const { data: loan, isLoading: loanLoading } = useQuery({
    queryKey: ['loan', loanId],
    queryFn: () => loansApi.getById(loanId),
  });

  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['transactions', loanId],
    queryFn: () => transactionsApi.getByLoanId(loanId).then(res => res),
  });

  const deleteMutation = useMutation({
    mutationFn: transactionsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions', loanId]);
      queryClient.invalidateQueries(['loans']);
      queryClient.invalidateQueries(['overview']);
    },
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTransactionTypeLabel = (type) => {
    const labels = {
      given: 'Money Given',
      paidBack: 'Money Paid Back',
      taken: 'Money Taken',
      returned: 'Money Returned',
    };
    return labels[type] || type;
  };

  const getTransactionTypeColor = (type) => {
    const colors = {
      given: 'bg-red-100 text-red-800',
      paidBack: 'bg-green-100 text-green-800',
      taken: 'bg-blue-100 text-blue-800',
      returned: 'bg-purple-100 text-purple-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
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
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-muted rounded"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive">Error loading transaction history</p>;
  }


  return (
    <div className="space-y-6">
      {/* Current Balance Section */}
      <div className="bg-muted/50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold">
              Current Balance: {formatCurrency(loan.currentBalance)}
            </h3>
            <p className="text-sm text-muted-foreground">
              Initial Amount: {formatCurrency(loan.initialAmount)}
            </p>
            <p className="text-sm text-muted-foreground">
              Type: {loan.type === 'given' ? 'Money Lent' : 'Money Borrowed'}
            </p>
            {loan.notes && (
              <p className="text-sm text-muted-foreground mt-1">
                Notes: {loan.notes}
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
                <DialogTitle>
                  {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
                </DialogTitle>
              </DialogHeader>
              <TransactionForm 
                loan={loan}
                transaction={editingTransaction}
                onClose={handleFormClose}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <h4 className="text-lg font-semibold mb-4">Transaction History</h4>
        {transactions?.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No transactions found.
          </p>
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
              {transactions?.map((transaction) => (
                <TableRow key={transaction._id}>
                  <TableCell>
                    {new Date(transaction.transactionDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge className={getTransactionTypeColor(transaction.type)}>
                      {getTransactionTypeLabel(transaction.type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell>{transaction.method}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {transaction.notes || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(transaction)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(transaction._id)}
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

