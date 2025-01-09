import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateNutritionDto } from './dto/create-nutrition.dto';
import { UpdateNutritionDto } from './dto/update-nutrition.dto';
import { PrismaClient } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';
import { PaginationDto } from 'src/common';

@Injectable()
export class NutritionService extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger('Nutrition-Service');

  async onModuleInit() {
    await this.$connect();
    this.logger.log('DataBase connected');
  }
  private async validateNutritionPlanName(name: string): Promise<void> {
    const existingPlan = await this.nutritionPlan.findFirst({
      where: { name: { equals: name, mode: 'insensitive' }, isDeleted: false }
    });

    if (existingPlan) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Nutrition plan name already exists'
      });
    }
  }

  async createNutritionPlan(createNutritionDto: CreateNutritionDto) {
    try {
      await this.validateNutritionPlanName(createNutritionDto.name);

      const newNutritionPlan = await this.nutritionPlan.create({
        data: {
          name: createNutritionDto.name,
          description: createNutritionDto.description,
          imageURL: createNutritionDto.imageURL,
          duration: createNutritionDto.duration,
          category: createNutritionDto.category,
          weeklyMeals: {
            create: createNutritionDto.weeklyMeals.map(weeklyMeal => ({
              dayOfWeek: weeklyMeal.dayOfWeek,
              meals: {
                create: weeklyMeal.meals.map(meal => ({
                  type: meal.type,
                  name: meal.name,
                  description: meal.description,
                  imageUrl: meal.imageUrl,
                  foods: {
                    create: meal.foods.map(food => ({
                      name: food.name,
                      description: food.description,
                      calories: food.calories,
                      proteins: food.proteins,
                      carbs: food.carbs,
                      fats: food.fats,
                    }))
                  }
                }))
              }
            }))
          }
        },
        include: {
          weeklyMeals: {
            include: {
              meals: {
                include: {
                  foods: true
                }
              }
            }
          }
        }
      });

      const { createdAt, updatedAt, isDeleted, ...nutritionPlanData } = newNutritionPlan;
      return { ...nutritionPlanData };

    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error'
      });
    }
  }


  async findAllNutritionPlans(paginationDto: PaginationDto) {
    try {
      const { limit, page } = paginationDto;
      const totalPlans = await this.nutritionPlan.count({
        where: { isDeleted: false }
      });
      const lastPage = Math.ceil(totalPlans / limit);

      const plans = await this.nutritionPlan.findMany({
        where: { isDeleted: false },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          weeklyMeals: {
            include: {
              meals: {
                include: {
                  foods: true
                }
              }
            }
          }
        }
      });

      return {
        data: plans,
        meta: {
          totalPlans,
          page,
          lastPage
        }
      };

    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error'
      });
    }
  }

  async findNutritionPlanById(id: string) {
    try {
      const plan = await this.nutritionPlan.findUnique({
        where: { id, isDeleted: false },
        include: {
          weeklyMeals: {
            include: {
              meals: {
                include: {
                  foods: true
                }
              }
            }
          }
        }
      });

      if (!plan) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: 'Nutrition plan not found'
        });
      }

      return plan;

    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error'
      });
    }
  }




  async updateNutritionPlan(id: string, updateNutritionDto: UpdateNutritionDto) {
    try {
      const existingPlan = await this.findNutritionPlanById(id);

      if (updateNutritionDto.name !== existingPlan.name) {
        await this.validateNutritionPlanName(updateNutritionDto.name);
      }

      await this.nutritionPlan.update({
        where: { id },
        data: {
          name: updateNutritionDto.name,
          description: updateNutritionDto.description,
          imageURL: updateNutritionDto.imageURL,
          duration: updateNutritionDto.duration,
          category: updateNutritionDto.category,
          
          weeklyMeals: {
            deleteMany: {},
            create: updateNutritionDto.weeklyMeals.map(weeklyMeal => ({
              dayOfWeek: weeklyMeal.dayOfWeek,
              meals: {
                create: weeklyMeal.meals.map(meal => ({
                  type: meal.type,
                  name: meal.name,
                  description: meal.description,
                  imageUrl:meal.imageUrl,
                  foods: {
                    create: meal.foods.map(food => ({
                      name: food.name,
                      description: food.description,
                      calories: food.calories,
                      proteins: food.proteins,
                      carbs: food.carbs,
                      fats: food.fats,
                    }))
                  }
                }))
              }
            }))
          }
        }
      });

      return this.findNutritionPlanById(id);

    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error'
      });
    }
  }

  async removeNutritionPlan(id: string) {
    try {
      const plan = await this.findNutritionPlanById(id);
      
      const deletedPlan = await this.nutritionPlan.update({
        where: { id },
        data: {
          isDeleted: true,
          updatedAt: new Date(),
          name: `${plan.name}_deleted_${plan.id}`
        }
      });
      
      return {
        id: deletedPlan.id,
        message: 'Nutrition plan deleted successfully'
      };

    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error'
      });
    }
  }

  async findNutritionPlanByIds(ids: string[]) {
    try {
      const nutritionPlans = await this.nutritionPlan.findMany({
        where: {
          id: { in: ids },
          isDeleted: false,
        },
        include: {
          weeklyMeals: {
            include: {
              meals: {
                include: {
                  foods: true,
                },
              },
            },
          },
        },
      });
  
      if (!nutritionPlans ||nutritionPlans.length === 0) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: `Nutrition plan not found for IDs: ${ids.join(', ')}`,
        });
      }
  
      const foundIds = nutritionPlans.map(plan => plan.id);
      const missingIds = ids.filter(id => !foundIds.includes(id));
  
      if (missingIds.length > 0) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: `Nutrition plans not found for IDs: ${missingIds.join(', ')}`,
        });
      }
      // Retornar un objeto con la información completa
      return  nutritionPlans.map(({ createdAt, updatedAt,isDeleted, ...data }) => data)
  
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }


}
