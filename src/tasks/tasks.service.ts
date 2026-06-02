import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  create(createTaskDto: CreateTaskDto) {
    return this.prisma.task.create({ data: createTaskDto });
  }

  findAll() {
    return this.prisma.task.findMany();
  }

  async findOne(id: number) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { comments: true },
    });
    if (!task) throw new NotFoundException(`Task #${id} not found`);
    return task;
  }

  async update(id: number, updateTaskDto: UpdateTaskDto) {
    await this.findOne(id);
    return this.prisma.task.update({ where: { id }, data: updateTaskDto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.task.delete({ where: { id } });
  }
}
