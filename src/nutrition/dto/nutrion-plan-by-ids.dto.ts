import { IsMongoId } from 'class-validator';

export class NutritionPlanByIdsDto {
  @IsMongoId({ each: true })
  ids: string[];
}