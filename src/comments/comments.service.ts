import { Injectable, NotFoundException } from '@nestjs/common';
import { CommonService } from '@src/common/common.service';
import { PostsService } from '@src/posts/posts.service';
import { UsersService } from '@src/users/users.service';
import type { CreateCommentDto } from './dto/create-comment.dto';
import type { Comment } from './interfaces/comment.interface';

@Injectable()
export class CommentsService {
  private nextId = 1;
  private comments: Comment[] = [];

  // CommonService, UsersService, PostsService를 모두 주입받는다
  constructor(
    private readonly commonService: CommonService,
    private readonly usersService: UsersService,
    private readonly postsService: PostsService
  ) {}

  // 댓글 작성
  create(postId: number, dto: CreateCommentDto): Comment {
    // 게시글이 존재하는지 확인 (없으면 NotFoundException 발생)
    this.postsService.findOne(postId);
    // 작성자가 존재하는지 확인 (없으면 NotFoundException 발생)
    this.usersService.findOne(dto.authorId);

    const comment: Comment = {
      id: this.nextId++,
      content: dto.content,
      authorId: dto.authorId,
      postId,
      createdAt: this.commonService.formatDate(new Date()),
    };
    this.comments.push(comment);
    return comment;
  }

  // 특정 게시글의 댓글 목록 조회
  findByPostId(postId: number): Comment[] {
    // 게시글이 존재하는지 확인 (없으면 NotFoundException 발생)
    this.postsService.findOne(postId);
    return this.comments.filter((c) => c.postId === postId);
  }

  // 댓글 삭제
  remove(id: number): void {
    const comment = this.comments.find((c) => c.id === id);
    if (!comment) {
      throw new NotFoundException(`댓글을 찾을 수 없습니다 (ID: ${id})`);
    }
    this.comments = this.comments.filter((c) => c.id !== id);
  }
}
