import SwiftUI

extension Color {
    // evoFlowAI Dark Theme Colors
    
    // Primary colors
    static let primary = Color("Primary") // Dark pink #8B4B6B
    static let primaryLight = Color("PrimaryLight")
    static let primaryDark = Color("PrimaryDark")
    
    // Background colors
    static let background = Color("Background") // #0a0a0a
    static let surface = Color("Surface") // #1a1a1a
    static let surfaceElevated = Color("SurfaceElevated") // #2a2a2a
    
    // Text colors
    static let textPrimary = Color("TextPrimary") // #ffffff
    static let textSecondary = Color("TextSecondary") // #d1d5db
    static let textMuted = Color("TextMuted") // #9ca3af
    
    // Border colors
    static let border = Color("Border") // #374151
    static let borderLight = Color("BorderLight") // #4b5563
    
    // Semantic colors
    static let success = Color("Success")
    static let warning = Color("Warning")
    static let error = Color("Error")
    static let info = Color("Info")
    
    // Gradient colors
    static let gradientStart = Color("GradientStart")
    static let gradientEnd = Color("GradientEnd")
    
    // Additional accent colors
    static let pink = Color("Pink")
    static let blue = Color("Blue")
    static let green = Color("Green")
    static let orange = Color("Orange")
}

// MARK: - Color Extensions for Nutrition
extension Color {
    static let caloriesColor = Color.orange
    static let proteinColor = Color.blue
    static let carbsColor = Color.green
    static let fatColor = Color.pink
    
    // Meal type colors
    static let breakfastColor = Color.orange
    static let lunchColor = Color.green
    static let dinnerColor = Color.blue
    static let snackColor = Color.pink
}

// MARK: - Dynamic Colors
extension Color {
    static func dynamicColor(light: Color, dark: Color) -> Color {
        return Color(UIColor { traitCollection in
            switch traitCollection.userInterfaceStyle {
            case .dark:
                return UIColor(dark)
            default:
                return UIColor(light)
            }
        })
    }
}

// MARK: - Color Utilities
extension Color {
    func opacity(_ opacity: Double) -> Color {
        return self.opacity(opacity)
    }
    
    var hex: String {
        let uiColor = UIColor(self)
        var red: CGFloat = 0
        var green: CGFloat = 0
        var blue: CGFloat = 0
        var alpha: CGFloat = 0
        
        uiColor.getRed(&red, green: &green, blue: &blue, alpha: &alpha)
        
        return String(format: "#%02X%02X%02X",
                     Int(red * 255),
                     Int(green * 255),
                     Int(blue * 255))
    }
}

// MARK: - Predefined Gradients
extension LinearGradient {
    static let primaryGradient = LinearGradient(
        colors: [.primary, .pink],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
    
    static let backgroundGradient = LinearGradient(
        colors: [.background, .surface],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
    
    static let cardGradient = LinearGradient(
        colors: [.surface, .surfaceElevated],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
    
    static let nutritionGradient = LinearGradient(
        colors: [.primary.opacity(0.1), .primary.opacity(0.05)],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
}
