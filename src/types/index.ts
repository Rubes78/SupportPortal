import { Role, ArticleStatus } from "@prisma/client";

export type { Role, ArticleStatus };

export interface UserDTO {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  createdAt: Date;
}

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  order: number;
  _count?: { articles: number };
  children?: CategoryDTO[];
}

export interface TagDTO {
  id: string;
  name: string;
  slug: string;
  _count?: { articles: number };
}

export interface ArticleListItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: ArticleStatus;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  author: { id: string; name: string | null; email: string };
  category: CategoryDTO | null;
  tags: { tag: TagDTO }[];
  _count?: { comments: number };
}

export interface ArticleDTO extends ArticleListItem {
  content: string;
}

export interface ArticleVersionDTO {
  id: string;
  articleId: string;
  title: string;
  content: string;
  excerpt: string | null;
  versionNumber: number;
  changeNote: string | null;
  createdAt: Date;
  author: { id: string; name: string | null; email: string };
}

export interface CommentDTO {
  id: string;
  content: string;
  articleId: string;
  authorId: string | null;
  authorName: string | null;
  authorEmail: string | null;
  parentId: string | null;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
  author: { id: string; name: string | null; email: string } | null;
  replies?: CommentDTO[];
}

export interface FeedbackDTO {
  helpful: number;
  notHelpful: number;
  userVoted: boolean | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface SearchResult {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  headline: string;
  publishedAt: Date | null;
  rank: number;
}
