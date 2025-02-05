import { Test, TestingModule } from '@nestjs/testing';
import { NutritionController } from './nutrition.controller';
import { NutritionService } from './nutrition.service';
import { CreateNutritionDto } from './dto/create-nutrition.dto';
import { UpdateNutritionDto } from './dto/update-nutrition.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ListNutritionIdsDto } from './dto/list-nutrition-ids.dto';
import { Category, DayOfWeek, MealType } from './enums/types.enum';

// Mock del NutritionService
const nutritionServiceMock = {
  createNutritionPlan: jest.fn(),
  findAllNutritionPlans: jest.fn(),
  findNutritionPlanById: jest.fn(),
  findNutritionPlanByIds: jest.fn(),
  updateNutritionPlan: jest.fn(),
  removeNutritionPlan: jest.fn(),
};

describe('NutritionController', () => {
  let controller: NutritionController;
  let service: NutritionService;

  const mockNutritionPlan = {
    id: '123',
    name: 'Test Plan',
    description: 'Test Description',
    imageURL: 'test.jpg',
    duration: 30,
    category: 'WEIGHT_LOSS',
    weeklyMeals: [
      {
        id: '1',
        dayOfWeek: 'MONDAY',
        meals: [
          {
            id: '1',
            type: 'BREAKFAST',
            name: 'Test Meal',
            description: 'Test Meal Description',
            imageUrl: 'meal.jpg',
            foods: [
              {
                id: '1',
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
      controllers: [NutritionController],
      providers: [
        {
          provide: NutritionService,
          useValue: nutritionServiceMock,
        },
      ],
    }).compile();

    controller = module.get<NutritionController>(NutritionController);
    service = module.get<NutritionService>(NutritionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a nutrition plan', async () => {
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

      nutritionServiceMock.createNutritionPlan.mockResolvedValue(mockNutritionPlan);

      const result = await controller.create(createDto);

      expect(nutritionServiceMock.createNutritionPlan).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockNutritionPlan);
    });
  });

  describe('findAllNutritionPlans', () => {
    it('should return paginated nutrition plans', async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      const expectedResponse = {
        data: [mockNutritionPlan],
        meta: {
          totalPlans: 1,
          page: 1,
          lastPage: 1
        }
      };

      nutritionServiceMock.findAllNutritionPlans.mockResolvedValue(expectedResponse);

      const result = await controller.findAllNutritionPlans(paginationDto);

      expect(nutritionServiceMock.findAllNutritionPlans).toHaveBeenCalledWith(paginationDto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('findNutritionPlanById', () => {
    it('should return a nutrition plan by id', async () => {
      const planId = '123';

      nutritionServiceMock.findNutritionPlanById.mockResolvedValue(mockNutritionPlan);

      const result = await controller.findNutritionPlanById(planId);

      expect(nutritionServiceMock.findNutritionPlanById).toHaveBeenCalledWith(planId);
      expect(result).toEqual(mockNutritionPlan);
    });
  });

  describe('findNutritionPlanByIds', () => {
    it('should return nutrition plans for multiple ids', async () => {
      const listNutritionIdsDto: ListNutritionIdsDto = {
        ids: ['123', '456']
      };

      const expectedResponse = [mockNutritionPlan, { ...mockNutritionPlan, id: '456' }];

      nutritionServiceMock.findNutritionPlanByIds.mockResolvedValue(expectedResponse);

      const result = await controller.findNutritionPlanByIds(listNutritionIdsDto);

      expect(nutritionServiceMock.findNutritionPlanByIds).toHaveBeenCalledWith(listNutritionIdsDto.ids);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('updateNutritionPlan', () => {
    it('should update a nutrition plan', async () => {
      const updatePayload = {
        id: '123',
        updateNutritionDto: {
          name: 'Updated Plan',
          description: 'Updated Description',
          imageURL: 'updated.jpg',
          duration: 45,
          category: Category.MUSCLE_GAIN,
          weeklyMeals: []
        }
      };

      const updatedPlan = { ...mockNutritionPlan, ...updatePayload.updateNutritionDto };
      nutritionServiceMock.updateNutritionPlan.mockResolvedValue(updatedPlan);

      const result = await controller.updateNutritionPlan(updatePayload);

      expect(nutritionServiceMock.updateNutritionPlan).toHaveBeenCalledWith(
        updatePayload.id,
        updatePayload.updateNutritionDto
      );
      expect(result).toEqual(updatedPlan);
    });
  });

  describe('removeNutritionPlan', () => {
    it('should remove a nutrition plan', async () => {
      const planId = '123';
      const expectedResponse = {
        id: planId,
        message: 'Nutrition plan deleted successfully'
      };

      nutritionServiceMock.removeNutritionPlan.mockResolvedValue(expectedResponse);

      const result = await controller.removeNutritionPlan(planId);

      expect(nutritionServiceMock.removeNutritionPlan).toHaveBeenCalledWith(planId);
      expect(result).toEqual(expectedResponse);
    });
  });
});