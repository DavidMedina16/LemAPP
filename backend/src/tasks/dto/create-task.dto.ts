import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { PriorityLevel, TaskStatus } from '../../../generated/prisma/enums.js';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(PriorityLevel)
  priority?: PriorityLevel;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsInt()
  companyId: number;

  @IsInt()
  createdById: number;

  @IsOptional()
  @IsInt()
  assignedToId?: number;
}
