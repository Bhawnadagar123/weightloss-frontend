export interface Blog {
  id: string;
  title: string;
  slug?: string;
  summary?: string | null;
  content: string;
  author?: string;
  category?: string;
  tags?: string[];
  featured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}