import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, Alert, Pressable } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      "로그아웃",
      "정말 로그아웃하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "로그아웃",
          style: "destructive",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await logout();
          },
        },
      ]
    );
  };

  const handleManageCategories = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("안내", "카테고리 관리 기능은 곧 추가됩니다.");
  };

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
          로그인 후 설정을 변경할 수 있습니다.
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 p-6 gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-2xl font-bold text-foreground">설정</Text>
          </View>

          {/* User Profile Card */}
          <View className="bg-surface rounded-2xl p-6 border border-border">
            <View className="gap-3">
              <Text className="text-lg font-semibold text-foreground">프로필</Text>
              <View className="gap-2">
                <View className="flex-row justify-between items-center">
                  <Text className="text-sm text-muted">이름</Text>
                  <Text className="text-base text-foreground">{user?.name || "사용자"}</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-sm text-muted">이메일</Text>
                  <Text className="text-base text-foreground">{user?.email || "미등록"}</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-sm text-muted">로그인 방법</Text>
                  <Text className="text-base text-foreground">{user?.loginMethod || "알 수 없음"}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Settings Options */}
          <View className="gap-4">
            <Text className="text-lg font-semibold text-foreground">앱 설정</Text>
            
            <Pressable
              className="bg-surface rounded-xl p-4 border border-border"
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              onPress={handleManageCategories}
            >
              <Text className="text-base font-medium text-foreground">카테고리 관리</Text>
              <Text className="text-sm text-muted mt-1">수입/지출 카테고리를 추가하거나 수정합니다</Text>
            </Pressable>
          </View>

          {/* Logout Button */}
          <View className="mt-auto pt-6">
            <Pressable
              className="bg-error rounded-xl p-4 items-center"
              style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
              onPress={handleLogout}
            >
              <Text className="text-background font-semibold text-base">로그아웃</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
