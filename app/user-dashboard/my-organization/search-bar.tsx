import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from 'lucide-react';

interface SearchBarProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onSearch: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  onSearchTermChange,
  onSearch,
  onKeyDown,
}) => {
  return (
    <div className="relative w-full sm:w-64">
      <Input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => onSearchTermChange(e.target.value)}
        onKeyDown={onKeyDown}
        className="w-full pr-8"
      />
      <Button
        size="icon"
        variant="ghost"
        className="absolute right-0 top-0 h-full"
        onClick={onSearch}
        type="submit"
      >
        <Search className="h-4 w-4" />
      </Button>
    </div>
  );
};

