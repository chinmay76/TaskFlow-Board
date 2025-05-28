
"use client";

import type * as React from 'react';
import type { DragEvent } from 'react';
import type { Card as CardType } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit3, Trash2 } from 'lucide-react';

interface TaskCardProps {
  card: CardType;
  listId: string;
  onEdit: (card: CardType) => void;
  onDelete: (cardId: string) => void;
  onDragStart: (e: DragEvent<HTMLDivElement>, cardId: string, sourceListId: string) => void;
}

export function TaskCard({ card, listId, onEdit, onDelete, onDragStart }: TaskCardProps) {
  const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
    onDragStart(e, card.id, listId);
    e.currentTarget.classList.add('opacity-50', 'shadow-xl');
    // Set a specific data type for cards, though not strictly necessary with current state-based approach
    e.dataTransfer.setData('application/task-card-id', card.id); 
  };

  const handleDragEnd = (e: DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('opacity-50', 'shadow-xl');
  };

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className="mb-3 cursor-grab active:cursor-grabbing bg-card shadow-md hover:shadow-lg transition-shadow"
      aria-label={`Task: ${card.title}`}
      data-card-id={card.id} // Added for easier identification during drop
    >
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-base font-medium">{card.title}</CardTitle>
        {card.description && (
          <CardDescription className="text-sm mt-1 line-clamp-2">
            {card.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardFooter className="p-3 pt-1 flex justify-end space-x-2">
        <Button variant="ghost" size="icon" onClick={() => onEdit(card)} aria-label="Edit card">
          <Edit3 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(card.id)} aria-label="Delete card">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </CardFooter>
    </Card>
  );
}

    