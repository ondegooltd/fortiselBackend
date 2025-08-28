import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CylinderService } from './cylinder.service';
import { CreateCylinderDto } from './dto/create-cylinder.dto';
import { UpdateCylinderDto } from './dto/update-cylinder.dto';

@Controller('cylinders')
export class CylinderController {
  constructor(private readonly cylinderService: CylinderService) {}

  @Post()
  create(@Body() createCylinderDto: CreateCylinderDto) {
    return this.cylinderService.create(createCylinderDto);
  }

  @Get()
  findAll() {
    return this.cylinderService.findAll();
  }

  @Get('by-size/:size')
  findBySize(@Param('size') size: string) {
    return this.cylinderService.findBySize(size);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cylinderService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCylinderDto: UpdateCylinderDto) {
    return this.cylinderService.update(id, updateCylinderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cylinderService.remove(id);
  }
} 