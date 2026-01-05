import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, categories, transactions, InsertCategory, InsertTransaction } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ===== Category Functions =====

export async function getUserCategories(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(categories).where(eq(categories.userId, userId)).orderBy(categories.name);
}

export async function createCategory(data: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(categories).values(data) as any;
  return Number(result.insertId);
}

export async function updateCategory(id: number, userId: number, data: Partial<InsertCategory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(categories).set(data).where(and(eq(categories.id, id), eq(categories.userId, userId)));
}

export async function deleteCategory(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(categories).where(and(eq(categories.id, id), eq(categories.userId, userId)));
}

// ===== Transaction Functions =====

export async function getUserTransactions(userId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(transactions).where(eq(transactions.userId, userId));
  
  if (startDate && endDate) {
    query = db.select().from(transactions).where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.date, startDate),
        lte(transactions.date, endDate)
      )
    );
  }
  
  return query.orderBy(desc(transactions.date));
}

export async function getTransactionById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(transactions).where(
    and(eq(transactions.id, id), eq(transactions.userId, userId))
  );
  
  return result[0] || null;
}

export async function createTransaction(data: InsertTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(transactions).values(data) as any;
  return Number(result.insertId);
}

export async function updateTransaction(id: number, userId: number, data: Partial<InsertTransaction>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(transactions).set(data).where(
    and(eq(transactions.id, id), eq(transactions.userId, userId))
  );
}

export async function deleteTransaction(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(transactions).where(
    and(eq(transactions.id, id), eq(transactions.userId, userId))
  );
}

// ===== Statistics Functions =====

export async function getMonthlySummary(userId: number, year: number, month: number) {
  const db = await getDb();
  if (!db) return { income: 0, expense: 0, balance: 0 };
  
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  const result = await db
    .select({
      type: transactions.type,
      total: sql<number>`SUM(${transactions.amount})`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.date, startDate),
        lte(transactions.date, endDate)
      )
    )
    .groupBy(transactions.type);
  
  const income = result.find(r => r.type === "income")?.total || 0;
  const expense = result.find(r => r.type === "expense")?.total || 0;
  
  return {
    income: Number(income),
    expense: Number(expense),
    balance: Number(income) - Number(expense),
  };
}

export async function getCategoryStats(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      type: transactions.type,
      total: sql<number>`SUM(${transactions.amount})`,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.date, startDate),
        lte(transactions.date, endDate)
      )
    )
    .groupBy(transactions.categoryId, categories.name, transactions.type)
    .orderBy(desc(sql<number>`SUM(${transactions.amount})`));
  
  return result.map(r => ({
    categoryId: r.categoryId,
    categoryName: r.categoryName || "Unknown",
    type: r.type,
    total: Number(r.total),
  }));
}
