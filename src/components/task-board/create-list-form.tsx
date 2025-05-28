"use client";

import type * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface CreateListFormProps {
  onAddList: (title: string) => void;
}

export function CreateListForm({ onAddList }: CreateListFormProps) {
  const [listTitle, setListTitle] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (listTitle.trim()) {
      onAddList(listTitle.trim());
      setListTitle('');
      setIsEditing(false);
    }
  };

  if (!isEditing) {
    return (
      <Button
        variant="outline"
        onClick={() => setIsEditing(true)}
        className="min-w-[272px] h-auto p-4 flex items-center justify-start text-left bg-white/50 hover:bg-white/70 border-dashed border-muted-foreground/50"
      >
        <PlusCircle className="mr-2 h-5 w-5" /> Add another list
      </Button>
    );
  }

  return (
    <Card className="p-2 bg-secondary min-w-[272px] shadow-none">
      <CardContent className="p-0">
        <form onSubmit={handleSubmit} className="space-y-2">
          <Input
            type="text"
            value={listTitle}
            onChange={(e) => setListTitle(e.target.value)}
            placeholder="Enter list title..."
            className="bg-card"
            autoFocus
            aria-label="New list title"
          />
          <div className="flex items-center space-x-2">
            <Button type="submit" variant="default">Add List</Button>
            <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
