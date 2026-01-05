import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { Platform } from "react-native";
import type { Transaction, Category } from "./storage";

/**
 * Export transactions to CSV format
 */
export async function exportTransactionsToCSV(
  transactions: Transaction[],
  categories: Category[]
): Promise<void> {
  try {
    // Create CSV header
    const header = "날짜,유형,카테고리,금액,메모\n";
    
    // Create CSV rows
    const rows = transactions.map((t) => {
      const category = categories.find((c) => c.id === t.categoryId);
      const type = t.type === "income" ? "수입" : "지출";
      const date = new Date(t.date).toLocaleDateString("ko-KR");
      const amount = t.amount;
      const note = (t.note || "").replace(/"/g, '""'); // Escape quotes
      
      return `"${date}","${type}","${category?.name || "Unknown"}",${amount},"${note}"`;
    }).join("\n");
    
    const csv = header + rows;
    
    // Generate filename with current date
    const now = new Date();
    const filename = `가계부_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}.csv`;
    
    if (Platform.OS === "web") {
      // Web: Download as file
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      // Native: Save to file system and share
      const fileUri = FileSystem.documentDirectory + filename;
      await FileSystem.writeAsStringAsync(fileUri, "\uFEFF" + csv, {
        encoding: "utf8" as any,
      });
      
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/csv",
          dialogTitle: "가계부 내보내기",
        });
      } else {
        throw new Error("Sharing is not available on this device");
      }
    }
    
    console.log("[CSV] Export successful:", filename);
  } catch (error) {
    console.error("[CSV] Export failed:", error);
    throw error;
  }
}

/**
 * Import transactions from CSV file
 */
export async function importTransactionsFromCSV(
  categories: Category[]
): Promise<Transaction[]> {
  try {
    let csvContent: string;
    
    if (Platform.OS === "web") {
      // Web: Use file input
      return new Promise((resolve, reject) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".csv";
        
        input.onchange = async (e: any) => {
          try {
            const file = e.target.files[0];
            if (!file) {
              reject(new Error("No file selected"));
              return;
            }
            
            const text = await file.text();
            const transactions = parseCSV(text, categories);
            resolve(transactions);
          } catch (error) {
            reject(error);
          }
        };
        
        input.click();
      });
    } else {
      // Native: Use document picker
      const result = await DocumentPicker.getDocumentAsync({
        type: "text/csv",
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) {
        throw new Error("File selection cancelled");
      }
      
      const fileUri = result.assets[0].uri;
      csvContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: "utf8" as any,
      });
      
      return parseCSV(csvContent, categories);
    }
  } catch (error) {
    console.error("[CSV] Import failed:", error);
    throw error;
  }
}

/**
 * Parse CSV content to transactions
 */
function parseCSV(csvContent: string, categories: Category[]): Transaction[] {
  try {
    // Remove BOM if present
    const content = csvContent.replace(/^\uFEFF/, "");
    
    // Split into lines
    const lines = content.split("\n").filter((line) => line.trim());
    
    // Skip header
    const dataLines = lines.slice(1);
    
    const transactions: Transaction[] = [];
    
    for (const line of dataLines) {
      try {
        // Simple CSV parsing (handles quoted fields)
        const matches = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
        if (!matches || matches.length < 4) {
          console.warn("[CSV] Skipping invalid line:", line);
          continue;
        }
        
        const [dateStr, typeStr, categoryStr, amountStr, noteStr] = matches.map((m) =>
          m.replace(/^"|"$/g, "").trim()
        );
        
        // Parse type
        const type = typeStr === "수입" ? "income" : "expense";
        
        // Find category by name
        const category = categories.find(
          (c) => c.name === categoryStr && c.type === type
        );
        
        if (!category) {
          console.warn("[CSV] Category not found:", categoryStr, type);
          continue;
        }
        
        // Parse amount
        const amount = parseFloat(amountStr);
        if (isNaN(amount)) {
          console.warn("[CSV] Invalid amount:", amountStr);
          continue;
        }
        
        // Parse date
        const dateParts = dateStr.split(/[.\-\/]/);
        let date: Date;
        
        if (dateParts.length === 3) {
          // Assume format: YYYY.MM.DD or YYYY-MM-DD
          const [year, month, day] = dateParts.map((p) => parseInt(p, 10));
          date = new Date(year, month - 1, day);
        } else {
          // Fallback to current date
          date = new Date();
        }
        
        // Create transaction
        const transaction: Transaction = {
          id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          categoryId: category.id,
          amount,
          type,
          date: date.toISOString(),
          note: noteStr || undefined,
          createdAt: new Date().toISOString(),
        };
        
        transactions.push(transaction);
      } catch (error) {
        console.warn("[CSV] Failed to parse line:", line, error);
      }
    }
    
    console.log("[CSV] Parsed transactions:", transactions.length);
    return transactions;
  } catch (error) {
    console.error("[CSV] Parse failed:", error);
    throw error;
  }
}
