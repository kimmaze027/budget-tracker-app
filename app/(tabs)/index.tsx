import { ScrollView, Text, View, ActivityIndicator, Alert, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useState, useCallback } from "react";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "@react-navigation/native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import * as Storage from "@/lib/storage";

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const [loading, setLoading] = useState(true);
  const [currentDate] = useState(new Date());
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [transactions, setTransactions] = useState<Storage.Transaction[]>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Initialize storage if needed
      await Storage.initializeStorage();
      
      // Load monthly summary
      const summaryData = await Storage.getMonthlySummary(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1
      );
      setSummary(summaryData);
      
      // Load recent transactions
      const allTransactions = await Storage.getTransactions();
      setTransactions(allTransactions.slice(0, 10));
    } catch (error) {
      console.error("[Home] Failed to load data:", error);
      Alert.alert("오류", "데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleAddTransaction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/transaction/add" as any);
  };

  const handleTransactionPress = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/transaction/${id}` as any);
  };

  const handleDeleteTransaction = (id: string) => {
    Alert.alert(
      "거래 삭제",
      "이 거래를 삭제하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              await Storage.deleteTransaction(id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              loadData();
            } catch (error) {
              Alert.alert("오류", "거래 삭제에 실패했습니다.");
            }
          },
        },
      ]
    );
  };

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
            <Text className="text-2xl font-bold text-foreground">
              {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
            </Text>
            <Text className="text-sm text-muted">
              나의 가계부
            </Text>
          </View>

          {/* Summary Card */}
          <View className="bg-surface rounded-2xl p-6 border border-border">
            <View className="gap-4">
              <View className="flex-row justify-between items-center">
                <Text className="text-sm text-muted">수입</Text>
                <Text className="text-lg font-semibold" style={{ color: colors.primary }}>
                  +{summary.income.toLocaleString()}원
                </Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-sm text-muted">지출</Text>
                <Text className="text-lg font-semibold" style={{ color: colors.error }}>
                  -{summary.expense.toLocaleString()}원
                </Text>
              </View>
              <View className="h-px bg-border" />
              <View className="flex-row justify-between items-center">
                <Text className="text-base font-semibold text-foreground">잔액</Text>
                <Text className="text-xl font-bold text-foreground">
                  {summary.balance.toLocaleString()}원
                </Text>
              </View>
            </View>
          </View>

          {/* Recent Transactions */}
          <View className="gap-4">
            <Text className="text-lg font-semibold text-foreground">최근 거래</Text>
            {transactions.length === 0 ? (
              <View className="bg-surface rounded-2xl p-8 items-center border border-border">
                <Text className="text-muted text-center">
                  아직 거래 내역이 없습니다.{"\n"}하단의 + 버튼을 눌러 추가해보세요.
                </Text>
              </View>
            ) : (
              <View className="gap-2">
                {transactions.map((transaction) => (
                  <Pressable
                    key={transaction.id}
                    className="bg-surface rounded-xl p-4 border border-border"
                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                    onPress={() => handleTransactionPress(transaction.id)}
                    onLongPress={() => handleDeleteTransaction(transaction.id)}
                  >
                    <View className="flex-row justify-between items-center">
                      <View className="flex-1">
                        <Text className="text-base font-medium text-foreground">
                          {transaction.note || "메모 없음"}
                        </Text>
                        <Text className="text-sm text-muted mt-1">
                          {new Date(transaction.date).toLocaleDateString("ko-KR")}
                        </Text>
                      </View>
                      <Text
                        className="text-lg font-semibold"
                        style={{
                          color: transaction.type === "income" ? colors.primary : colors.error,
                        }}
                      >
                        {transaction.type === "income" ? "+" : "-"}
                        {transaction.amount.toLocaleString()}원
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <Pressable
        className="absolute bottom-8 right-6 w-16 h-16 rounded-full items-center justify-center shadow-lg"
        style={({ pressed }) => [
          { backgroundColor: colors.primary, transform: [{ scale: pressed ? 0.95 : 1 }] },
        ]}
        onPress={handleAddTransaction}
      >
        <IconSymbol name="plus" size={32} color={colors.background} />
      </Pressable>
    </ScreenContainer>
  );
}
