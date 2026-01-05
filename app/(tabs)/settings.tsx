import { ScrollView, Text, View, ActivityIndicator, Alert, Pressable } from "react-native";
import { useState } from "react";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import * as Storage from "@/lib/storage";
import * as CSV from "@/lib/csv";

export default function SettingsScreen() {
  const colors = useColors();
  const [loading, setLoading] = useState(false);

  const handleExportCSV = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setLoading(true);
      
      const transactions = await Storage.getTransactions();
      const categories = await Storage.getCategories();
      
      if (transactions.length === 0) {
        Alert.alert("안내", "내보낼 거래 내역이 없습니다.");
        return;
      }
      
      await CSV.exportTransactionsToCSV(transactions, categories);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("성공", `${transactions.length}개의 거래 내역을 내보냈습니다.`);
    } catch (error) {
      console.error("[Settings] Export failed:", error);
      Alert.alert("오류", "CSV 내보내기에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleImportCSV = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      Alert.alert(
        "CSV 불러오기",
        "불러온 데이터는 기존 데이터에 추가됩니다. 계속하시겠습니까?",
        [
          { text: "취소", style: "cancel" },
          {
            text: "불러오기",
            onPress: async () => {
              try {
                setLoading(true);
                
                const categories = await Storage.getCategories();
                const importedTransactions = await CSV.importTransactionsFromCSV(categories);
                
                if (importedTransactions.length === 0) {
                  Alert.alert("안내", "불러올 수 있는 거래 내역이 없습니다.");
                  return;
                }
                
                // Save imported transactions
                for (const transaction of importedTransactions) {
                  await Storage.saveTransaction(transaction);
                }
                
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert("성공", `${importedTransactions.length}개의 거래 내역을 불러왔습니다.`);
              } catch (error) {
                console.error("[Settings] Import failed:", error);
                Alert.alert("오류", "CSV 불러오기에 실패했습니다.");
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("[Settings] Import dialog failed:", error);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      "데이터 삭제",
      "모든 거래 내역과 카테고리가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await Storage.clearAllData();
              await Storage.initializeStorage();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("완료", "모든 데이터가 삭제되었습니다.");
            } catch (error) {
              console.error("[Settings] Clear data failed:", error);
              Alert.alert("오류", "데이터 삭제에 실패했습니다.");
            } finally {
              setLoading(false);
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
            <Text className="text-2xl font-bold text-foreground">설정</Text>
          </View>

          {/* Data Management */}
          <View className="gap-4">
            <Text className="text-lg font-semibold text-foreground">데이터 관리</Text>
            
            <Pressable
              className="bg-surface rounded-xl p-4 border border-border"
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              onPress={handleExportCSV}
            >
              <Text className="text-base font-medium text-foreground">CSV 내보내기</Text>
              <Text className="text-sm text-muted mt-1">거래 내역을 CSV 파일로 저장합니다</Text>
            </Pressable>

            <Pressable
              className="bg-surface rounded-xl p-4 border border-border"
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              onPress={handleImportCSV}
            >
              <Text className="text-base font-medium text-foreground">CSV 불러오기</Text>
              <Text className="text-sm text-muted mt-1">CSV 파일에서 거래 내역을 가져옵니다</Text>
            </Pressable>
          </View>

          {/* Danger Zone */}
          <View className="gap-4 mt-auto pt-6">
            <Text className="text-lg font-semibold text-foreground">위험 영역</Text>
            
            <Pressable
              className="bg-error rounded-xl p-4 items-center"
              style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
              onPress={handleClearData}
            >
              <Text className="text-background font-semibold text-base">모든 데이터 삭제</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
