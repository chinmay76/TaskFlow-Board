
"use client";

import type * as React from 'react';
import { useState, DragEvent, useRef, useEffect } from 'react';
import type { List as ListType, Card as CardType } from '@/lib/types';
import { TaskCard } from './task-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Trash2, GripVertical, Edit2 } from 'lucide-react';

interface TaskListProps {
  list: ListType;
  onAddCard: (listId: string, cardTitle: string) => void;
  onEditCard: (listId: string, card: CardType) => void;
  onDeleteCard: (listId: string, cardId: string) => void;
  onDeleteList: (listId: string) => void;
  onRenameList: (listId: string, newTitle: string) => void;
  onDragStartCard: (e: DragEvent<HTMLDivElement>, cardId: string, sourceListId: string) => void;
  onDropOnList: (e: DragEvent<HTMLDivElement>, targetListId: string) => void;
  onDragOverList: (e: DragEvent<HTMLDivElement>) => void;
  onDragStartList: (e: DragEvent<HTMLDivElement>, listId: string) => void;
  onDragEndList: (e: DragEvent<HTMLDivElement>) => void;
}

export function TaskList({
  list,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onDeleteList,
  onRenameList,
  onDragStartCard,
  onDropOnList,
  onDragOverList,
  onDragStartList,
  onDragEndList
}: TaskListProps) {
  const [newCardTitle, setNewCardTitle] = useState('');
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editableListTitle, setEditableListTitle] = useState(list.title);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditableListTitle(list.title);
  }, [list.title]);
  
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleAddCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCardTitle.trim()) {
      onAddCard(list.id, newCardTitle.trim());
      setNewCardTitle('');
      setIsAddingCard(false);
    }
  };

  const handleRenameSubmit = () => {
    if (editableListTitle.trim() && editableListTitle.trim() !== list.title) {
      onRenameList(list.id, editableListTitle.trim());
    }
    setIsEditingTitle(false);
  };
  
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      setEditableListTitle(list.title);
      setIsEditingTitle(false);
    }
  };

  const handleDragStartListInternal = (e: DragEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-card-id]') || (e.target as HTMLElement).closest('input') || (e.target as HTMLElement).closest('button:not(.list-drag-handle-button)')) {
      e.stopPropagation();
      return;
    }
    
    const dragHandleElement = (e.target as HTMLElement).closest('.list-drag-handle');
    if (!dragHandleElement && !(e.target as HTMLElement).classList.contains('list-drag-handle') && !(e.target as HTMLElement).closest('.card-header-title-area')) {
         e.preventDefault();
         return;
    }
    onDragStartList(e, list.id);
    e.currentTarget.classList.add('opacity-75', 'shadow-2xl');
  };

  const handleDragEndListInternal = (e: DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('opacity-75', 'shadow-2xl');
    onDragEndList(e);
  };

  return (
    <Card 
      className="w-72 min-w-[272px] h-full bg-secondary shadow-md flex flex-col max-h-[calc(100vh-10rem)]"
      onDrop={(e) => { e.stopPropagation(); onDropOnList(e, list.id);}}
      onDragOver={(e) => { e.stopPropagation(); onDragOverList(e);}}
      draggable={!isEditingTitle} // Prevent dragging while editing title
      onDragStart={handleDragStartListInternal}
      onDragEnd={handleDragEndListInternal}
      aria-label={`List: ${list.title}`}
      data-list-id={list.id}
    >
      <CardHeader 
        className="p-3 flex flex-row items-center justify-between border-b list-drag-handle"
        role="button"
        tabIndex={isEditingTitle ? -1 : 0}
      >
        <div className="flex items-center flex-grow min-w-0 card-header-title-area">
          <GripVertical className="h-5 w-5 mr-2 text-muted-foreground flex-shrink-0 list-drag-handle-button cursor-grab active:cursor-grabbing" />
          {isEditingTitle ? (
            <Input
              ref={titleInputRef}
              type="text"
              value={editableListTitle}
              onChange={(e) => setEditableListTitle(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={handleTitleKeyDown}
              className="h-8 text-lg font-semibold flex-grow"
              aria-label="Edit list title"
            />
          ) : (
            <CardTitle 
              className="text-lg font-semibold truncate cursor-pointer hover:text-primary"
              onClick={() => setIsEditingTitle(true)}
              title={list.title}
            >
              {list.title}
            </CardTitle>
          )}
        </div>
        <div className="flex items-center flex-shrink-0">
            {!isEditingTitle && (
                 <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsEditingTitle(true)} 
                    aria-label="Edit list title"
                    className="h-8 w-8"
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <Edit2 className="h-4 w-4" />
                </Button>
            )}
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => { e.stopPropagation(); onDeleteList(list.id);}} 
                aria-label="Delete list"
                className="h-8 w-8"
                onMouseDown={(e) => e.stopPropagation()}
            >
            <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3 space-y-2 flex-grow min-h-[50px] task-list-content overflow-y-auto">
        {list.cards.map((card) => (
          <TaskCard
            key={card.id}
            card={card}
            listId={list.id}
            onEdit={(editedCard) => onEditCard(list.id, editedCard)}
            onDelete={(cardId) => onDeleteCard(list.id, cardId)}
            onDragStart={onDragStartCard}
          />
        ))}
        {list.cards.length === 0 && !isAddingCard && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground text-center py-4">This list is empty.</p>
          </div>
        )}
      </CardContent>
      <div className="p-3 border-t mt-auto">
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
            onMouseDown={(e) => e.stopPropagation()}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add a card
          </Button>
        )}
      </div>
    </Card>
  );
}
