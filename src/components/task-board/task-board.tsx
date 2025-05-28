"use client";

import React, { useState, useEffect, DragEvent } from 'react';
import type { List, Card } from '@/lib/types';
import { TaskList } from './task-list';
import { CreateListForm } from './create-list-form';
import { EditCardModal } from './edit-card-modal';
import { DeleteConfirmationDialog } from './delete-confirmation-dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const initialData: List[] = [
  { id: 'list-seed-1', title: 'To Do', cards: [
    { id: 'card-seed-1', title: 'Grocery Shopping', description: 'Buy milk, eggs, bread.' },
    { id: 'card-seed-2', title: 'Book Doctor Appointment', description: 'Annual check-up.' },
  ]},
  { id: 'list-seed-2', title: 'In Progress', cards: [
    { id: 'card-seed-3', title: 'Develop new website feature', description: 'Implement user authentication module.' },
  ]},
  { id: 'list-seed-3', title: 'Done', cards: [
    { id: 'card-seed-4', title: 'Pay monthly bills', description: 'Electricity, internet, and water.' },
  ]}
];

export function TaskBoard() {
  const [lists, setLists] = useState<List[]>([]);
  const [editingCard, setEditingCard] = useState<{listId: string; card: Card} | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [deleteTarget, setDeleteTarget] = useState<{type: 'list' | 'card'; listId: string; cardId?: string; title: string} | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [draggedItem, setDraggedItem] = useState<{type: 'card' | 'list'; id: string; sourceListId?: string} | null>(null);

  useEffect(() => {
    const savedData = localStorage.getItem('taskBoardData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
           setLists(parsedData);
        } else {
          setLists(initialData); // Use initial data if localStorage is empty or malformed
        }
      } catch (error) {
        console.error("Failed to parse task board data from localStorage", error);
        setLists(initialData); // Fallback to initial data
        localStorage.removeItem('taskBoardData');
      }
    } else {
      setLists(initialData); // Set initial data if nothing in localStorage
    }
  }, []);

  useEffect(() => {
    if(lists.length > 0 || localStorage.getItem('taskBoardData')) { // Avoid overwriting initial load with empty array if lists is not yet populated
       localStorage.setItem('taskBoardData', JSON.stringify(lists));
    }
  }, [lists]);

  const addList = (title: string) => {
    const newList: List = { id: crypto.randomUUID(), title, cards: [] };
    setLists(prevLists => [...prevLists, newList]);
  };

  const confirmDeleteList = (listId: string) => {
    const listToDelete = lists.find(l => l.id === listId);
    if (listToDelete) {
      setDeleteTarget({ type: 'list', listId, title: listToDelete.title });
      setShowDeleteConfirm(true);
    }
  };

  const deleteList = () => {
    if (deleteTarget && deleteTarget.type === 'list') {
      setLists(prevLists => prevLists.filter(list => list.id !== deleteTarget.listId));
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }
  };
  
  const addCardToList = (listId: string, cardTitle: string) => {
    const newCard: Card = { id: crypto.randomUUID(), title: cardTitle, description: '' };
    setLists(prevLists => prevLists.map(list => 
      list.id === listId ? { ...list, cards: [...list.cards, newCard] } : list
    ));
  };

  const openEditCardModal = (listId: string, card: Card) => {
    setEditingCard({ listId, card });
    setShowEditModal(true);
  };

  const saveCardChanges = (cardId: string, title: string, description?: string) => {
    if (!editingCard) return;
    setLists(prevLists => prevLists.map(list => 
      list.id === editingCard.listId 
      ? { ...list, cards: list.cards.map(c => c.id === cardId ? {...c, title, description} : c) } 
      : list
    ));
    setShowEditModal(false);
    setEditingCard(null);
  };

  const confirmDeleteCard = (listId: string, cardId: string) => {
    const list = lists.find(l => l.id === listId);
    const card = list?.cards.find(c => c.id === cardId);
    if (card) {
      setDeleteTarget({ type: 'card', listId, cardId, title: card.title });
      setShowDeleteConfirm(true);
    }
  };

  const deleteCard = () => {
    if (deleteTarget && deleteTarget.type === 'card' && deleteTarget.cardId) {
      setLists(prevLists => prevLists.map(list => 
        list.id === deleteTarget.listId 
        ? { ...list, cards: list.cards.filter(c => c.id !== deleteTarget.cardId) } 
        : list
      ));
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: DragEvent<HTMLDivElement>, type: 'card' | 'list', id: string, sourceListId?: string) => {
    e.dataTransfer.setData('text/plain', id); // Required for Firefox
    setDraggedItem({ type, id, sourceListId });
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Allow drop
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropOnList = (e: DragEvent<HTMLDivElement>, targetListId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.type !== 'card' || !draggedItem.sourceListId) return;

    const cardId = draggedItem.id;
    const sourceListId = draggedItem.sourceListId;

    if (sourceListId === targetListId) { // Reordering within the same list
      const listIndex = lists.findIndex(l => l.id === targetListId);
      if (listIndex === -1) return;
      const currentCards = [...lists[listIndex].cards];
      const draggedCardIndex = currentCards.findIndex(c => c.id === cardId);
      if (draggedCardIndex === -1) return;
      
      const [draggedCard] = currentCards.splice(draggedCardIndex, 1);
      
      // Find drop position (simplified: drop at end)
      // For more precise positioning, calculate based on e.clientY relative to other cards
      currentCards.push(draggedCard); 

      setLists(prevLists => prevLists.map(l => l.id === targetListId ? {...l, cards: currentCards} : l));

    } else { // Moving card to a different list
      let cardToMove: Card | undefined;
      const newLists = lists.map(list => {
        if (list.id === sourceListId) {
          cardToMove = list.cards.find(c => c.id === cardId);
          return { ...list, cards: list.cards.filter(c => c.id !== cardId) };
        }
        return list;
      });

      if (cardToMove) {
        setLists(newLists.map(list => 
          list.id === targetListId 
          ? { ...list, cards: [...list.cards, cardToMove!] } 
          : list
        ));
      }
    }
    setDraggedItem(null);
  };

  const handleDropOnBoard = (e: DragEvent<HTMLDivElement>) => { // For reordering lists
    e.preventDefault();
    if (!draggedItem || draggedItem.type !== 'list') return;

    const draggedListId = draggedItem.id;
    const targetElement = e.target as HTMLElement;
    const targetListCard = targetElement.closest('[data-list-id]');
    const targetListId = targetListCard?.getAttribute('data-list-id');
    
    const currentLists = [...lists];
    const draggedListIndex = currentLists.findIndex(l => l.id === draggedListId);
    if (draggedListIndex === -1) return;

    const [draggedList] = currentLists.splice(draggedListIndex, 1);

    if (targetListId) {
      const targetListIndex = currentLists.findIndex(l => l.id === targetListId);
      if (targetListIndex !== -1) {
         // Determine if dropping before or after based on mouse position (e.clientX) relative to targetListCard midpoint
        const rect = targetListCard!.getBoundingClientRect();
        const isAfter = e.clientX > rect.left + rect.width / 2;
        currentLists.splice(isAfter ? targetListIndex + 1 : targetListIndex, 0, draggedList);
      } else {
         currentLists.push(draggedList); // Fallback: add to end if target not found properly
      }
    } else {
      // If not dropped on a specific list, assume end or closest valid drop zone
      // This simple version adds to the end if not dropped on another list.
      // More sophisticated logic would involve placeholder elements or positional calculations.
      currentLists.push(draggedList);
    }
    
    setLists(currentLists);
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };


  return (
    <div className="h-screen flex flex-col">
      <header className="p-4 border-b">
        <h1 className="text-2xl font-bold text-primary">TaskFlow Board</h1>
      </header>
      <ScrollArea className="flex-grow p-4">
        <div 
          className="flex space-x-4 h-full items-start"
          onDrop={handleDropOnBoard}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {lists.map(list => (
            <div key={list.id} data-list-id={list.id}> {/* Wrapper for list drop target detection */}
              <TaskList
                list={list}
                onAddCard={addCardToList}
                onEditCard={openEditCardModal}
                onDeleteCard={(cardId) => confirmDeleteCard(list.id, cardId)}
                onDeleteList={() => confirmDeleteList(list.id)}
                onDragStartCard={(e, cardId, sourceListId) => handleDragStart(e, 'card', cardId, sourceListId)}
                onDropOnList={handleDropOnList}
                onDragOverList={handleDragOver}
                onDragStartList={(e, listId) => handleDragStart(e, 'list', listId)}
              />
            </div>
          ))}
          <CreateListForm onAddList={addList} />
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {showEditModal && editingCard && (
        <EditCardModal
          isOpen={showEditModal}
          onOpenChange={setShowEditModal}
          card={editingCard.card}
          onSave={saveCardChanges}
        />
      )}
      {showDeleteConfirm && deleteTarget && (
        <DeleteConfirmationDialog
          isOpen={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          onConfirm={deleteTarget.type === 'list' ? deleteList : deleteCard}
          title={`Delete ${deleteTarget.type}`}
          description={`Are you sure you want to delete "${deleteTarget.title}"? This action cannot be undone.`}
        />
      )}
    </div>
  );
}
