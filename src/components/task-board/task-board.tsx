
"use client";

import React, { useState, useEffect, DragEvent } from 'react';
import type { List, Card } from '@/lib/types';
import { TaskList } from './task-list';
import { CreateListForm } from './create-list-form';
import { EditCardModal } from './edit-card-modal';
import { DeleteConfirmationDialog } from './delete-confirmation-dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { RotateCcw } from 'lucide-react'; // For Reset button

const initialSeedData: List[] = [
  { id: 'list-seed-1', title: 'To Do', cards: [
    { id: 'card-seed-1', title: 'Grocery Shopping', description: 'Buy milk, eggs, bread.', dueDate: '2024-08-15' },
    { id: 'card-seed-2', title: 'Book Doctor Appointment', description: 'Annual check-up.' },
  ]},
  { id: 'list-seed-2', title: 'In Progress', cards: [
    { id: 'card-seed-3', title: 'Develop new website feature', description: 'Implement user authentication module.' },
  ]},
  { id: 'list-seed-3', title: 'Done', cards: [
    { id: 'card-seed-4', title: 'Pay monthly bills', description: 'Electricity, internet, and water.', dueDate: '2024-08-10' },
  ]}
];

// Function to get a fresh copy of initial data
const getInitialData = (): List[] => JSON.parse(JSON.stringify(initialSeedData));


export function TaskBoard() {
  const [lists, setLists] = useState<List[]>([]);
  const [editingCard, setEditingCard] = useState<{listId: string; card: Card} | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [deleteTarget, setDeleteTarget] = useState<{type: 'list' | 'card' | 'board'; listId?: string; cardId?: string; title: string} | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [draggedItem, setDraggedItem] = useState<{type: 'card' | 'list'; id: string; sourceListId?: string} | null>(null);

  useEffect(() => {
    const savedData = localStorage.getItem('taskBoardData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        if (Array.isArray(parsedData) && (parsedData.length === 0 || parsedData.every(l => l.id && l.title && Array.isArray(l.cards)))) {
           setLists(parsedData);
        } else {
          setLists(getInitialData()); 
        }
      } catch (error) {
        console.error("Failed to parse task board data from localStorage", error);
        setLists(getInitialData());
        localStorage.removeItem('taskBoardData');
      }
    } else {
      setLists(getInitialData());
    }
  }, []);

  useEffect(() => {
     // Save whenever lists change, unless it's during the initial empty load before hydration
     if (lists.length > 0 || localStorage.getItem('taskBoardData') !== null) {
        localStorage.setItem('taskBoardData', JSON.stringify(lists));
     }
  }, [lists]);

  const addList = (title: string) => {
    const newList: List = { id: crypto.randomUUID(), title, cards: [] };
    setLists(prevLists => [...prevLists, newList]);
  };

  const renameList = (listId: string, newTitle: string) => {
    setLists(prevLists => prevLists.map(list => 
      list.id === listId ? { ...list, title: newTitle } : list
    ));
  };

  const confirmDeleteList = (listId: string) => {
    const listToDelete = lists.find(l => l.id === listId);
    if (listToDelete) {
      setDeleteTarget({ type: 'list', listId, title: listToDelete.title });
      setShowDeleteConfirm(true);
    }
  };
  
  const addCardToList = (listId: string, cardTitle: string) => {
    const newCard: Card = { id: crypto.randomUUID(), title: cardTitle, description: '', dueDate: undefined };
    setLists(prevLists => prevLists.map(list => 
      list.id === listId ? { ...list, cards: [...list.cards, newCard] } : list
    ));
  };

  const openEditCardModal = (listId: string, card: Card) => {
    setEditingCard({ listId, card });
    setShowEditModal(true);
  };

  const saveCardChanges = (cardId: string, title: string, description?: string, dueDate?: string) => {
    if (!editingCard) return;
    setLists(prevLists => prevLists.map(list => 
      list.id === editingCard.listId 
      ? { ...list, cards: list.cards.map(c => c.id === cardId ? {...c, title, description, dueDate} : c) } 
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

  const requestResetBoard = () => {
    setDeleteTarget({ type: 'board', title: 'Entire Board' });
    setShowDeleteConfirm(true);
  };

  const executeDeleteOrReset = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'list' && deleteTarget.listId) {
      setLists(prevLists => prevLists.filter(list => list.id !== deleteTarget.listId));
    } else if (deleteTarget.type === 'card' && deleteTarget.cardId && deleteTarget.listId) {
      setLists(prevLists => prevLists.map(list => 
        list.id === deleteTarget.listId 
        ? { ...list, cards: list.cards.filter(c => c.id !== deleteTarget.cardId!) } 
        : list
      ));
    } else if (deleteTarget.type === 'board') {
      setLists(getInitialData()); 
      // localStorage will be updated by the useEffect watching 'lists'
    }
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };


  // Drag and Drop handlers
  const handleDragStart = (e: DragEvent<HTMLDivElement>, type: 'card' | 'list', id: string, sourceListId?: string) => {
    // To prevent dragging text or other elements, explicitly set data
    e.dataTransfer.setData('text/plain', id); // Required for Firefox
    e.dataTransfer.effectAllowed = "move";
    setDraggedItem({ type, id, sourceListId });
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropOnList = (e: DragEvent<HTMLDivElement>, targetListId: string) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent board drop from firing

    if (!draggedItem || draggedItem.type !== 'card' || !draggedItem.sourceListId) {
      setDraggedItem(null);
      return;
    }

    const cardIdToMove = draggedItem.id;
    const sourceListId = draggedItem.sourceListId;

    let cardToMove: Card | undefined;
    
    // Find and remove card from source list
    const listsAfterRemoval = lists.map(list => {
      if (list.id === sourceListId) {
        cardToMove = list.cards.find(c => c.id === cardIdToMove);
        return { ...list, cards: list.cards.filter(c => c.id !== cardIdToMove) };
      }
      return list;
    });

    if (!cardToMove) {
      setDraggedItem(null);
      return; // Card not found
    }

    // Add card to target list in the correct position
    const finalLists = listsAfterRemoval.map(list => {
      if (list.id === targetListId) {
        let newCards = [...list.cards];
        const targetElement = e.target as HTMLElement;
        const closestCardElement = targetElement.closest('[data-card-id]') as HTMLElement | null;

        if (closestCardElement && closestCardElement.dataset.cardId !== cardIdToMove) {
          const overCardId = closestCardElement.dataset.cardId;
          const overCardIndex = newCards.findIndex(c => c.id === overCardId);
          if (overCardIndex !== -1) {
            const rect = closestCardElement.getBoundingClientRect();
            const isAfter = e.clientY > rect.top + rect.height / 2;
            newCards.splice(overCardIndex + (isAfter ? 1 : 0), 0, cardToMove!);
          } else {
            newCards.push(cardToMove!); // Fallback: if overCardId somehow not in newCards
          }
        } else {
          // Dropped on list area (not specific card) or empty list
          // Attempt to find position based on Y coord if not empty
          const listContentElement = targetElement.closest('.task-list-content');
          let inserted = false;
          if (listContentElement && newCards.length > 0) {
              const cardElements = Array.from(listContentElement.querySelectorAll<HTMLElement>('[data-card-id]'));
              for (let i = 0; i < cardElements.length; i++) {
                  const cardElem = cardElements[i];
                  if (cardElem.dataset.cardId === cardIdToMove) continue; 
                  const rect = cardElem.getBoundingClientRect();
                  if (e.clientY < rect.top + rect.height / 2) { 
                      const dropTargetCardId = cardElem.dataset.cardId;
                      const dropIndex = newCards.findIndex(c => c.id === dropTargetCardId);
                      if (dropIndex !== -1) {
                          newCards.splice(dropIndex, 0, cardToMove!);
                          inserted = true;
                          break;
                      }
                  }
              }
          }
          if (!inserted) {
            newCards.push(cardToMove!); // Append if no specific position found or list was empty
          }
        }
        return { ...list, cards: newCards };
      }
      return list;
    });

    setLists(finalLists);
    setDraggedItem(null);
  };

  const handleDropOnBoard = (e: DragEvent<HTMLDivElement>) => { 
    e.preventDefault();
    if (!draggedItem || draggedItem.type !== 'list') {
      setDraggedItem(null);
      return;
    }

    const draggedListId = draggedItem.id;
    
    setLists(currentLists => {
      const draggedListIndex = currentLists.findIndex(l => l.id === draggedListId);
      if (draggedListIndex === -1) return currentLists;

      const [draggedListObject] = currentLists.splice(draggedListIndex, 1); 
      let newListsOrder = [...currentLists];

      const targetElement = e.target as HTMLElement;
      // Find the list we are dropping near, or the board itself
      const targetListElement = targetElement.closest('[data-list-id]') as HTMLElement | null;
      const boardContentElement = e.currentTarget; // The board div itself
      const listElements = Array.from(boardContentElement.querySelectorAll<HTMLElement>('[data-list-id]'));
      
      let inserted = false;
      if (targetListElement && targetListElement.dataset.listId !== draggedListId) {
        const targetListId = targetListElement.dataset.listId;
        const targetListIndexInNew = newListsOrder.findIndex(l => l.id === targetListId);

        if (targetListIndexInNew !== -1) {
          const rect = targetListElement.getBoundingClientRect();
          // If dragging from left, insert before if cursor is on left half.
          // If dragging from right, insert after if cursor is on right half.
          // This logic simplifies to: insert before if cursor left of midpoint, after if right.
          const isAfter = e.clientX > rect.left + rect.width / 2;
          newListsOrder.splice(targetListIndexInNew + (isAfter ? 1 : 0), 0, draggedListObject);
          inserted = true;
        }
      }
      
      if(!inserted) {
        // Dropped on board background or far from other lists
        // Find the correct insertion point based on X coordinate
        for(let i = 0; i < listElements.length; i++) {
            const listElem = listElements[i];
            // Skip if it's the element being dragged (though it's already removed from newListsOrder)
            if (listElem.dataset.listId === draggedListId) continue; 
            const rect = listElem.getBoundingClientRect();
            if (e.clientX < rect.left + rect.width / 2) { 
                const dropTargetListId = listElem.dataset.listId;
                const dropIndex = newListsOrder.findIndex(l => l.id === dropTargetListId);
                if (dropIndex !== -1) {
                    newListsOrder.splice(dropIndex, 0, draggedListObject);
                    inserted = true;
                    break;
                }
            }
        }
      }

      if (!inserted) {
         newListsOrder.push(draggedListObject); // Append if no specific position found
      }
      return newListsOrder;
    });
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };


  return (
    <div className="h-screen flex flex-col bg-background"> {/* Use background from theme */}
      <header className="p-4 border-b bg-card shadow-sm flex justify-between items-center"> {/* Use card for header bg */}
        <h1 className="text-2xl font-bold text-primary">TaskFlow Board</h1>
        <Button variant="outline" onClick={requestResetBoard} size="sm">
          <RotateCcw className="mr-2 h-4 w-4" /> Reset Board
        </Button>
      </header>
      <ScrollArea className="flex-grow bg-muted/40"> {/* Use muted/40 for board bg */}
        <div 
          className="flex space-x-4 h-full items-start p-4"
          onDrop={handleDropOnBoard}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {lists.map(list => (
            <div key={list.id} data-list-id={list.id} className="h-full">
              <TaskList
                list={list}
                onAddCard={addCardToList}
                onEditCard={openEditCardModal}
                onDeleteCard={(cardId) => confirmDeleteCard(list.id, cardId)}
                onDeleteList={() => confirmDeleteList(list.id)}
                onRenameList={renameList}
                onDragStartCard={(e, cardId) => handleDragStart(e, 'card', cardId, list.id)}
                onDropOnList={handleDropOnList}
                onDragOverList={handleDragOver}
                onDragStartList={(e, listId) => handleDragStart(e, 'list', listId)}
                onDragEndList={handleDragEnd}
              />
            </div>
          ))}
          <div className="pt-[1px]"> 
            <CreateListForm onAddList={addList} />
          </div>
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
          onConfirm={executeDeleteOrReset}
          title={`Confirm ${deleteTarget.type === 'board' ? 'Reset' : 'Deletion'}`}
          description={`Are you sure you want to ${deleteTarget.type === 'board' ? 'reset the entire board' : `delete "${deleteTarget.title}"`}? This action cannot be undone.`}
        />
      )}
    </div>
  );
}
