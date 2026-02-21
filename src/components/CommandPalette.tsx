import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getRecentAnalyses } from '@/lib/agents';
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { LayoutDashboard, GitCompareArrows, Clock, Globe } from 'lucide-react';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  if (!user) return null;

  const recent = getRecentAnalyses().slice(0, 5);
  const go = (path: string) => { navigate(path); setOpen(false); };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search or navigate... (⌘K)" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => go('/dashboard')}>
            <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
          </CommandItem>
          <CommandItem onSelect={() => go('/compare')}>
            <GitCompareArrows className="mr-2 h-4 w-4" /> Compare Leads
          </CommandItem>
          <CommandItem onSelect={() => go('/history')}>
            <Clock className="mr-2 h-4 w-4" /> History
          </CommandItem>
        </CommandGroup>
        {recent.length > 0 && (
          <CommandGroup heading="Recent Analyses">
            {recent.map(a => (
              <CommandItem key={a.id} onSelect={() => go(`/analysis?id=${a.id}`)}>
                <Globe className="mr-2 h-4 w-4" />
                <span className="flex-1">{a.research.companyName}</span>
                <span className="text-xs text-muted-foreground font-mono">{a.score.leadScore}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
