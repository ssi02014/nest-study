import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentsService } from './comments.service';
import type { Comment } from './interfaces/comment.interface';

@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  /** POST /posts/:postId/comments - 댓글 작성 */
  @Post('posts/:postId/comments')
  create(
    @Param('postId', ParseIntPipe) postId: number,
    @Body() dto: CreateCommentDto
  ): Comment {
    return this.commentsService.create(postId, dto);
  }

  /** GET /posts/:postId/comments - 댓글 목록 */
  @Get('posts/:postId/comments')
  findByPostId(@Param('postId', ParseIntPipe) postId: number): Comment[] {
    return this.commentsService.findByPostId(postId);
  }

  /** DELETE /comments/:id - 댓글 삭제 */
  @Delete('comments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): void {
    this.commentsService.remove(id);
  }
}
