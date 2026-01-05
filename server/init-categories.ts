/**
 * Initialize default categories for a user
 * This script can be called when a user first logs in
 */

import { createCategory } from "./db";

export async function initializeDefaultCategories(userId: number) {
  const defaultCategories = [
    // Income categories
    { userId, name: "급여", type: "income" as const, color: "#10B981", icon: "💰" },
    { userId, name: "부수입", type: "income" as const, color: "#34D399", icon: "💵" },
    { userId, name: "기타수입", type: "income" as const, color: "#6EE7B7", icon: "📈" },
    
    // Expense categories
    { userId, name: "식비", type: "expense" as const, color: "#EF4444", icon: "🍔" },
    { userId, name: "교통비", type: "expense" as const, color: "#F87171", icon: "🚗" },
    { userId, name: "쇼핑", type: "expense" as const, color: "#FCA5A5", icon: "🛍️" },
    { userId, name: "문화생활", type: "expense" as const, color: "#FB923C", icon: "🎬" },
    { userId, name: "의료", type: "expense" as const, color: "#FBBF24", icon: "🏥" },
    { userId, name: "교육", type: "expense" as const, color: "#A78BFA", icon: "📚" },
    { userId, name: "기타지출", type: "expense" as const, color: "#94A3B8", icon: "💸" },
  ];

  try {
    for (const category of defaultCategories) {
      await createCategory(category);
    }
    console.log(`[Init] Default categories created for user ${userId}`);
  } catch (error) {
    console.error(`[Init] Failed to create default categories for user ${userId}:`, error);
  }
}
