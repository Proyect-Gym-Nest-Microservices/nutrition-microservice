import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { NutritionService } from './nutrition.service';
import { CreateNutritionDto } from './dto/create-nutrition.dto';
import { UpdateNutritionDto } from './dto/update-nutrition.dto';

@Controller()
export class NutritionController {
  constructor(private readonly nutritionService: NutritionService) {}

  @MessagePattern('createNutrition')
  create(@Payload() createNutritionDto: CreateNutritionDto) {
    return this.nutritionService.create(createNutritionDto);
  }

  @MessagePattern('findAllNutrition')
  findAll() {
    return this.nutritionService.findAll();
  }

  @MessagePattern('findOneNutrition')
  findOne(@Payload() id: number) {
    return this.nutritionService.findOne(id);
  }

  @MessagePattern('updateNutrition')
  update(@Payload() updateNutritionDto: UpdateNutritionDto) {
    return this.nutritionService.update(updateNutritionDto.id, updateNutritionDto);
  }

  @MessagePattern('removeNutrition')
  remove(@Payload() id: number) {
    return this.nutritionService.remove(id);
  }
}
