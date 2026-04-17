import { gql } from '@apollo/client';

export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        id
        email
        name
        createdAt
      }
    }
  }
`;

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        email
        name
        createdAt
      }
    }
  }
`;

export const REQUEST_PASSWORD_RESET_MUTATION = gql`
  mutation RequestPasswordReset($input: RequestPasswordResetInput!) {
    requestPasswordReset(input: $input) {
      success
      message
      resetUrl
    }
  }
`;

export const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input) {
      token
      user {
        id
        email
        name
        createdAt
      }
    }
  }
`;

export const LOG_MEAL_WITH_AI_MUTATION = gql`
  mutation LogMealWithAI($input: LogMealWithAIInput!) {
    logMealWithAI(input: $input) {
      message {
        id
        content
        role
        timestamp
      }
      foodItem {
        id
        name
        description
        mealType
        createdAt
        nutrition {
          calories
          protein
          carbs
          fat
          confidence
        }
      }
    }
  }
`;

export const SEND_MESSAGE_MUTATION = gql`
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      id
      content
      role
      channel
      timestamp
    }
  }
`;

export const UPDATE_PREFERENCES_MUTATION = gql`
  mutation UpdatePreferences($input: UpdatePreferencesInput!) {
    updatePreferences(input: $input) {
      id
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
        activityLevel
        dietaryRestrictions
        notifications
      }
    }
  }
`;

export const SET_GOALS_WITH_AI_MUTATION = gql`
  mutation SetGoalsWithAI($input: SetGoalsWithAIInput!) {
    setGoalsWithAI(input: $input) {
      message
      user {
        id
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
          activityLevel
          dietaryRestrictions
          notifications
        }
      }
    }
  }
`;

export const LOG_WORKOUT_MUTATION = gql`
  mutation LogWorkout($input: LogWorkoutInput!) {
    logWorkout(input: $input) {
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

export const IMPORT_WORKOUT_FILE_MUTATION = gql`
  mutation ImportWorkoutFile($input: ImportWorkoutFileInput!) {
    importWorkoutFile(input: $input) {
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

export const DELETE_WORKOUT_MUTATION = gql`
  mutation DeleteWorkout($id: ID!) {
    deleteWorkout(id: $id)
  }
`;

export const DELETE_FOOD_ITEM_MUTATION = gql`
  mutation DeleteFoodItem($id: ID!) {
    deleteFoodItem(id: $id)
  }
`;

export const UPSERT_DAILY_ACTIVITY_MUTATION = gql`
  mutation UpsertDailyActivity($input: UpsertDailyActivityInput!) {
    upsertDailyActivity(input: $input) {
      date
      steps
      estimatedCalories
    }
  }
`;

export const CONNECT_GARMIN_STEP_SYNC_MUTATION = gql`
  mutation ConnectGarminStepSync($input: ConnectGarminStepSyncInput) {
    connectGarminStepSync(input: $input) {
      provider
      connected
      configured
      usingEnvToken
      lastSyncedAt
      lastError
    }
  }
`;

export const DISCONNECT_STEP_SYNC_MUTATION = gql`
  mutation DisconnectStepSync($provider: StepSyncProvider!) {
    disconnectStepSync(provider: $provider)
  }
`;

export const SYNC_GARMIN_STEPS_MUTATION = gql`
  mutation SyncGarminSteps($date: String!) {
    syncGarminSteps(date: $date) {
      date
      importedSteps
      savedSteps
      source
      syncedAt
    }
  }
`;

export const ADAPT_COACH_PRO_PLAN_MUTATION = gql`
  mutation AdaptEvoCoachProPlan($input: AdaptCoachProPlanInput!) {
    adaptEvoCoachProPlan(input: $input) {
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

export const REFRESH_COACH_PRO_PLAN_BY_TODAY_SIGNALS_MUTATION = gql`
  mutation RefreshEvoCoachProPlanByTodaySignals($date: String!) {
    refreshEvoCoachProPlanByTodaySignals(date: $date) {
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

