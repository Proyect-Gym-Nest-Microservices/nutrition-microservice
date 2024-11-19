import { Module } from '@nestjs/common';
import { NutritionModule } from './nutrition/nutrition.module';

@Module({
  imports: [NutritionModule],
})
export class AppModule {}
