'use client';

import { Menu, Search } from 'lucide-react';
import { UserMenu } from './user-menu';
import { Input } from '@/components/ui/input';
import { NotificationsDropdown } from './notifications-dropdown';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface HeaderProps {
  onMenuClick: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showSearch?: boolean;
}

export function Header({ onMenuClick, searchValue = '', onSearchChange, showSearch = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-background">
      <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
        {/* Mobile menu button — desktop usa el toggle interno del sidebar */}
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Mobile brand */}
        <div className="ml-4 flex flex-1 items-center md:hidden">
          <span className="text-lg font-bold text-primary">PH Sport</span>
        </div>

        {showSearch ? (
          <div className="mx-auto hidden max-w-md flex-1 md:flex">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar diseños, jugadores, partidos..."
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        ) : (
          <div className="hidden flex-1 md:block" />
        )}

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <NotificationsDropdown />
          <UserMenu />
        </div>
      </div>
      <div className="mx-4 border-b border-border" />
    </header>
  );
}
