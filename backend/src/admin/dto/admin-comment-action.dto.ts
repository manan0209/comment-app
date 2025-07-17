import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum AdminAction {
  SOFT_DELETE = 'soft_delete',
  HARD_DELETE = 'hard_delete',
  RESTORE = 'restore',
  UPDATE_CONTENT = 'update_content',
}

export class AdminCommentActionDto {
  @IsEnum(AdminAction)
  action: AdminAction;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  newContent?: string;
}

export class BulkAdminActionDto {
  @IsString({ each: true })
  commentIds: string[];

  @IsEnum(AdminAction)
  action: AdminAction;

  @IsOptional()
  @IsString()
  reason?: string;
}
