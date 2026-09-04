
export interface Note {
  id: string;
  title: string;
  content: string | null;
  markdown_content: string | null;
  folder: string | null;
  notion_url: string | null;
  is_pinned?: boolean | null;
  created_at: string;
  updated_at: string;
  tags: Tag[];
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface NoteImage {
  id: string;
  note_id: string;
  image_url: string;
  image_name: string | null;
  image_size: number | null;
  created_at: string;
}
