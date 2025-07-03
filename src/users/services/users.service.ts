import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { ICreateUser, IUpdateUser } from '../interfaces/user.interface';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  findUsers() {
    return this.userRepository.find();
  }

  findUserById(id: number) {
    return this.userRepository.findOne({ where: { id } });
  }

  createUser(userDetail: ICreateUser) {
    const newUser = this.userRepository.create({
      ...userDetail,
      createdAt: new Date(),
    });
    return this.userRepository.save(newUser);
  }

  updateUser(id: number, updateUserDto: IUpdateUser) {
    return this.userRepository.update({ id }, { ...updateUserDto });
  }

  deleteUser(id: number) {
    return this.userRepository.delete({ id });
  }
}
