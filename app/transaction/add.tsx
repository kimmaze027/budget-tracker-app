import {
  ScrollView,
  Text,
  View,
  TextInput,
  Alert,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import * as Storage from "@/lib/storage";

export default function AddTransactionScreen() {
  const router = useRouter();
  const colors = useColors();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [type, setType] = useState<Storage.TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  
  const [categories, setCategories] = useState<Storage.Category[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const allCategories = await Storage.getCategories();
      setCategories(allCategories);
      
      // Set default category
      const defaultCategory = allCategories.find((c) => c.type === type);
      if (defaultCategory) {
        setCategoryId(defaultCategory.id);
      }
    } catch (error) {
      console.error("[AddTransaction] Failed to load categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (newType: Storage.TransactionType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setType(newType);
    
    // Update category to match new type
    const defaultCategory = categories.find((c) => c.type === newType);
    if (defaultCategory) {
      setCategoryId(defaultCategory.id);
    }
  };

  const handleSave = async () => {
    try {
      // Validation
      if (!amount || parseFloat(amount) <= 0) {
        Alert.alert("오류", "금액을 입력해주세요.");
        return;
      }
      
      if (!categoryId) {
        Alert.alert("오류", "카테고리를 선택해주세요.");
        return;
      }
      
      setSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const transaction: Storage.Transaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        categoryId,
        amount: parseFloat(amount),
        type,
        date: new Date(date).toISOString(),
        note: note.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      
      await Storage.saveTransaction(transaction);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("성공", "거래가 추가되었습니다.", [
        {
          text: "확인",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("[AddTransaction] Save failed:", error);
      Alert.alert("오류", "거래 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  const filteredCategories = categories.filter((c) => c.type === type);

  return (
    <ScreenContainer className="flex-1">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 p-6 gap-6">
          {/* Header */}
          <View className="flex-row justify-between items-center">
            <Text className="text-2xl font-bold text-foreground">거래 추가</Text>
            <Pressable
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              onPress={handleCancel}
            >
              <Text className="text-base text-primary">취소</Text>
            </Pressable>
          </View>

          {/* Type Selector */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">유형</Text>
            <View className="flex-row gap-3">
              <Pressable
                className="flex-1 rounded-xl p-4 border"
                style={({ pressed }) => [
                  {
                    backgroundColor: type === "income" ? colors.primary : colors.surface,
                    borderColor: type === "income" ? colors.primary : colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                onPress={() => handleTypeChange("income")}
              >
                <Text
                  className="text-center font-semibold"
                  style={{ color: type === "income" ? colors.background : colors.foreground }}
                >
                  수입
                </Text>
              </Pressable>
              <Pressable
                className="flex-1 rounded-xl p-4 border"
                style={({ pressed }) => [
                  {
                    backgroundColor: type === "expense" ? colors.error : colors.surface,
                    borderColor: type === "expense" ? colors.error : colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                onPress={() => handleTypeChange("expense")}
              >
                <Text
                  className="text-center font-semibold"
                  style={{ color: type === "expense" ? colors.background : colors.foreground }}
                >
                  지출
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Amount Input */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">금액</Text>
            <TextInput
              className="bg-surface rounded-xl p-4 border border-border text-foreground text-base"
              placeholder="금액을 입력하세요"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              returnKeyType="done"
            />
          </View>

          {/* Category Selector */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">카테고리</Text>
            <View className="flex-row flex-wrap gap-2">
              {filteredCategories.map((category) => (
                <Pressable
                  key={category.id}
                  className="rounded-xl px-4 py-3 border"
                  style={({ pressed }) => [
                    {
                      backgroundColor:
                        categoryId === category.id ? category.color : colors.surface,
                      borderColor: categoryId === category.id ? category.color : colors.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCategoryId(category.id);
                  }}
                >
                  <Text
                    className="font-medium"
                    style={{
                      color: categoryId === category.id ? "#FFFFFF" : colors.foreground,
                    }}
                  >
                    {category.icon} {category.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Date Input */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">날짜</Text>
            <TextInput
              className="bg-surface rounded-xl p-4 border border-border text-foreground text-base"
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.muted}
              value={date}
              onChangeText={setDate}
              returnKeyType="done"
            />
          </View>

          {/* Note Input */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">메모 (선택)</Text>
            <TextInput
              className="bg-surface rounded-xl p-4 border border-border text-foreground text-base"
              placeholder="메모를 입력하세요"
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={3}
              value={note}
              onChangeText={setNote}
              returnKeyType="done"
            />
          </View>

          {/* Save Button */}
          <View className="mt-auto pt-6">
            <Pressable
              className="rounded-xl p-4 items-center"
              style={({ pressed }) => [
                {
                  backgroundColor: colors.primary,
                  opacity: pressed || saving ? 0.8 : 1,
                },
              ]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text className="font-semibold text-base" style={{ color: colors.background }}>
                  저장
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
