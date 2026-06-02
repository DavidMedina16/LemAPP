import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { InvoiceStatus } from '../../../generated/prisma/enums.js';

export class CreateInvoiceDto {
  @IsString()
  @IsNotEmpty()
  invoiceNumber: string;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsNumber()
  subtotal: number;

  @IsOptional()
  @IsNumber()
  tax?: number;

  @IsNumber()
  total: number;

  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsDateString()
  paidAt?: string;

  // shareToken NO se recibe: lo genera el backend con crypto.randomUUID()

  @IsInt()
  companyId: number;
}
