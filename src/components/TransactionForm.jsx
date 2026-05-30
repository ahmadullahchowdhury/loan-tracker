'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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
    sendEmail: true,
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: transactionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', loan._id] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['overview'] });
      queryClient.invalidateQueries({ queryKey: ['loan', loan._id] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => transactionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', loan._id] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['overview'] });
      queryClient.invalidateQueries({ queryKey: ['loan', loan._id] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      loanId: loan._id,
      amount: parseFloat(formData.amount),
      transactionDate: new Date(formData.transactionDate),
    };
    if (transaction) {
      updateMutation.mutate({ id: transaction._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const typeOptions =
    loan.type === 'given'
      ? [
          { value: 'given', label: 'Additional Money Given' },
          { value: 'paidBack', label: 'Money Paid Back to Me' },
        ]
      : [
          { value: 'taken', label: 'Additional Money Taken' },
          { value: 'returned', label: 'Money Returned by Me' },
        ];

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="type">Transaction Type</Label>
        <Select value={formData.type} onValueChange={(v) => handleChange('type', v)}>
          <SelectTrigger><SelectValue placeholder="Select transaction type" /></SelectTrigger>
          <SelectContent>
            {typeOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
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
        <Select value={formData.method} onValueChange={(v) => handleChange('method', v)}>
          <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
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

      {!transaction && loan.contactEmail && (
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Send email alert</p>
            <p className="text-xs text-muted-foreground">Notify {loan.contactEmail}</p>
          </div>
          <Switch
            checked={formData.sendEmail}
            onCheckedChange={(checked) => handleChange('sendEmail', checked)}
          />
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : transaction ? 'Update Transaction' : 'Add Transaction'}
        </Button>
      </div>
    </form>
  );
}
