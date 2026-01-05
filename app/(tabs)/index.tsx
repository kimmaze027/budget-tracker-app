import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, FlatList, Alert, Pressable, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import * as WebBrowser from "expo-web-browser";
import { getLoginUrl } from "@/constants/oauth";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get current month summary
  const { data: summary, isLoading: summaryLoading } = trpc.statistics.monthlySummary.useQuery(
    {
      year: currentDate.getFullYear(),
      month: currentDate.getMonth() + 1,
    },
    { enabled: isAuthenticated }
  );

  // Get recent transactions
  const { data: transactions, isLoading: transactionsLoading, refetch } = trpc.transactions.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const deleteMutation = trpc.transactions.delete.useMutation({
    onSuccess: () => {
      refetch();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (error) => {
      Alert.alert("오류", "거래 삭제에 실패했습니다.");
    },
  });

  const handleAddTransaction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Implement transaction add screen
    Alert.alert("안내", "거래 추가 기능은 곧 추가됩니다.");
  };

  const handleTransactionPress = (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Implement transaction detail screen
    Alert.alert("안내", "거래 상세 기능은 곧 추가됩니다.");
  };

  const handleDeleteTransaction = (id: number) => {
    Alert.alert(
      "거래 삭제",
      "이 거래를 삭제하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: () => deleteMutation.mutate({ id }),
        },
      ]
    );
  };

  if (authLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  const handleLogin = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const loginUrl = getLoginUrl();
      
      if (Platform.OS === "web") {
        // Web: redirect to OAuth portal
        window.location.href = loginUrl;
      } else {
        // Native: open OAuth portal in browser
        const result = await WebBrowser.openAuthSessionAsync(loginUrl, null);
        if (result.type === "success") {
          // The OAuth callback will handle the redirect
          console.log("[Login] OAuth session completed");
        }
      }
    } catch (error) {
      console.error("[Login] Error:", error);
      Alert.alert("오류", "로그인에 실패했습니다.");
    }
  };

  if (!isAuthenticated) {
    return (
      <ScreenContainer className="items-center justify-center p-6">
        <View className="items-center gap-4">
          <Text className="text-3xl font-bold text-foreground">가계부</Text>
          <Text className="text-base text-muted text-center">
            소셜 로그인으로 시작하세요
          </Text>
          <Pressable
            className="bg-primary px-8 py-4 rounded-full mt-4"
            style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
            onPress={handleLogin}
          >
            <Text className="text-background font-semibold text-lg">로그인</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  const recentTransactions = transactions?.slice(0, 10) || [];

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
              안녕하세요, {user?.name || "사용자"}님
            </Text>
          </View>

          {/* Summary Card */}
          <View className="bg-surface rounded-2xl p-6 border border-border">
            {summaryLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <View className="gap-4">
                <View className="flex-row justify-between items-center">
                  <Text className="text-sm text-muted">수입</Text>
                  <Text className="text-lg font-semibold" style={{ color: colors.primary }}>
                    +{summary?.income.toLocaleString() || 0}원
                  </Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-sm text-muted">지출</Text>
                  <Text className="text-lg font-semibold" style={{ color: colors.error }}>
                    -{summary?.expense.toLocaleString() || 0}원
                  </Text>
                </View>
                <View className="h-px bg-border" />
                <View className="flex-row justify-between items-center">
                  <Text className="text-base font-semibold text-foreground">잔액</Text>
                  <Text className="text-xl font-bold text-foreground">
                    {summary?.balance.toLocaleString() || 0}원
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Recent Transactions */}
          <View className="gap-4">
            <Text className="text-lg font-semibold text-foreground">최근 거래</Text>
            {transactionsLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : recentTransactions.length === 0 ? (
              <View className="bg-surface rounded-2xl p-8 items-center border border-border">
                <Text className="text-muted text-center">
                  아직 거래 내역이 없습니다.{"\n"}하단의 + 버튼을 눌러 추가해보세요.
                </Text>
              </View>
            ) : (
              <View className="gap-2">
                {recentTransactions.map((transaction) => (
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
                        {Number(transaction.amount).toLocaleString()}원
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
