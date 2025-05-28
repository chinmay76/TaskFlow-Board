
export type Card = {
  id: string;
  title: string;
  description?: string;
  dueDate?: string; // YYYY-MM-DD format
};

export type List = {
  id: string;
  title: string;
  cards: Card[];
};
