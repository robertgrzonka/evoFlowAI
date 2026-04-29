/** Shape of `dailyStats.meals` items used in Stats / meal lists. */
export type StatsDayMeal = {
  id: string;
  name: string;
  description?: string | null;
  mealType: string;
  imageUrl?: string | null;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    confidence?: number | null;
  };
};
