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
import { loansApi } from '@/lib/api';

export default function LoanForm({ loan, onClose, defaultType = 'given' }) {
  const [formData, setFormData] = useState({
    personName: loan?.personName || '',
    type: loan?.type || defaultType,
    initialAmount: loan?.initialAmount || '',
    currency: loan?.currency || 'BDT',
    notes: loan?.notes || '',
    method: 'Cash', // For initial transaction
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: loansApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['loans']);
      queryClient.invalidateQueries(['overview']);
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => loansApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['loans']);
      queryClient.invalidateQueries(['overview']);
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (loan) {
      // Update existing loan (only allow updating certain fields)
      updateMutation.mutate({
        id: loan._id,
        data: {
          personName: formData.personName,
          notes: formData.notes,
          currency: formData.currency,
        }
      });
    } else {
      // Create new loan
      createMutation.mutate({
        ...formData,
        initialAmount: parseFloat(formData.initialAmount),
      });
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="personName">Person Name</Label>
        <Input
          id="personName"
          value={formData.personName}
          onChange={(e) => handleChange('personName', e.target.value)}
          placeholder="e.g., Elder Brother, Auntie"
          required
        />
      </div>

      {!loan && (
        <>
          <div>
            <Label htmlFor="type">Loan Type</Label>
            <Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select loan type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="given">Money Lent (I gave money)</SelectItem>
                <SelectItem value="taken">Money Borrowed (I took money)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="initialAmount">Initial Amount</Label>
            <Input
              id="initialAmount"
              type="number"
              value={formData.initialAmount}
              onChange={(e) => handleChange('initialAmount', e.target.value)}
              placeholder="Enter amount"
              min="0"
              step="0.01"
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
        </>
      )}

      <div>
        <Label htmlFor="currency">Currency</Label>
        <Select value={formData.currency} onValueChange={(value) => handleChange('currency', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BDT">BDT (Bangladeshi Taka)</SelectItem>
            <SelectItem value="USD">USD (US Dollar)</SelectItem>
            <SelectItem value="EUR">EUR (Euro)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Additional notes about this loan..."
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : (loan ? 'Update Loan' : 'Create Loan')}
        </Button>
      </div>
    </form>
  );
}

