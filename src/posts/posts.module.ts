import { Module } from '@nestjs/common';
import { CommonModule } from '@src/common/common.module';
import { UsersModule } from '@src/users/users.module';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  imports: [CommonModule, UsersModule],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
