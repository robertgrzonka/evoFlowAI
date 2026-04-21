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

export const WEEKLY_MEALS_NUTRITION_QUERY = gql`
  query WeeklyMealsNutrition($endDate: String) {
    weeklyMealsNutrition(endDate: $endDate) {
      weekStart
      weekEnd
      daysWithMeals
      totalMealsLogged
      goals {
        calories
        protein
        carbs
        fat
      }
      totals {
        calories
        protein
        carbs
        fat
      }
      averages {
        calories
        protein
        carbs
        fat
      }
      days {
        date
        calories
        protein
        carbs
        fat
        mealCount
      }
    }
  }
`;

export const WEEKLY_MEALS_COACH_QUERY = gql`
  query WeeklyMealsCoachInsight($endDate: String) {
    weeklyMealsCoachInsight(endDate: $endDate) {
      headline
      summary
      focusAreas
      improvements
      closingLine
    }
  }
`;

export const WEEKLY_WORKOUTS_TRAINING_QUERY = gql`
  query WeeklyWorkoutsTraining($endDate: String) {
    weeklyWorkoutsTraining(endDate: $endDate) {
      weekStart
      weekEnd
      daysWithWorkouts
      totalSessions
      goals {
        weeklySessionsTarget
        weeklyActiveMinutesTarget
      }
      totals {
        minutes
        caloriesBurned
        sessions
      }
      averages {
        minutes
        caloriesBurned
        sessions
      }
      days {
        date
        sessionCount
        totalMinutes
        caloriesBurned
        lowMinutes
        mediumMinutes
        highMinutes
      }
    }
  }
`;

export const WEEKLY_WORKOUTS_COACH_QUERY = gql`
  query WeeklyWorkoutsCoachInsight($endDate: String) {
    weeklyWorkoutsCoachInsight(endDate: $endDate) {
      headline
      summary
      focusAreas
      improvements
      closingLine
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
      availableDays
      isCompleteWeek
      summary
      highlights
      proTip
      nutritionScore
      trainingScore
      consistencyScore
    }
  }
`;

export const STEP_SYNC_STATUS_QUERY = gql`
  query StepSyncStatus($provider: StepSyncProvider!) {
    stepSyncStatus(provider: $provider) {
      provider
      connected
      configured
      usingEnvToken
      lastSyncedAt
      lastError
    }
  }
`;

export const GENERATE_COACH_PRO_PLAN_QUERY = gql`
  query GenerateEvoCoachProPlan($input: GenerateCoachProPlanInput!) {
    generateEvoCoachProPlan(input: $input) {
      generatedAt
      generationSource
      fallbackReason
      generationWarnings
      normalizationApplied
      normalizationSummary
      normalizedFields
      shoppingListSource
      shoppingListWarnings
      sectionSources
      fallbackSections
      overview {
        calorieTargetRange
        trainingFrequency
        planDifficulty
        expectedPace
        flexibilityLevel
      }
      weeklyNutrition {
        dayLabel
        calorieTarget
        proteinTarget
        carbsTarget
        fatTarget
        meals {
          mealType
          name
          description
          estimatedCalories
          estimatedProtein
          estimatedCarbs
          estimatedFat
          fiberGrams
          estimatedSatiety
          suggestedUse
          prepTimeMinutes
          tags
          ingredients {
            item
            quantity
          }
          recipeSteps
          substitutions
          mealPrepNote
          rationale
        }
      }
      weeklyTraining {
        dayLabel
        sessionGoal
        workoutType
        durationMinutes
        intensity
        structure {
          name
          sets
          reps
          durationMinutes
          notes
        }
        fallbackVersion
        minimumViableVersion
      }
      rationale
      smartWarnings
      shoppingList {
        proteins
        carbs
        fats
        vegetables
        dairy
        extras
        optionalItems
      }
      substitutions {
        ingredientSubstitutions
        mealSwaps
        exerciseSubstitutions
        lowEnergyAlternatives
        shortOnTimeAlternatives
      }
      coachNotes
      hardestPartThisWeek
      focusForBestResults
      executionTips
      mealPrepTips
      recoveryNote
      bestCasePlan
      realisticPlan
    }
  }
`;

export const MY_COACH_PRO_PLAN_QUERY = gql`
  query MyEvoCoachProPlan {
    myEvoCoachProPlan {
      generatedAt
      generationSource
      fallbackReason
      generationWarnings
      normalizationApplied
      normalizationSummary
      normalizedFields
      shoppingListSource
      shoppingListWarnings
      sectionSources
      fallbackSections
      overview {
        calorieTargetRange
        trainingFrequency
        planDifficulty
        expectedPace
        flexibilityLevel
      }
      weeklyNutrition {
        dayLabel
        calorieTarget
        proteinTarget
        carbsTarget
        fatTarget
        meals {
          mealType
          name
          description
          estimatedCalories
          estimatedProtein
          estimatedCarbs
          estimatedFat
          fiberGrams
          estimatedSatiety
          suggestedUse
          prepTimeMinutes
          tags
          ingredients {
            item
            quantity
          }
          recipeSteps
          substitutions
          mealPrepNote
          rationale
        }
      }
      weeklyTraining {
        dayLabel
        sessionGoal
        workoutType
        durationMinutes
        intensity
        structure {
          name
          sets
          reps
          durationMinutes
          notes
        }
        fallbackVersion
        minimumViableVersion
      }
      rationale
      smartWarnings
      shoppingList {
        proteins
        carbs
        fats
        vegetables
        dairy
        extras
        optionalItems
      }
      substitutions {
        ingredientSubstitutions
        mealSwaps
        exerciseSubstitutions
        lowEnergyAlternatives
        shortOnTimeAlternatives
      }
      coachNotes
      hardestPartThisWeek
      focusForBestResults
      executionTips
      mealPrepTips
      recoveryNote
      bestCasePlan
      realisticPlan
    }
  }
`;

export const COACH_PRO_MEAL_DRAWER_DETAILS_QUERY = gql`
  query CoachProMealDrawerDetails($input: CoachProMealDrawerInput!) {
    coachProMealDrawerDetails(input: $input) {
      mealType
      name
      description
      estimatedCalories
      estimatedProtein
      estimatedCarbs
      estimatedFat
      fiberGrams
      estimatedSatiety
      suggestedUse
      prepTimeMinutes
      tags
      ingredients {
        item
        quantity
      }
      recipeSteps
      substitutions
      mealPrepNote
      rationale
    }
  }
`;

export const COACH_PRO_TRAINING_DRAWER_DETAILS_QUERY = gql`
  query CoachProTrainingDrawerDetails($input: CoachProTrainingDrawerInput!) {
    coachProTrainingDrawerDetails(input: $input) {
      whyThisSession
      painSubstitution
      session {
        dayLabel
        sessionGoal
        workoutType
        durationMinutes
        intensity
        structure {
          name
          sets
          reps
          durationMinutes
          notes
        }
        fallbackVersion
        minimumViableVersion
      }
    }
  }
`;

