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
  onDragStartList
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

  const handleInternalDragStartCard = (e: DragEvent<HTMLDivElement>, cardId: string) => {
    onDragStartCard(e, cardId, list.id);
  };
  
  const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
    onDragStartList(e, list.id);
    e.currentTarget.classList.add('opacity-75');
  };

  const handleDragEnd = (e: DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('opacity-75');
  };

  return (
    <Card 
      className="w-72 min-w-[272px] h-fit bg-secondary shadow-md flex flex-col"
      onDrop={(e) => onDropOnList(e, list.id)}
      onDragOver={onDragOverList}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      aria-label={`List: ${list.title}`}
    >
      <CardHeader className="p-3 flex flex-row items-center justify-between border-b cursor-grab active:cursor-grabbing">
        <div className="flex items-center">
          <GripVertical className="h-5 w-5 mr-2 text-muted-foreground" />
          <CardTitle className="text-lg font-semibold">{list.title}</CardTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={() => onDeleteList(list.id)} aria-label="Delete list">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </CardHeader>
      <CardContent className="p-3 space-y-2 flex-grow min-h-[50px]">
        {list.cards.map((card) => (
          <TaskCard
            key={card.id}
            card={card}
            listId={list.id}
            onEdit={(editedCard) => onEditCard(list.id, editedCard)}
            onDelete={(cardId) => onDeleteCard(list.id, cardId)}
            onDragStart={handleInternalDragStartCard}
          />
        ))}
        {list.cards.length === 0 && !isAddingCard && (
          <p className="text-sm text-muted-foreground text-center py-4">This list is empty.</p>
        )}
      </CardContent>
      <div className="p-3 border-t">
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
          <Button variant="ghost" onClick={() => setIsAddingCard(true)} className="w-full justify-start">
            <PlusCircle className="mr-2 h-4 w-4" /> Add a card
          </Button>
        )}
      </div>
    </Card>
  );
}
