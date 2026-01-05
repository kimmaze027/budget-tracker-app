import { ScrollView, Text, View, ActivityIndicator } from "react-native";
import { useState } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";

export default function StatisticsScreen() {
  const colors = useColors();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [currentDate] = useState(new Date());

  const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

  const { data: summary, isLoading: summaryLoading } = trpc.statistics.monthlySummary.useQuery(
    {
      year: currentDate.getFullYear(),
      month: currentDate.getMonth() + 1,
    },
    { enabled: isAuthenticated }
  );

  const { data: categoryStats, isLoading: statsLoading } = trpc.statistics.categoryStats.useQuery(
    {
      startDate,
      endDate,
    },
    { enabled: isAuthenticated }
  );

  if (authLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (!isAuthenticated) {
    return (
      <ScreenContainer className="items-center justify-center p-6">
        <Text className="text-lg text-muted text-center">
          로그인 후 통계를 확인할 수 있습니다.
        </Text>
      </ScreenContainer>
    );
  }

  const incomeStats = categoryStats?.filter((stat) => stat.type === "income") || [];
  const expenseStats = categoryStats?.filter((stat) => stat.type === "expense") || [];

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
            {summaryLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <View className="gap-4">
                <View className="flex-row justify-between items-center">
                  <Text className="text-sm text-muted">총 수입</Text>
                  <Text className="text-xl font-bold" style={{ color: colors.primary }}>
                    +{summary?.income.toLocaleString() || 0}원
                  </Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-sm text-muted">총 지출</Text>
                  <Text className="text-xl font-bold" style={{ color: colors.error }}>
                    -{summary?.expense.toLocaleString() || 0}원
                  </Text>
                </View>
                <View className="h-px bg-border" />
                <View className="flex-row justify-between items-center">
                  <Text className="text-base font-semibold text-foreground">순 잔액</Text>
                  <Text className="text-2xl font-bold text-foreground">
                    {summary?.balance.toLocaleString() || 0}원
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Income by Category */}
          <View className="gap-4">
            <Text className="text-lg font-semibold text-foreground">카테고리별 수입</Text>
            {statsLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : incomeStats.length === 0 ? (
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
            {statsLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : expenseStats.length === 0 ? (
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
