import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const password = await bcrypt.hash(createUserDto.password, SALT_ROUNDS);
    return this.prisma.user.create({
      data: { ...createUserDto, password },
      omit: { password: true },
    });
  }

  findAll() {
    return this.prisma.user.findMany({ omit: { password: true } });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      omit: { password: true },
    });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }


  // Solo para autenticación: incluye el hash de password y el rol.
  findByEmailWithPassword(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.findOne(id);
    const data = { ...updateUserDto };
    if (updateUserDto.password) {
      data.password = await bcrypt.hash(updateUserDto.password, SALT_ROUNDS);
    }
    return this.prisma.user.update({
      where: { id },
      data,
      omit: { password: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.user.delete({
      where: { id },
      omit: { password: true },
    });
  }
}
