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
} from '@nestjs/common';
import { UsersService } from './users.service';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update.user.dto';
import type { User } from './interfaces/user.interface';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * POST /users
   * 회원가입
   */
  @Post()
  create(@Body() dto: CreateUserDto): User {
    return this.usersService.create(dto);
  }

  /**
   * GET /users
   * 전체 사용자 조회
   */
  @Get()
  findAll(): User[] {
    return this.usersService.findAll();
  }

  /**
   * GET /users/:id
   * 프로필 조회
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): User {
    return this.usersService.findOne(id);
  }

  /**
   * Patch /users/:id
   * 사용자 정보 수정
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto
  ): User {
    return this.usersService.update(id, dto);
  }

  /**
   * DELETE /users/:id
   * 사용자 삭제
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): void {
    this.usersService.remove(id);
  }
}
