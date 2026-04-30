import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import type { CreatePostDto } from './dto/create-post.dto';
import type { UpdatePostDto } from './dto/update-post.dto';
import type { Post as BlogPost } from './interfaces/post.interface';
import type { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  /** POST /posts - 게시글 작성 */
  @Post()
  create(@Body() createPostDto: CreatePostDto): BlogPost {
    return this.postsService.create(createPostDto);
  }

  /** GET /posts - 게시글 목록 */
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string
  ) {
    return this.postsService.findAll(page, limit, search);
  }

  /** GET /posts/:id - 게시글 상세 */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): BlogPost {
    return this.postsService.findOne(id);
  }

  /** PATCH /posts/:id - 게시글 수정 */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostDto: UpdatePostDto
  ): BlogPost {
    return this.postsService.update(id, updatePostDto);
  }

  /** DELETE /posts/:id - 게시글 삭제 */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): void {
    this.postsService.remove(id);
  }
}
