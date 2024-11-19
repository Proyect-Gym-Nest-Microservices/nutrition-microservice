import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateNutritionDto } from './dto/create-nutrition.dto';
import { UpdateNutritionDto } from './dto/update-nutrition.dto';

@Injectable()
export class NutritionService{
  //extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger('Nutrition-Service');

  //async onModuleInit() {
  //  await this.$connect();
  //  this.logger.log('DataBase connected');
  //}

  create(createNutritionDto: CreateNutritionDto) {
    return 'This action adds a new nutrition';
  }

  findAll() {
    return `This action returns all nutrition`;
  }

  findOne(id: number) {
    return `This action returns a #${id} nutrition`;
  }

  update(id: number, updateNutritionDto: UpdateNutritionDto) {
    return `This action updates a #${id} nutrition`;
  }

  remove(id: number) {
    return `This action removes a #${id} nutrition`;
  }
}