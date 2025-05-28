
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
        if (Array.isArray(parsedData) && parsedData.length > 0 && parsedData.every(l => l.id && l.title && Array.isArray(l.cards))) {
           setLists(parsedData);
        } else {
          setLists(initialData); 
        }
      } catch (error) {
        console.error("Failed to parse task board data from localStorage", error);
        setLists(initialData);
        localStorage.removeItem('taskBoardData');
      }
    } else {
      setLists(initialData);
    }
  }, []);

  useEffect(() => {
    if(lists.length > 0 || localStorage.getItem('taskBoardData')) { 
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
    e.dataTransfer.setData('text/plain', id); 
    setDraggedItem({ type, id, sourceListId });
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropOnList = (e: DragEvent<HTMLDivElement>, targetListId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.type !== 'card' || !draggedItem.sourceListId) {
      setDraggedItem(null);
      return;
    }

    const cardIdToMove = draggedItem.id;
    const sourceListId = draggedItem.sourceListId;

    const sourceList = lists.find(l => l.id === sourceListId);
    const cardToMove = sourceList?.cards.find(c => c.id === cardIdToMove);

    if (!cardToMove) {
      setDraggedItem(null);
      return;
    }

    setLists(currentLists => {
      // 1. Remove card from source list
      let listsAfterRemoval = currentLists.map(list => {
        if (list.id === sourceListId) {
          return { ...list, cards: list.cards.filter(c => c.id !== cardIdToMove) };
        }
        return list;
      });

      // 2. Add card to target list in the correct position
      listsAfterRemoval = listsAfterRemoval.map(list => {
        if (list.id === targetListId) {
          let newCards = [...list.cards]; // Cards of the target list (already without the card if source === target)
          
          const targetElement = e.target as HTMLElement;
          const closestCardElement = targetElement.closest('[data-card-id]') as HTMLElement | null;

          if (closestCardElement && closestCardElement.dataset.cardId !== cardIdToMove) {
            const overCardId = closestCardElement.dataset.cardId;
            const overCardIndex = newCards.findIndex(c => c.id === overCardId);

            if (overCardIndex !== -1) {
              const rect = closestCardElement.getBoundingClientRect();
              const isAfter = e.clientY > rect.top + rect.height / 2;
              newCards.splice(overCardIndex + (isAfter ? 1 : 0), 0, cardToMove);
            } else {
              newCards.push(cardToMove); // Fallback if overCardId not in newCards
            }
          } else {
            // Dropped on the list area, not a specific card, or on itself (rare)
            let inserted = false;
            const listContentElement = targetElement.closest('.task-list-content');
            if (listContentElement) {
                const cardElements = Array.from(listContentElement.querySelectorAll<HTMLElement>('[data-card-id]'));
                for (let i = 0; i < cardElements.length; i++) {
                    const cardElem = cardElements[i];
                    if (cardElem.dataset.cardId === cardIdToMove) continue; 

                    const rect = cardElem.getBoundingClientRect();
                    if (e.clientY < rect.top + rect.height / 2) { 
                        const dropTargetCardId = cardElem.dataset.cardId;
                        const dropIndex = newCards.findIndex(c => c.id === dropTargetCardId);
                        if (dropIndex !== -1) {
                            newCards.splice(dropIndex, 0, cardToMove);
                            inserted = true;
                            break;
                        }
                    }
                }
            }
            if (!inserted) {
              newCards.push(cardToMove); 
            }
          }
          return { ...list, cards: newCards };
        }
        return list;
      });
      return listsAfterRemoval;
    });
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
      const targetListElement = targetElement.closest('[data-list-id]') as HTMLElement | null;
      
      if (targetListElement && targetListElement.dataset.listId !== draggedListId) {
        const targetListId = targetListElement.dataset.listId;
        const targetListIndexInNew = newListsOrder.findIndex(l => l.id === targetListId);

        if (targetListIndexInNew !== -1) {
          const rect = targetListElement.getBoundingClientRect();
          const isAfter = e.clientX > rect.left + rect.width / 2;
          newListsOrder.splice(targetListIndexInNew + (isAfter ? 1 : 0), 0, draggedListObject);
        } else {
          newListsOrder.push(draggedListObject); 
        }
      } else {
        // Dropped on board background or on itself
        let inserted = false;
        const boardContentElement = e.currentTarget; // The board div itself
        const listElements = Array.from(boardContentElement.querySelectorAll<HTMLElement>('[data-list-id]'));

        for(let i = 0; i < listElements.length; i++) {
            const listElem = listElements[i];
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
        if (!inserted) {
             newListsOrder.push(draggedListObject);
        }
      }
      return newListsOrder;
    });
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };


  return (
    <div className="h-screen flex flex-col bg-muted/40">
      <header className="p-4 border-b bg-background shadow-sm">
        <h1 className="text-2xl font-bold text-primary">TaskFlow Board</h1>
      </header>
      <ScrollArea className="flex-grow">
        <div 
          className="flex space-x-4 h-full items-start p-4"
          onDrop={handleDropOnBoard}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd} // Added to main board for safety, though list/card drag ends should handle it
        >
          {lists.map(list => (
            <div key={list.id} data-list-id={list.id} className="h-full"> {/* Wrapper for list drop target detection and full height */}
              <TaskList
                list={list}
                onAddCard={addCardToList}
                onEditCard={openEditCardModal}
                onDeleteCard={(cardId) => confirmDeleteCard(list.id, cardId)}
                onDeleteList={() => confirmDeleteList(list.id)}
                onDragStartCard={(e, cardId) => handleDragStart(e, 'card', cardId, list.id)} // sourceListId is list.id here
                onDropOnList={handleDropOnList}
                onDragOverList={handleDragOver}
                onDragStartList={(e, listId) => handleDragStart(e, 'list', listId)}
                onDragEndList={handleDragEnd} // Propagate drag end from list
              />
            </div>
          ))}
          <div className="pt-[1px]"> {/* Align with top of TaskList Card */}
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
          onConfirm={deleteTarget.type === 'list' ? deleteList : deleteCard}
          title={`Delete ${deleteTarget.type}`}
          description={`Are you sure you want to delete "${deleteTarget.title}"? This action cannot be undone.`}
        />
      )}
    </div>
  );
}

    