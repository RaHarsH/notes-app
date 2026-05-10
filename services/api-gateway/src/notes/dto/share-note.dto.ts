import { IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ShareNoteDto {
  @ApiProperty({ description: 'User ID to share with' })
  @IsString()
  sharedWithUserId: string;

  @ApiProperty({ enum: ['EDITOR', 'VIEWER'] })
  @IsEnum(['EDITOR', 'VIEWER'])
  permission: 'EDITOR' | 'VIEWER';
}
