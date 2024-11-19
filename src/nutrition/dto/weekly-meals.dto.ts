import { ArrayMinSize, IsArray, IsBoolean, IsEnum, IsOptional, ValidateNested } from "class-validator";
import { DayOfWeek } from "../enums/types.enum";
import { MealDto } from "./meal.dto";
import { Type } from "class-transformer";

export class WeeklyMealDto {


    @IsEnum(DayOfWeek)
    dayOfWeek: DayOfWeek;
  
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => MealDto)
    meals: MealDto[];
  
    @IsBoolean()
    @IsOptional()
    isDeleted?: boolean;
}
