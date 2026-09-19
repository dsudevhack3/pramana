import { useEffect, useId, useRef, useState } from 'react';
import { Badge, Field, Icon, Input, cn } from '@pramana/ui-components';
import type { DrugCatalogEntry } from '@pramana/types';
import { searchDrugs } from '../../api/prescriptions.api';
import { useDebounce } from '../../hooks/useDebounce';

/**
 * Flow 2: the drug name is resolved against the CDSCO / formulary catalogue,
 * never typed freehand into the record. A typo that reaches a hash-chained,
 * immutable record cannot be edited out afterwards - it can only be voided and
 * re-signed - so the typo has to be prevented at the keyboard.
 *
 * SS7: results fade in with a 22ms stagger, opacity only, capped at six visible
 * items. No slide, no scale.
 */
export function DrugSearchInput({
  onSelect,
  selected,
}: {
  onSelect: (drug: DrugCatalogEntry | null) => void;
  selected: DrugCatalogEntry | null;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DrugCatalogEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const debounced = useDebounce(query);
  const listId = useId();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (selected || debounced.trim().length < 2) {
      setResults([]);
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    searchDrugs(debounced.trim(), controller.signal)
      .then((found) => {
        setResults(found.slice(0, 6));
        setOpen(true);
        setActive(0);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [debounced, selected]);

  function choose(drug: DrugCatalogEntry) {
    onSelect(drug);
    setQuery('');
    setOpen(false);
  }

  if (selected) {
    return (
      <Field label="Medicine" help="Resolved from the national formulary, so the record carries an exact code.">
        <div className="flex items-center gap-3 rounded-control border border-line bg-surface p-3">
          <Icon name="pill" size={20} className="text-muted" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate font-medium">{selected.drug_name}</span>
            <span className="text-caption text-muted">
              {selected.form} · {selected.schedule} · code {selected.drug_code}
            </span>
          </div>
          {selected.is_controlled ? <Badge status="pending" label="Controlled" /> : null}
          <button
            type="button"
            onClick={() => onSelect(null)}
            aria-label={`Remove ${selected.drug_name}`}
            className="inline-flex size-touch items-center justify-center rounded-control text-muted hover:bg-canvas-2"
          >
            <Icon name="x" size={18} />
          </button>
        </div>
      </Field>
    );
  }

  return (
    <Field
      label="Medicine"
      required
      help="Start typing a brand or molecule name. Pick from the list - free text is not accepted."
    >
      <div className="relative">
        <Input
          value={query}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          placeholder="Amoxicillin, Pantoprazole, Tramadol"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (!open || results.length === 0) return;
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (i + 1) % results.length); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (i - 1 + results.length) % results.length); }
            if (e.key === 'Enter') { e.preventDefault(); choose(results[active]!); }
            if (e.key === 'Escape') setOpen(false);
          }}
          className="pr-10"
        />
        {loading ? (
          <span
            aria-hidden
            className="spin absolute right-3 top-1/2 size-4 -translate-y-1/2 rounded-full border-2 border-muted border-r-transparent"
          />
        ) : null}

        {open && results.length > 0 ? (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-20 mt-1 flex w-full list-none flex-col overflow-hidden rounded-control border border-line bg-surface p-0"
          >
            {results.map((drug, index) => (
              <li key={drug.drug_code} role="option" aria-selected={index === active}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(drug)}
                  style={{ animationDelay: `${index * 22}ms` }}
                  className={cn(
                    'flex min-h-touch w-full items-center gap-3 px-3 py-2 text-left',
                    'motion-safe:animate-[pramana-field-in_var(--dur-quick)_var(--ease-out)_both]',
                    index === active ? 'bg-canvas-2' : 'bg-surface',
                  )}
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-body-sm font-medium">{drug.drug_name}</span>
                    <span className="text-caption text-muted">{drug.form} · {drug.schedule}</span>
                  </div>
                  {drug.is_controlled ? <Badge status="pending" label="Controlled" /> : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {open && !loading && debounced.trim().length >= 2 && results.length === 0 ? (
          <p className="mt-2 text-caption text-muted">
            Nothing in the formulary matches that. Check the spelling, or search by the molecule instead
            of the brand.
          </p>
        ) : null}
      </div>
    </Field>
  );
}
