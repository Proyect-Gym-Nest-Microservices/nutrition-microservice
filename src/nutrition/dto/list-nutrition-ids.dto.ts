import { ValidatorConstraint, ValidatorConstraintInterface, IsArray, ArrayMinSize } from 'class-validator';
import { registerDecorator, ValidationOptions } from 'class-validator';

// Constraint personalizada
@ValidatorConstraint({ name: 'IsMongoId', async: false })
export class IsMongoIdConstraint implements ValidatorConstraintInterface {
    validate(id: string): boolean {
        return /^[a-fA-F0-9]{24}$/.test(id);
    }

    defaultMessage(): string {
        return 'Each ID must be a valid MongoDB ObjectId.';
    }
}

// Decorador personalizado para facilitar el uso
export function IsMongoId(validationOptions?: ValidationOptions) {
    return function (object: any, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: IsMongoIdConstraint,
        });
    };
}

// DTO usando el nuevo decorador
export class ListNutritionIdsDto {
    @IsArray()
    @ArrayMinSize(1)
    @IsMongoId({ each: true })
    ids: string[];
}