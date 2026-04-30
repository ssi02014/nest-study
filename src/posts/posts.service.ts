import { Injectable, NotFoundException } from '@nestjs/common';
import { CommonService } from '@src/common/common.service';
import { UsersService } from '@src/users/users.service';
import type { Post } from './interfaces/post.interface';
import type { CreatePostDto } from './dto/create-post.dto';
import type { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  private nextId = 1;
  private posts: Post[] = [];

  constructor(
    private readonly commonService: CommonService,
    private readonly usersService: UsersService
  ) {}

  // 게시글 작성
  create(dto: CreatePostDto): Post {
    // 작성자가 존재하는지 확인 (없으면 NotFoundException 발생)
    this.usersService.findOne(dto.authorId);

    const now = this.commonService.formatDate(new Date());
    const post: Post = {
      id: this.nextId++,
      ...dto,
      createdAt: now,
      updatedAt: now,
    };
    this.posts.push(post);
    return post;
  }

  // 게시글 목록 조회
  findAll(page?: string, limit?: string, search?: string) {
    let result = this.posts;

    if (search) {
      result = result.filter((post) => post.title.includes(search));
    }

    const pageNum = parseInt(page ?? '1');
    const limitNum = parseInt(limit ?? '10');
    const start = (pageNum - 1) * limitNum;
    const end = start + limitNum;

    return {
      data: result.slice(start, end),
      total: result.length,
      page: pageNum,
      limit: limitNum,
    };
  }

  // 게시글 상세 조회
  findOne(id: number): Post {
    const post = this.posts.find((p) => p.id === id);
    if (!post) {
      throw new NotFoundException(`게시글을 찾을 수 없습니다 (ID: ${id})`);
    }
    return post;
  }

  // 게시글 수정
  update(id: number, dto: UpdatePostDto): Post {
    const post = this.findOne(id);
    const updated: Post = {
      ...post,
      ...dto,
      updatedAt: this.commonService.formatDate(new Date()),
    };
    this.posts = this.posts.map((p) => (p.id === id ? updated : p));
    return updated;
  }

  // 게시글 삭제
  remove(id: number): void {
    this.findOne(id);
    this.posts = this.posts.filter((p) => p.id !== id);
  }
}
