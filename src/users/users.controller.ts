  import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
  } from '@nestjs/common';
  import { Roles } from 'src/auth/decorator/roles.decorator';
  import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
  import { RolesGuard } from 'src/auth/guard/roles.guard';
  import { UserService } from './users.service';
  import { CreateUserDto } from './users-dto/create-user.dto';
  import { ListUsersDto } from './users-dto/list-users.dto';
  import { UpdateRoleDto } from './users-dto/update-role.dto';
  import { UpdateStatusDto } from './users-dto/update-status.dto';

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Controller('users')
  export class UserController {
    constructor(private readonly service: UserService) {}

    @Post()
    create(@Body() createUserDto: CreateUserDto) {
      return this.service.createByAdmin(createUserDto);
    }
    @Get()
    list(@Query() query: ListUsersDto) {
      return this.service.list(query);
    }
    @Get()
    findAll() {
      return this.service.findAll();
    }
    @Patch(':id/role')
    updateRole(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
      return this.service.updateRole(updateRoleDto, id);
    }
    @Patch(':id/status')
    updateStatus(
      @Param('id') id: string,
      @Body() updateStatusDto: UpdateStatusDto,
    ) {
      return this.service.updateStatus(id, updateStatusDto);
    }
    @Delete(':id')
    remove(@Param('id') id: string, @Req() req: any) {
      return this.service.remove(id, req.user.sub);
    }
    @Get('id')
    getUser(@Param('id') id: string){
      return this.service.getUser(id)
    }
  }
