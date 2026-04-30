export interface Comment {
  id: number;
  content: string;
  authorId: number; // User.id 참조
  postId: number; // Post.id 참조
  createdAt: string;
}
