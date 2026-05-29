'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { loansApi } from '@/lib/api';

export default function LoanForm({ loan, onClose, defaultType = 'given' }) {
  const queryClient = useQueryClient();

  // In edit mode, always fetch the loan fresh from the server so we never
  // display stale cached data (e.g. a contactEmail saved in a previous session).
  const { data: freshLoan } = useQuery({
    queryKey: ['loan', loan?._id],
    queryFn: () => loansApi.getById(loan._id),
    enabled: !!loan?._id,
    staleTime: 0,
    refetchOnMount: 'always', // always hit the server when the edit form opens
  });

  const source = freshLoan ?? loan;

  const [formData, setFormData] = useState({
    personName: loan?.personName || '',
    type: loan?.type || defaultType,
    currency: loan?.currency || 'BDT',
    notes: loan?.notes || '',
    contactEmail: loan?.contactEmail || '',
  });

  // Sync form when fresh server data arrives (covers the edit-mode case)
  useEffect(() => {
    if (freshLoan) {
      setFormData({
        personName: freshLoan.personName || '',
        type: freshLoan.type || defaultType,
        currency: freshLoan.currency || 'BDT',
        notes: freshLoan.notes || '',
        contactEmail: freshLoan.contactEmail || '',
      });
    }
  }, [freshLoan]);

  const createMutation = useMutation({
    mutationFn: loansApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['overview'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => loansApi.update(id, data),
    onSuccess: (updatedLoan) => {
      queryClient.setQueryData(['loan', updatedLoan._id], updatedLoan);
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['overview'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loan) {
      updateMutation.mutate({
        id: loan._id,
        data: {
          personName: formData.personName,
          notes: formData.notes,
          currency: formData.currency,
          contactEmail: formData.contactEmail,
        },
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));
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

      <div>
        <Label htmlFor="contactEmail">
          Their Email <span className="text-muted-foreground font-normal">(optional — for transaction notifications)</span>
        </Label>
        <Input
          id="contactEmail"
          type="email"
          value={formData.contactEmail}
          onChange={(e) => handleChange('contactEmail', e.target.value)}
          placeholder="e.g., friend@example.com"
        />
      </div>

      <div>
        <Label htmlFor="currency">Currency</Label>
        <Select value={formData.currency} onValueChange={(v) => handleChange('currency', v)}>
          <SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger>
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
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : loan ? 'Update Loan' : 'Create Loan'}
        </Button>
      </div>
    </form>
  );
}
