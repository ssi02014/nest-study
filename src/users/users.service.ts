import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from './interfaces/user.interface';
import { CommonService } from '@src/common/common.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update.user.dto';

@Injectable()
export class UsersService {
  private nextId = 1;
  private users: User[] = [];

  constructor(private readonly commonService: CommonService) {}

  // 회원가입
  create(dto: CreateUserDto): User {
    const existing = this.users.find((u) => u.email === dto.email);
    if (existing) {
      throw new ConflictException(`이미 사용 중인 이메일입니다: ${dto.email}`);
    }

    const user: User = {
      id: this.nextId++,
      email: dto.email,
      name: dto.name,
      createdAt: this.commonService.formatDate(new Date()),
    };
    this.users.push(user);
    return user;
  }

  // 전체 사용자 조회
  findAll(): User[] {
    return this.users;
  }

  // ID로 사용자 조회
  findOne(id: number): User {
    const user = this.users.find((u) => u.id === id);

    if (!user) {
      throw new NotFoundException(`사용자를 찾을 수 없습니다 (ID: ${id})`);
    }
    return user;
  }

  // 사용자 정보 수정
  update(id: number, dto: UpdateUserDto): User {
    const user = this.findOne(id);

    if (dto.email) {
      const existing = this.users.find(
        (u) => u.email === dto.email && u.id !== id
      );

      if (existing) {
        throw new ConflictException(
          `이미 사용 중인 이메일입니다: ${dto.email}`
        );
      }
    }

    const updated = { ...user, ...dto };
    this.users = this.users.map((u) => (u.id === id ? updated : u));
    return updated;
  }

  // 사용자 삭제
  remove(id: number): void {
    this.findOne(id);
    this.users = this.users.filter((u) => u.id !== id);
  }
}
