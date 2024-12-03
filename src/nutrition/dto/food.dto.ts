import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class FoodDto {

    @IsString()
    @IsNotEmpty()
    name: string;
  
    @IsString()
    @IsNotEmpty()
    description: string;
  
    @IsInt()
    @IsOptional()
    calories?: number;
  
    @IsOptional()
    proteins?: number;
  
    @IsOptional()
    carbs?: number;
  
    @IsOptional()
    fats?: number;
  

  
}