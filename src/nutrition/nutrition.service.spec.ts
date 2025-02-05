import { Test, TestingModule } from '@nestjs/testing';
import { NutritionService } from './nutrition.service';
import { CreateNutritionDto } from './dto/create-nutrition.dto';
import { UpdateNutritionDto } from './dto/update-nutrition.dto';
import { RpcException } from '@nestjs/microservices';
import { HttpStatus } from '@nestjs/common';
import { Category, DayOfWeek, MealType } from './enums/types.enum';

// Mocks
const prismaServiceMock = {
    nutritionPlan: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
    },
    $connect: jest.fn(),
    $transaction: jest.fn(callback => callback(prismaServiceMock))
};

describe('NutritionService', () => {
    let service: NutritionService;

    const mockNutritionPlan = {
        id: '123',
        name: 'Test Plan',
        description: 'Test Description',
        imageURL: 'test.jpg',
        duration: 30,
        category: 'WEIGHT_LOSS',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        weeklyMeals: [
            {
                id: '1',
                nutritionPlanId: '123',
                dayOfWeek: 'MONDAY',
                meals: [
                    {
                        id: '1',
                        weeklyMealId: '1',
                        type: 'BREAKFAST',
                        name: 'Test Meal',
                        description: 'Test Meal Description',
                        imageUrl: 'meal.jpg',
                        foods: [
                            {
                                id: '1',
                                mealId: '1',
                                name: 'Test Food',
                                description: 'Test Food Description',
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

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [NutritionService],
        }).compile();

        service = module.get<NutritionService>(NutritionService);
        Object.assign(service, prismaServiceMock);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Basic CRUD Operations', () => {
        describe('createNutritionPlan', () => {
            const createDto: CreateNutritionDto = {
                name: 'Test Plan',
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
                                description: 'Test Meal Description',
                                imageUrl: 'meal.jpg',
                                foods: [
                                    {
                                        name: 'Test Food',
                                        description: 'Test Food Description',
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

            it('should successfully create a nutrition plan', async () => {
                prismaServiceMock.nutritionPlan.findFirst.mockResolvedValue(null);
                prismaServiceMock.nutritionPlan.create.mockResolvedValue(mockNutritionPlan);

                const result = await service.createNutritionPlan(createDto);

                expect(prismaServiceMock.nutritionPlan.findFirst).toHaveBeenCalledWith({
                    where: {
                        name: { equals: createDto.name, mode: 'insensitive' },
                        isDeleted: false
                    }
                });

                expect(prismaServiceMock.nutritionPlan.create).toHaveBeenCalledWith({
                    data: expect.objectContaining({
                        name: createDto.name,
                        weeklyMeals: expect.objectContaining({
                            create: expect.arrayContaining([
                                expect.objectContaining({
                                    dayOfWeek: 'MONDAY'
                                })
                            ])
                        })
                    }),
                    include: expect.any(Object)
                });

                expect(result).toEqual(expect.objectContaining({
                    id: expect.any(String),
                    name: createDto.name,
                    weeklyMeals: expect.arrayContaining([
                        expect.objectContaining({
                            dayOfWeek: 'MONDAY'
                        })
                    ])
                }));
            });

            it('should throw RpcException when plan name already exists', async () => {
                prismaServiceMock.nutritionPlan.findFirst.mockResolvedValue(mockNutritionPlan);

                await expect(service.createNutritionPlan(createDto))
                    .rejects
                    .toThrow(new RpcException({
                        status: HttpStatus.BAD_REQUEST,
                        message: 'Nutrition plan name already exists'
                    }));
            });

            it('should handle internal server errors', async () => {
                prismaServiceMock.nutritionPlan.findFirst.mockRejectedValue(new Error('Database error'));

                await expect(service.createNutritionPlan(createDto))
                    .rejects
                    .toThrow(new RpcException({
                        status: HttpStatus.INTERNAL_SERVER_ERROR,
                        message: 'Internal server error'
                    }));
            });
        });

        describe('findAllNutritionPlans', () => {
            const paginationDto = { page: 1, limit: 10 };

            it('should return paginated nutrition plans', async () => {
                prismaServiceMock.nutritionPlan.count.mockResolvedValue(1);
                prismaServiceMock.nutritionPlan.findMany.mockResolvedValue([mockNutritionPlan]);

                const result = await service.findAllNutritionPlans(paginationDto);

                expect(prismaServiceMock.nutritionPlan.count).toHaveBeenCalledWith({
                    where: { isDeleted: false }
                });

                expect(prismaServiceMock.nutritionPlan.findMany).toHaveBeenCalledWith({
                    where: { isDeleted: false },
                    skip: 0,
                    take: 10,
                    include: expect.any(Object)
                });

                expect(result).toEqual({
                    data: expect.arrayContaining([
                        expect.objectContaining({
                            id: expect.any(String)
                        })
                    ]),
                    meta: {
                        totalPlans: 1,
                        page: 1,
                        lastPage: 1
                    }
                });
            });

            it('should handle empty results', async () => {
                prismaServiceMock.nutritionPlan.count.mockResolvedValue(0);
                prismaServiceMock.nutritionPlan.findMany.mockResolvedValue([]);

                const result = await service.findAllNutritionPlans(paginationDto);

                expect(result).toEqual({
                    data: [],
                    meta: {
                        totalPlans: 0,
                        page: 1,
                        lastPage: 0
                    }
                });
            });
        });

        describe('Complete Update Flow', () => {
            const updateDto: UpdateNutritionDto = {
                name: 'Updated Plan',
                description: 'Updated Description',
                imageURL: 'updated.jpg',
                duration: 45,
                category: Category.MUSCLE_GAIN,
                weeklyMeals: [
                    {
                        dayOfWeek: DayOfWeek.TUESDAY,
                        meals: [
                            {
                                type: MealType.LUNCH,
                                name: 'Updated Meal',
                                description: 'Updated Meal Description',
                                imageUrl: 'updated-meal.jpg',
                                foods: [
                                    {
                                        name: 'Updated Food',
                                        description: 'Updated Food Description',
                                        calories: 200,
                                        proteins: 20,
                                        carbs: 30,
                                        fats: 10
                                    }
                                ]
                            }
                        ]
                    }
                ]
            };

            it('should complete full update flow', async () => {
                const planId = '123';
                const updatedPlan = { ...mockNutritionPlan, ...updateDto };

                // Mock para la verificación del plan existente
                prismaServiceMock.nutritionPlan.findUnique
                    .mockResolvedValueOnce(mockNutritionPlan) // Para findNutritionPlanById
                    .mockResolvedValueOnce(updatedPlan);      // Para la segunda llamada después del update

                // Mock para la verificación del nombre
                prismaServiceMock.nutritionPlan.findFirst.mockResolvedValue(null);

                // Mock para la actualización
                prismaServiceMock.nutritionPlan.update.mockResolvedValue(updatedPlan);

                const result = await service.updateNutritionPlan(planId, updateDto);

                expect(prismaServiceMock.nutritionPlan.update).toHaveBeenCalledWith({
                    where: { id: planId },
                    data: expect.objectContaining({
                        name: updateDto.name,
                        weeklyMeals: expect.objectContaining({
                            deleteMany: {},
                            create: expect.arrayContaining([
                                expect.objectContaining({
                                    dayOfWeek: 'TUESDAY'
                                })
                            ])
                        })
                    })
                });

                expect(result).toEqual(expect.objectContaining({
                    id: planId,
                    name: updateDto.name,
                    weeklyMeals: expect.arrayContaining([
                        expect.objectContaining({
                            dayOfWeek: 'TUESDAY'
                        })
                    ])
                }));
            });
        });

        describe('Deletion Flow', () => {
            it('should complete soft deletion flow', async () => {
                const planId = '123';
                const deletedPlan = {
                    ...mockNutritionPlan,
                    isDeleted: true,
                    name: `Test Plan_deleted_${planId}`
                };

                prismaServiceMock.nutritionPlan.findUnique.mockResolvedValue(mockNutritionPlan);
                prismaServiceMock.nutritionPlan.update.mockResolvedValue(deletedPlan);

                const result = await service.removeNutritionPlan(planId);

                expect(prismaServiceMock.nutritionPlan.update).toHaveBeenCalledWith({
                    where: { id: planId },
                    data: expect.objectContaining({
                        isDeleted: true,
                        updatedAt: expect.any(Date),
                        name: expect.stringContaining('deleted')
                    })
                });

                expect(result).toEqual({
                    id: planId,
                    message: 'Nutrition plan deleted successfully'
                });
            });
        });

        describe('Bulk Operations', () => {
            describe('findNutritionPlanByIds', () => {
                it('should return multiple nutrition plans', async () => {
                    const planIds = ['123', '456'];
                    const multiplePlans = [
                        mockNutritionPlan,
                        { ...mockNutritionPlan, id: '456' }
                    ];

                    prismaServiceMock.nutritionPlan.findMany.mockResolvedValue(multiplePlans);

                    const result = await service.findNutritionPlanByIds(planIds);

                    expect(prismaServiceMock.nutritionPlan.findMany).toHaveBeenCalledWith({
                        where: {
                            id: { in: planIds },
                            isDeleted: false
                        },
                        include: expect.any(Object)
                    });

                    expect(result).toHaveLength(2);
                    expect(result[0]).toEqual(expect.objectContaining({
                        id: '123'
                    }));
                    expect(result[1]).toEqual(expect.objectContaining({
                        id: '456'
                    }));
                });

                it('should throw RpcException when some plans are not found', async () => {
                    const planIds = ['123', '999'];

                    prismaServiceMock.nutritionPlan.findMany.mockResolvedValue([mockNutritionPlan]);

                    try {
                        await service.findNutritionPlanByIds(planIds);
                        fail('Expected RpcException to be thrown');
                    } catch (error) {
                        expect(error).toBeInstanceOf(RpcException);
                        expect(error.error.message).toEqual( 'Nutrition plans not found for IDs: 999');
                        expect(error.error.status).toEqual(HttpStatus.NOT_FOUND); 
                    }
                });
            });
        });
    });
});