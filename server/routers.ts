import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Categories
  categories: router({
    list: protectedProcedure.query(({ ctx }) => {
      return db.getUserCategories(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(100),
        type: z.enum(["income", "expense"]),
        color: z.string().length(7),
        icon: z.string().max(50).optional(),
      }))
      .mutation(({ ctx, input }) => {
        return db.createCategory({
          userId: ctx.user.id,
          ...input,
        });
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        color: z.string().length(7).optional(),
        icon: z.string().max(50).optional(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return db.updateCategory(id, ctx.user.id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => {
        return db.deleteCategory(input.id, ctx.user.id);
      }),
  }),

  // Transactions
  transactions: router({
    list: protectedProcedure
      .input(z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional())
      .query(({ ctx, input }) => {
        return db.getUserTransactions(ctx.user.id, input?.startDate, input?.endDate);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ ctx, input }) => {
        return db.getTransactionById(input.id, ctx.user.id);
      }),
    create: protectedProcedure
      .input(z.object({
        categoryId: z.number(),
        amount: z.string(),
        type: z.enum(["income", "expense"]),
        date: z.date(),
        note: z.string().optional(),
      }))
      .mutation(({ ctx, input }) => {
        return db.createTransaction({
          userId: ctx.user.id,
          ...input,
        });
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        categoryId: z.number().optional(),
        amount: z.string().optional(),
        date: z.date().optional(),
        note: z.string().optional(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return db.updateTransaction(id, ctx.user.id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => {
        return db.deleteTransaction(input.id, ctx.user.id);
      }),
  }),

  // Statistics
  statistics: router({
    monthlySummary: protectedProcedure
      .input(z.object({
        year: z.number(),
        month: z.number().min(1).max(12),
      }))
      .query(({ ctx, input }) => {
        return db.getMonthlySummary(ctx.user.id, input.year, input.month);
      }),
    categoryStats: protectedProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(({ ctx, input }) => {
        return db.getCategoryStats(ctx.user.id, input.startDate, input.endDate);
      }),
  }),
});

export type AppRouter = typeof appRouter;
