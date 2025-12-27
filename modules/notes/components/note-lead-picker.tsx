'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import { SearchableSelect, type SearchableSelectOption } from '@/modules/shared';
import { getAssignedLeadsForNotes } from '../lib/actions';

interface Lead {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
}

interface NoteLeadPickerProps {
  value: string | null;
  selectedLead?: { id: string; first_name: string | null; last_name: string | null } | null;
  onChange: (leadId: string | null) => void;
  disabled?: boolean;
}

export function NoteLeadPicker({
  value,
  selectedLead,
  onChange,
  disabled = false,
}: NoteLeadPickerProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isLoaded, setIsLoaded] = useState(false);

  // Fetch assigned leads on mount
  useEffect(() => {
    startTransition(async () => {
      const { leads: fetchedLeads } = await getAssignedLeadsForNotes();
      setLeads(fetchedLeads);
      setIsLoaded(true);
    });
  }, []);

  // Convert leads to SearchableSelect options
  const options: SearchableSelectOption[] = useMemo(() => {
    return leads.map((lead) => {
      const parts = [lead.first_name, lead.last_name].filter(Boolean);
      const label = parts.length > 0 ? parts.join(' ') : 'Sans nom';
      return {
        value: lead.id,
        label,
        sublabel: lead.company || undefined,
      };
    });
  }, [leads]);

  // If we have a selected lead from props but it's not in our loaded options yet,
  // add it temporarily so the select shows the correct value
  const optionsWithSelected = useMemo(() => {
    if (!selectedLead || !value) return options;
    if (options.some((opt) => opt.value === value)) return options;

    const parts = [selectedLead.first_name, selectedLead.last_name].filter(Boolean);
    const label = parts.length > 0 ? parts.join(' ') : 'Sans nom';
    return [{ value: selectedLead.id, label }, ...options];
  }, [options, selectedLead, value]);

  return (
    <SearchableSelect
      label="Lier à un lead"
      value={value}
      onChange={onChange}
      options={optionsWithSelected}
      placeholder="Sélectionner un lead..."
      searchPlaceholder="Rechercher un lead..."
      emptyMessage="Aucun lead assigné"
      noResultsMessage="Aucun résultat"
      isLoading={isPending && !isLoaded}
      loadingMessage="Chargement..."
      disabled={disabled}
      clearable
    />
  );
}
