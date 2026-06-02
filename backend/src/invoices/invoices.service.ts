import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  create(createInvoiceDto: CreateInvoiceDto) {
    return this.prisma.invoice.create({
      data: { ...createInvoiceDto, shareToken: randomUUID() },
    });
  }

  findAll() {
    return this.prisma.invoice.findMany();
  }

  async findOne(id: number) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException(`Invoice #${id} not found`);
    return invoice;
  }

  findByShareToken(shareToken: string) {
    return this.prisma.invoice.findUnique({ where: { shareToken } });
  }

  async update(id: number, updateInvoiceDto: UpdateInvoiceDto) {
    await this.findOne(id);
    return this.prisma.invoice.update({ where: { id }, data: updateInvoiceDto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.invoice.delete({ where: { id } });
  }
}
