import { ArrayMinSize, IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";
import { MealType } from "../enums/types.enum";
import { Type } from "class-transformer";
import { FoodDto } from "./food.dto";

export class MealDto {

    @IsEnum(MealType)
    type: MealType;
  
    @IsString()
    @IsNotEmpty()
    name: string;
  
    @IsString()
    @IsOptional()
    description?: string;
  
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => FoodDto)
    foods: FoodDto[];
  
}