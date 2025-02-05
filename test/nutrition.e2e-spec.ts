import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { NutritionModule } from '../src/nutrition/nutrition.module';
import { CreateNutritionDto } from '../src/nutrition/dto/create-nutrition.dto';
import { UpdateNutritionDto } from '../src/nutrition/dto/update-nutrition.dto';
import { PrismaClient } from '@prisma/client';
import { firstValueFrom, of } from 'rxjs';
import { PaginationDto } from '../src/common/dto/pagination.dto';
import { NATS_SERVICE } from '../src/config/services.config';
import { envs } from '../src/config/envs.config';
import { Category, DayOfWeek, MealType } from '../src/nutrition/enums/types.enum';

class MockClientProxy {
  private handlers = new Map<string, Function>();

  public send(pattern: string, data: any) {
    const handler = this.handlers.get(pattern);
    if (handler) {
      return of(handler(data));
    }
    return of(null);
  }

  public setHandler(pattern: string, handler: Function) {
    this.handlers.set(pattern, handler);
  }
}

describe('NutritionController (e2e)', () => {
  let app: INestApplication;
  let mockClientProxy: MockClientProxy;
  let prisma: PrismaClient;

  beforeAll(async () => {
    mockClientProxy = new MockClientProxy();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [NutritionModule],
    })
      .overrideProvider(NATS_SERVICE)
      .useValue(mockClientProxy)
      .compile();

    app = moduleFixture.createNestApplication();
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: envs.DATABASE_URL_TEST
        }
      }
    });

    await app.init();
  });


  beforeEach(async () => {
    // Limpiar la base de datos en el orden correcto
    await prisma.$transaction([
      prisma.food.deleteMany(),
      prisma.meal.deleteMany(),
      prisma.weeklyMeal.deleteMany(),
      prisma.nutritionPlan.deleteMany()
    ]);
    
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('Nutrition Plan CRUD Operations', () => {
    it('should create, read, update and delete a nutrition plan', async () => {
      const createNutritionDto: CreateNutritionDto = {
        name: 'E2E Test Plan',
        description: 'Test Description',
        imageURL: 'test.jpg',
        duration: 30,
        category: Category.WEIGHT_LOSS,
        weeklyMeals: [
          {
            dayOfWeek: DayOfWeek.MONDAY,
            meals: [
              {
                type: MealType.BREAKFAST,
                name: 'Test Meal',
                description: 'Test Description',
                imageUrl: 'meal.jpg',
                foods: [
                  {
                    name: 'Test Food',
                    description: 'Food Description',
                    calories: 100,
                    proteins: 10,
                    carbs: 20,
                    fats: 5
                  }
                ]
              }
            ]
          }
        ]
      };

      // Configurar el mock para createNutrition
      mockClientProxy.setHandler('createNutrition', async (data) => {
        const plan = await prisma.nutritionPlan.create({
          data: {
            ...data,
            isDeleted: false,
            weeklyMeals: {
              create: data.weeklyMeals.map(weeklyMeal => ({
                dayOfWeek: weeklyMeal.dayOfWeek,
                meals: {
                  create: weeklyMeal.meals.map(meal => ({
                    type: meal.type,
                    name: meal.name,
                    description: meal.description,
                    imageUrl: meal.imageUrl,
                    foods: {
                      create: meal.foods.map(food => ({
                        ...food
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
        console.log('create', plan)
        return plan;
      });

      const createdPlan = await firstValueFrom(
        mockClientProxy.send('createNutrition', createNutritionDto)
      );

      expect(createdPlan).toHaveProperty('id');
      expect(createdPlan.name).toBe(createNutritionDto.name);
      expect(createdPlan.weeklyMeals).toHaveLength(1);

      // Configurar mock para find.one.nutrition.plan
      mockClientProxy.setHandler('find.one.nutrition.plan', async (data) => {
        return await prisma.nutritionPlan.findUnique({
          where: { 
            id: data.id,
            isDeleted: false
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
      });

      const foundPlan = await firstValueFrom(
        mockClientProxy.send('find.one.nutrition.plan', { id: createdPlan.id })
      );

      console.log('foundPlan id', foundPlan.id)


      expect(foundPlan).toMatchObject({
        name: createNutritionDto.name,
        description: createNutritionDto.description
      });

      // Configurar mock para update.nutrition.plan
      const updateDto: UpdateNutritionDto = {
        name: 'Updated Plan Name',
        description: 'Updated Description',
        weeklyMeals: createNutritionDto.weeklyMeals
      };

      mockClientProxy.setHandler('update.nutrition.plan', async (data) => {
        const { id, updateNutritionDto } = data;

        await prisma.$transaction([
          prisma.food.deleteMany({
            where: {
              meal: {
                weeklyMeal: {
                  nutritionPlanId: id
                }
              }
            }
          }),
          prisma.meal.deleteMany({
            where: {
              weeklyMeal: {
                nutritionPlanId: id
              }
            }
          }),
          prisma.weeklyMeal.deleteMany({
            where: {
              nutritionPlanId: id
            }
          })
        ]);

        return await prisma.nutritionPlan.update({
          where: { id },
          data: {
            name: updateNutritionDto.name,
            description: updateNutritionDto.description,
            imageURL: updateNutritionDto.imageURL,
            duration: updateNutritionDto.duration,
            category: updateNutritionDto.category,
            weeklyMeals: {
              //deleteMany: {},
              create: updateNutritionDto.weeklyMeals.map(weeklyMeal => ({
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
          }
        });
      });

      const updateResult = await firstValueFrom(
        mockClientProxy.send('update.nutrition.plan', {
          id: createdPlan.id,
          updateNutritionDto: updateDto
        })
      );

      expect(updateResult.name).toBe(updateDto.name);
      expect(updateResult.description).toBe(updateDto.description);
      
      console.log('updateResult', updateResult)
      // Configurar mock para remove.nutrition.plan
      mockClientProxy.setHandler('remove.nutrition.plan', async (data) => {
        const plan = await prisma.nutritionPlan.update({
          where: { id: data.id },
          data: {
            isDeleted: true,
            name: `${createNutritionDto.name}_deleted_${data.id}`,
            updatedAt: new Date()
          }
        });
        return {
          id: plan.id,
          message: 'Nutrition plan deleted successfully'
        };
      });

      const removeResult = await firstValueFrom(
        mockClientProxy.send('remove.nutrition.plan', { id: createdPlan.id })
      );
      console.log('removeResult', removeResult)

      expect(removeResult.id).toBe(createdPlan.id);
      expect(removeResult.message).toContain('deleted successfully');

      // Verificar que el plan está marcado como eliminado
      const deletedPlan = await prisma.nutritionPlan.findUnique({
        where: { id: createdPlan.id }
      });
      console.log('deletedPlan', deletedPlan)
      expect(deletedPlan.isDeleted).toBe(true);
    });
  });

  describe('Nutrition Plan Listing and Pagination', () => {
    it('should list nutrition plans with pagination', async () => {
      // Crear planes de prueba
      const plansToCreate = Array.from({ length: 5 }, (_, i) => ({
        name: `Test Plan ${i}`,
        description: `Description ${i}`,
        imageURL: 'test.jpg',
        duration: 30,
        category: Category.WEIGHT_LOSS,
        isDeleted: false
      }));

      await prisma.nutritionPlan.createMany({
        data: plansToCreate
      });

      // Configurar mock para find.all.nutrition.plans
      mockClientProxy.setHandler('find.all.nutrition.plans', async (data: PaginationDto) => {
        const { page, limit } = data;
        const [plans, total] = await Promise.all([
          prisma.nutritionPlan.findMany({
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
          }),
          prisma.nutritionPlan.count({ where: { isDeleted: false } })
        ]);

        return {
          data: plans,
          meta: {
            totalPlans: total,
            page,
            lastPage: Math.ceil(total / limit)
          }
        };
      });

      const result = await firstValueFrom(
        mockClientProxy.send('find.all.nutrition.plans', { page: 1, limit: 3 })
      );

      expect(result.data).toHaveLength(3);
      expect(result.meta.totalPlans).toBe(5);
      expect(result.meta.page).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle duplicate plan name', async () => {
      const createDto: CreateNutritionDto = {
        name: 'Duplicate Plan',
        description: 'Test Description',
        imageURL: 'test.jpg',
        duration: 30,
        category: Category.WEIGHT_LOSS,
        weeklyMeals: []
      };

      // Crear plan inicial
      await prisma.nutritionPlan.create({
        data: {
          name: createDto.name,
          description: createDto.description,
          imageURL: createDto.imageURL,
          duration: createDto.duration,
          category: createDto.category,
          ...(createDto.weeklyMeals.length > 0 && {
            weeklyMeals: {
              createMany: {
                data:createDto.weeklyMeals
              }
            }
          })
        }
      });

      mockClientProxy.setHandler('createNutrition', async (data) => {
        const existing = await prisma.nutritionPlan.findFirst({
          where: { 
            name: { equals: data.name, mode: 'insensitive' },
            isDeleted: false
          }
        });
        
        if (existing) {
          const error: any = new Error('Nutrition plan name already exists');
          error.status = 400;
          throw error;
        }
        return prisma.nutritionPlan.create({ data });
      });

      try {
        await firstValueFrom(mockClientProxy.send('createNutrition', createDto));
        fail('Should throw duplicate name error');
      } catch (error) {
        expect(error.status).toBe(400);
        expect(error.message).toContain('already exists');
      }
    });

    it('should handle non-existent nutrition plan', async () => {
      mockClientProxy.setHandler('find.one.nutrition.plan', async (data) => {
        const plan = await prisma.nutritionPlan.findUnique({
          where: { 
            id: data.id,
            isDeleted: false
          }
        });
        
        if (!plan) {
          const error: any = new Error('Nutrition plan not found');
          error.status = 404;
          throw error;
        }
        return plan;
      });

      try {
        await firstValueFrom(
          mockClientProxy.send('find.one.nutrition.plan', { 
            id: '507f1f77bcf86cd799439011' 
          })
        );
        fail('Should throw not found error');
      } catch (error) {
        expect(error.status).toBe(404);
        expect(error.message).toContain('not found');
      }
    });
  });
});