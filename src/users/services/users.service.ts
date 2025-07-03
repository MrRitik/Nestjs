import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserType, UpdateUserType } from 'src/utils/types';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  findUsers() {
    return this.userRepository.find();
  }

  createUser(userDetail: CreateUserType) {
    const newUser = this.userRepository.create({
      ...userDetail,
      createdAt: new Date(),
    });
    return this.userRepository.save(newUser);
  }

  updateUser(id: number, updateUserDto: UpdateUserType) {
    return this.userRepository.update({ id }, { ...updateUserDto });
  }

  deleteUser(id: number) {
    return this.userRepository.delete({ id });
  }
}
