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
        weightKg
        heightCm
        proteinGoal
        carbsGoal
        fatGoal
        weeklyWorkoutsGoal
        weeklyActiveMinutesGoal
        primaryGoal
        coachingTone
        proactivityLevel
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
      dynamicGoals {
        calories
        protein
        carbs
        fat
      }
      steps
      stepsCalories
      workoutCalories
      calorieBudget
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
  query MyChatHistory($channel: ChatChannel, $limit: Int, $offset: Int) {
    myChatHistory(channel: $channel, limit: $limit, offset: $offset) {
      id
      content
      role
      channel
      timestamp
      context {
        relatedFoodItems
        statsReference
      }
    }
  }
`;

export const NEW_CHAT_MESSAGE_SUBSCRIPTION = gql`
  subscription NewChatMessage($userId: ID!, $channel: ChatChannel) {
    newChatMessage(userId: $userId, channel: $channel) {
      id
      content
      role
      channel
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
      steps
      stepsCalories
      calorieBudget
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
      steps
      stepsCalories
      calorieBudget
      netCalories
      remainingCalories
      remainingProtein
    }
  }
`;

export const DAILY_ACTIVITY_QUERY = gql`
  query DailyActivity($date: String!) {
    dailyActivity(date: $date) {
      date
      steps
      estimatedCalories
    }
  }
`;

export const WEEKLY_EVO_REVIEW_QUERY = gql`
  query WeeklyEvoReview($endDate: String) {
    weeklyEvoReview(endDate: $endDate) {
      startDate
      endDate
      trackedDays
      isCompleteWeek
      summary
      highlights
      nutritionScore
      trainingScore
      consistencyScore
    }
  }
`;

