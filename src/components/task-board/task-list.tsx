
"use client";

import type * as React from 'react';
import { useState, DragEvent } from 'react';
import type { List as ListType, Card as CardType } from '@/lib/types';
import { TaskCard } from './task-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Trash2, GripVertical } from 'lucide-react';

interface TaskListProps {
  list: ListType;
  onAddCard: (listId: string, cardTitle: string) => void;
  onEditCard: (listId: string, card: CardType) => void;
  onDeleteCard: (listId: string, cardId: string) => void;
  onDeleteList: (listId: string) => void;
  onDragStartCard: (e: DragEvent<HTMLDivElement>, cardId: string, sourceListId: string) => void;
  onDropOnList: (e: DragEvent<HTMLDivElement>, targetListId: string) => void;
  onDragOverList: (e: DragEvent<HTMLDivElement>) => void;
  onDragStartList: (e: DragEvent<HTMLDivElement>, listId: string) => void;
  onDragEndList: (e: DragEvent<HTMLDivElement>) => void; // Added for consistency
}

export function TaskList({
  list,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onDeleteList,
  onDragStartCard,
  onDropOnList,
  onDragOverList,
  onDragStartList,
  onDragEndList
}: TaskListProps) {
  const [newCardTitle, setNewCardTitle] = useState('');
  const [isAddingCard, setIsAddingCard] = useState(false);

  const handleAddCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCardTitle.trim()) {
      onAddCard(list.id, newCardTitle.trim());
      setNewCardTitle('');
      setIsAddingCard(false);
    }
  };
  
  const handleDragStartListInternal = (e: DragEvent<HTMLDivElement>) => {
    // Prevent card drag from triggering list drag if header is clicked precisely
    if ((e.target as HTMLElement).closest('[data-card-id]')) {
        e.stopPropagation(); // Stop card drag from bubbling to list drag
        return;
    }
    if (!(e.target as HTMLElement).closest('.list-drag-handle') && !(e.target as HTMLElement).classList.contains('list-drag-handle')) {
        // Only allow dragging by the handle or the header area not occupied by buttons
        const headerElement = (e.target as HTMLElement).closest('div[role="button"] > div:first-child'); // targeting the div with grip and title
        if(!headerElement) {
            e.preventDefault();
            return;
        }
    }
    onDragStartList(e, list.id);
    e.currentTarget.classList.add('opacity-75', 'shadow-2xl');
  };

  const handleDragEndListInternal = (e: DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('opacity-75', 'shadow-2xl');
    onDragEndList(e); // Propagate to parent
  };

  return (
    <Card 
      className="w-72 min-w-[272px] h-full bg-secondary shadow-md flex flex-col max-h-[calc(100vh-10rem)]" // Added max-h for scroll within list
      onDrop={(e) => { e.stopPropagation(); onDropOnList(e, list.id);}} // Stop propagation to board
      onDragOver={(e) => { e.stopPropagation(); onDragOverList(e);}} // Stop propagation to board
      draggable // List itself is draggable
      onDragStart={handleDragStartListInternal}
      onDragEnd={handleDragEndListInternal}
      aria-label={`List: ${list.title}`}
    >
      <CardHeader 
        className="p-3 flex flex-row items-center justify-between border-b cursor-grab active:cursor-grabbing list-drag-handle"
        role="button" // Make header draggable area clear
        tabIndex={0} // Make it focusable for a11y (though real a11y D&D is complex)
      >
        <div className="flex items-center pointer-events-none"> {/* pointer-events-none for children of drag handle */}
          <GripVertical className="h-5 w-5 mr-2 text-muted-foreground" />
          <CardTitle className="text-lg font-semibold">{list.title}</CardTitle>
        </div>
        <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => { e.stopPropagation(); onDeleteList(list.id);}} 
            aria-label="Delete list"
            onMouseDown={(e) => e.stopPropagation()} // Prevent drag start when clicking button
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </CardHeader>
      <CardContent className="p-3 space-y-2 flex-grow min-h-[50px] task-list-content overflow-y-auto"> {/* Added task-list-content class and overflow */}
        {list.cards.map((card) => (
          <TaskCard
            key={card.id}
            card={card}
            listId={list.id}
            onEdit={(editedCard) => onEditCard(list.id, editedCard)}
            onDelete={(cardId) => onDeleteCard(list.id, cardId)}
            onDragStart={onDragStartCard} // Pass directly from props
          />
        ))}
        {list.cards.length === 0 && !isAddingCard && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground text-center py-4">This list is empty.</p>
          </div>
        )}
      </CardContent>
      <div className="p-3 border-t mt-auto"> {/* mt-auto to push to bottom */}
        {isAddingCard ? (
          <form onSubmit={handleAddCardSubmit} className="space-y-2">
            <Input
              type="text"
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              placeholder="Enter card title..."
              className="bg-card"
              autoFocus
              aria-label="New card title"
            />
            <div className="flex items-center space-x-2">
              <Button type="submit" size="sm">Add Card</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddingCard(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button 
            variant="ghost" 
            onClick={() => setIsAddingCard(true)} 
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onMouseDown={(e) => e.stopPropagation()} // Prevent drag start when clicking button
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add a card
          </Button>
        )}
      </div>
    </Card>
  );
}

    