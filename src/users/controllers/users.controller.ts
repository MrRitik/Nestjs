import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateUserDto } from '../dto/createUser.dto';
import { UsersService } from '../services/users.service';
import { UpdateUserDto } from '../dto/updateUser.dto';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}
  @Get()
  getUsers() {
    return this.usersService.findUsers();
  }

  @Post()
  createUser(@Body() createuserDto: CreateUserDto) {
    return this.usersService.createUser(createuserDto);
  }

  @Patch(':id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    await this.usersService.updateUser(id, updateUserDto);
    return {
      message: 'User updated successfully',
    };
  }

  @Delete(':id')
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    await this.usersService.deleteUser(id);
    return {
      message: 'User deleted successfully',
    };
  }
}
