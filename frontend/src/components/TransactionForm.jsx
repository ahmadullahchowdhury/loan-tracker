import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { transactionsApi } from '@/lib/api';

export default function TransactionForm({ loan, transaction, onClose }) {
  const [formData, setFormData] = useState({
    type: transaction?.type || (loan.type === 'given' ? 'given' : 'taken'),
    amount: transaction?.amount || '',
    transactionDate: transaction?.transactionDate 
      ? new Date(transaction.transactionDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    method: transaction?.method || 'Cash',
    notes: transaction?.notes || '',
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: transactionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions', loan._id]);
      // queryClient.invalidateQueries(['loans']);
      queryClient.invalidateQueries(['overview']);
      queryClient.invalidateQueries(['loan', loan._id]);
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => transactionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions', loan._id]);
      // queryClient.invalidateQueries(['loans']);
      queryClient.invalidateQueries(['overview']);
      queryClient.invalidateQueries(['loan', loan._id]);
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const transactionData = {
      ...formData,
      loanId: loan._id,
      amount: parseFloat(formData.amount),
      transactionDate: new Date(formData.transactionDate),
    };

    if (transaction) {
      updateMutation.mutate({
        id: transaction._id,
        data: transactionData
      });
    } else {
      createMutation.mutate(transactionData);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getTransactionTypeOptions = () => {
    if (loan.type === 'given') {
      return [
        { value: 'given', label: 'Additional Money Given' },
        { value: 'paidBack', label: 'Money Paid Back to Me' },
      ];
    } else {
      return [
        { value: 'taken', label: 'Additional Money Taken' },
        { value: 'returned', label: 'Money Returned by Me' },
      ];
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="type">Transaction Type</Label>
        <Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select transaction type" />
          </SelectTrigger>
          <SelectContent>
            {getTransactionTypeOptions().map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          type="number"
          value={formData.amount}
          onChange={(e) => handleChange('amount', e.target.value)}
          placeholder="Enter amount"
          min="0"
          step="0.01"
          required
        />
      </div>

      <div>
        <Label htmlFor="transactionDate">Transaction Date</Label>
        <Input
          id="transactionDate"
          type="date"
          value={formData.transactionDate}
          onChange={(e) => handleChange('transactionDate', e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="method">Transaction Method</Label>
        <Select value={formData.method} onValueChange={(value) => handleChange('method', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Cash">Cash</SelectItem>
            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
            <SelectItem value="Mobile Banking">Mobile Banking</SelectItem>
            <SelectItem value="Check">Check</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Additional notes about this transaction..."
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : (transaction ? 'Update Transaction' : 'Add Transaction')}
        </Button>
      </div>
    </form>
  );
}

