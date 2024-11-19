import { ArrayMinSize, IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";
import { Category } from "../enums/types.enum";
import { Type } from "class-transformer";
import { WeeklyMealDto } from "./weekly-meals.dto";

export class CreateNutritionDto {

    @IsString()
    @IsNotEmpty()
    name: string;
  
    @IsString()
    @IsNotEmpty()
    description: string;
  
    @IsString()
    @IsOptional()
    imageURL?: string;
  
    @IsInt()
    @IsNotEmpty()
    duration: number;
  
    @IsEnum(Category)
    category: Category;
  
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => WeeklyMealDto)
    weeklyMeals: WeeklyMealDto[];

    @IsBoolean()
    @IsOptional()
    isDeleted?: boolean;
}
