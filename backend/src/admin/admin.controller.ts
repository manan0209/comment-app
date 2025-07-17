import { Body, Controller, ForbiddenException, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminService } from './admin.service';
import { AdminCommentActionDto, BulkAdminActionDto } from './dto/admin-comment-action.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  // Middleware to check admin access
  private async checkAdminAccess(userId: string) {
    const isAdmin = await this.adminService.isAdmin(userId);
    if (!isAdmin) {
      throw new ForbiddenException('Access denied. Admin privileges required.');
    }
  }

  @Get('comments')
  async getAllComments(
    @Request() req,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
    @Query('search') searchTerm?: string,
  ) {
    await this.checkAdminAccess(req.user.id);
    return this.adminService.getAllComments(page, limit, searchTerm);
  }

  @Get('comments/reported')
  async getReportedComments(@Request() req) {
    await this.checkAdminAccess(req.user.id);
    return this.adminService.getReportedComments();
  }

  @Post('comments/:id/action')
  async performCommentAction(
    @Request() req,
    @Param('id') commentId: string,
    @Body() actionDto: AdminCommentActionDto,
  ) {
    await this.checkAdminAccess(req.user.id);
    return this.adminService.performCommentAction(commentId, actionDto);
  }

  @Post('comments/bulk-action')
  async performBulkAction(
    @Request() req,
    @Body() bulkActionDto: BulkAdminActionDto,
  ) {
    await this.checkAdminAccess(req.user.id);
    return this.adminService.performBulkAction(bulkActionDto);
  }

  @Get('stats')
  async getUserStats(@Request() req) {
    await this.checkAdminAccess(req.user.id);
    return this.adminService.getUserStats();
  }

  @Get('search')
  async searchComments(
    @Request() req,
    @Query('term') searchTerm: string,
  ) {
    await this.checkAdminAccess(req.user.id);
    return this.adminService.searchCommentsByContent(searchTerm);
  }

  @Post('moderation/auto-moderate')
  async runAutoModeration(@Request() req) {
    await this.checkAdminAccess(req.user.id);
    return this.adminService.runAutoModeration();
  }
}
