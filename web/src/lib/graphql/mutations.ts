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

