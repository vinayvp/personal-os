export interface RevisionCategory {
  id: string;
  name: string;
  color: string;
  count: number;
  curr_element_id: string | null;
  created_at: string;
}

export interface RevisionElement {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  count: number;
  created_at: string;
}