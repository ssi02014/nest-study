export interface Post {
  id: number;
  title: string;
  content: string;
  authorId: number; // User.id 참조
  createdAt: string;
  updatedAt: string;
}
