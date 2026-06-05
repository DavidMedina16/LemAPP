import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createInvoiceDto: CreateInvoiceDto) {
    // Número de factura consecutivo por empresa: FAC-{companyId}-{NNNN}.
    const seq =
      (await this.prisma.invoice.count({
        where: { companyId: createInvoiceDto.companyId },
      })) + 1;
    const invoiceNumber = `FAC-${createInvoiceDto.companyId}-${String(seq).padStart(4, '0')}`;

    return this.prisma.invoice.create({
      data: { ...createInvoiceDto, invoiceNumber, shareToken: randomUUID() },
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
    return this.prisma.invoice.findUnique({
      where: { shareToken },
      include: { company: true },
    });
  }

  async update(id: number, updateInvoiceDto: UpdateInvoiceDto) {
    await this.findOne(id);
    return this.prisma.invoice.update({
      where: { id },
      data: updateInvoiceDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.invoice.delete({ where: { id } });
  }
}
