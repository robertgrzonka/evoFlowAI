import { gql } from '@apollo/client';

export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      name
      createdAt
      preferences {
        dailyCalorieGoal
        proteinGoal
        carbsGoal
        fatGoal
        weeklyWorkoutsGoal
        weeklyActiveMinutesGoal
        primaryGoal
        dietaryRestrictions
        activityLevel
        notifications
      }
    }
  }
`;

export const MY_FOOD_ITEMS_QUERY = gql`
  query MyFoodItems($limit: Int, $offset: Int) {
    myFoodItems(limit: $limit, offset: $offset) {
      id
      name
      description
      imageUrl
      mealType
      createdAt
      nutrition {
        calories
        protein
        carbs
        fat
        fiber
        sugar
        sodium
        confidence
      }
    }
  }
`;

export const DAILY_STATS_QUERY = gql`
  query DailyStats($date: String!) {
    dailyStats(date: $date) {
      date
      totalCalories
      totalProtein
      totalCarbs
      totalFat
      meals {
        id
        name
        mealType
        nutrition {
          calories
          protein
          carbs
          fat
        }
      }
      goalProgress {
        calories
        protein
        carbs
        fat
      }
    }
  }
`;

export const MY_CHAT_HISTORY_QUERY = gql`
  query MyChatHistory($limit: Int, $offset: Int) {
    myChatHistory(limit: $limit, offset: $offset) {
      id
      content
      role
      timestamp
      context {
        relatedFoodItems
        statsReference
      }
    }
  }
`;

export const NEW_CHAT_MESSAGE_SUBSCRIPTION = gql`
  subscription NewChatMessage($userId: ID!) {
    newChatMessage(userId: $userId) {
      id
      content
      role
      timestamp
      context {
        relatedFoodItems
        statsReference
      }
    }
  }
`;

export const MY_WORKOUTS_QUERY = gql`
  query MyWorkouts($date: String, $limit: Int, $offset: Int) {
    myWorkouts(date: $date, limit: $limit, offset: $offset) {
      id
      title
      notes
      durationMinutes
      caloriesBurned
      intensity
      performedAt
      createdAt
    }
  }
`;

export const WORKOUT_COACH_SUMMARY_QUERY = gql`
  query WorkoutCoachSummary($date: String!) {
    workoutCoachSummary(date: $date) {
      date
      consumedCalories
      consumedProtein
      calorieGoal
      proteinGoal
      caloriesBurned
      netCalories
      remainingCalories
      remainingProtein
      message
    }
  }
`;

export const NEW_WORKOUT_SUBSCRIPTION = gql`
  subscription NewWorkout($userId: ID!) {
    newWorkout(userId: $userId) {
      id
      title
      notes
      durationMinutes
      caloriesBurned
      intensity
      performedAt
      createdAt
    }
  }
`;

export const DASHBOARD_INSIGHT_QUERY = gql`
  query DashboardInsight($date: String!) {
    dashboardInsight(date: $date) {
      date
      summary
      tips
      caloriesBurned
      netCalories
      remainingCalories
      remainingProtein
    }
  }
`;

