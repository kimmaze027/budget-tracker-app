import { ScrollView, Text, View, ActivityIndicator } from "react-native";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import * as Storage from "@/lib/storage";

export default function StatisticsScreen() {
  const colors = useColors();
  const [loading, setLoading] = useState(true);
  const [currentDate] = useState(new Date());
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [categoryStats, setCategoryStats] = useState<Awaited<ReturnType<typeof Storage.getCategoryStats>>>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load monthly summary
      const summaryData = await Storage.getMonthlySummary(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1
      );
      setSummary(summaryData);
      
      // Load category stats
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
      const stats = await Storage.getCategoryStats(startDate, endDate);
      setCategoryStats(stats);
    } catch (error) {
      console.error("[Statistics] Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const incomeStats = categoryStats.filter((stat) => stat.type === "income");
  const expenseStats = categoryStats.filter((stat) => stat.type === "expense");

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 p-6 gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-2xl font-bold text-foreground">통계</Text>
            <Text className="text-sm text-muted">
              {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
            </Text>
          </View>

          {/* Summary Card */}
          <View className="bg-surface rounded-2xl p-6 border border-border">
            <View className="gap-4">
              <View className="flex-row justify-between items-center">
                <Text className="text-sm text-muted">총 수입</Text>
                <Text className="text-xl font-bold" style={{ color: colors.primary }}>
                  +{summary.income.toLocaleString()}원
                </Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-sm text-muted">총 지출</Text>
                <Text className="text-xl font-bold" style={{ color: colors.error }}>
                  -{summary.expense.toLocaleString()}원
                </Text>
              </View>
              <View className="h-px bg-border" />
              <View className="flex-row justify-between items-center">
                <Text className="text-base font-semibold text-foreground">순 잔액</Text>
                <Text className="text-2xl font-bold text-foreground">
                  {summary.balance.toLocaleString()}원
                </Text>
              </View>
            </View>
          </View>

          {/* Income by Category */}
          <View className="gap-4">
            <Text className="text-lg font-semibold text-foreground">카테고리별 수입</Text>
            {incomeStats.length === 0 ? (
              <View className="bg-surface rounded-2xl p-6 items-center border border-border">
                <Text className="text-muted">수입 내역이 없습니다.</Text>
              </View>
            ) : (
              <View className="gap-2">
                {incomeStats.map((stat, index) => (
                  <View
                    key={`income-${stat.categoryId}-${index}`}
                    className="bg-surface rounded-xl p-4 border border-border"
                  >
                    <View className="flex-row justify-between items-center">
                      <Text className="text-base font-medium text-foreground">
                        {stat.categoryName}
                      </Text>
                      <Text className="text-lg font-semibold" style={{ color: colors.primary }}>
                        +{stat.total.toLocaleString()}원
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Expense by Category */}
          <View className="gap-4">
            <Text className="text-lg font-semibold text-foreground">카테고리별 지출</Text>
            {expenseStats.length === 0 ? (
              <View className="bg-surface rounded-2xl p-6 items-center border border-border">
                <Text className="text-muted">지출 내역이 없습니다.</Text>
              </View>
            ) : (
              <View className="gap-2">
                {expenseStats.map((stat, index) => (
                  <View
                    key={`expense-${stat.categoryId}-${index}`}
                    className="bg-surface rounded-xl p-4 border border-border"
                  >
                    <View className="flex-row justify-between items-center">
                      <Text className="text-base font-medium text-foreground">
                        {stat.categoryName}
                      </Text>
                      <Text className="text-lg font-semibold" style={{ color: colors.error }}>
                        -{stat.total.toLocaleString()}원
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
