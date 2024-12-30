import { IsNumber, IsOptional, Max, Min } from "class-validator";


export class RateDto {
    @IsNumber()
    @Min(0, { message: 'Score must be at least 0' })
    @Max(5, { message: 'Score cannot be greater than 5' })
    score: number;
}