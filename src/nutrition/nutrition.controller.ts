import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { NutritionService } from './nutrition.service';
import { CreateNutritionDto } from './dto/create-nutrition.dto';
import { UpdateNutritionDto } from './dto/update-nutrition.dto';
import { PaginationDto } from 'src/common';

@Controller()
export class NutritionController {
  constructor(private readonly nutritionService: NutritionService) {}

  @MessagePattern('createNutrition')
  create(@Payload() createNutritionDto: CreateNutritionDto) {
    return this.nutritionService.createNutritionPlan(createNutritionDto);
  }
   

  @MessagePattern('find.all.nutrition.plans')
  findAllNutritionPlans(@Payload() paginationDto: PaginationDto) {
    return this.nutritionService.findAllNutritionPlans(paginationDto);
  }

  @MessagePattern('find.one.nutrition.plan')
  findNutritionPlanById(@Payload('id') id: string) {
    return this.nutritionService.findNutritionPlanById(id);
  }

  @MessagePattern('update.nutrition.plan')
  updateNutritionPlan(
    @Payload() payload: { id: string; updateNutritionDto: UpdateNutritionDto },
  ) {
    return this.nutritionService.updateNutritionPlan(
      payload.id,
      payload.updateNutritionDto,
    );
  }

  @MessagePattern('remove.nutrition.plan')
  removeNutritionPlan(@Payload('id') id: string) {
    return this.nutritionService.removeNutritionPlan(id);
  }
}
