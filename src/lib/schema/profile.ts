import { z } from "zod";

// プロフィール情報のバリデーションスキーマ
export const profileSchema = z.object({
  displayName: z
    .string()
    .min(2, { message: "表示名は2文字以上である必要があります" })
    .max(50, { message: "表示名は50文字以下である必要があります" }),
  bio: z
    .string()
    .max(500, { message: "自己紹介は500文字以下である必要があります" })
    .optional(),
  location: z
    .string()
    .max(100, { message: "場所は100文字以下である必要があります" })
    .optional(),
  website: z
    .string()
    .url({ message: "有効なURLを入力してください" })
    .max(200, { message: "ウェブサイトは200文字以下である必要があります" })
    .optional()
    .or(z.literal("")),
  // 画像は別途処理するのでスキーマには含めない
  // avatarUrl: z.string().optional(),
});

// メンター固有のプロフィール情報
export const mentorProfileSchema = profileSchema.extend({
  specialties: z
    .array(z.string())
    .min(1, { message: "少なくとも1つの専門分野を選択してください" }),
  experience: z
    .number()
    .int()
    .min(0, { message: "経験年数は0以上である必要があります" })
    .max(50, { message: "経験年数は50以下である必要があります" }),
  hourlyRate: z
    .number()
    .min(0, { message: "時給は0以上である必要があります" })
    .optional(),
});

// 生徒固有のプロフィール情報
export const studentProfileSchema = profileSchema.extend({
  interests: z.array(z.string()).optional(),
  skillLevel: z.enum(["beginner", "intermediate", "advanced"]),
  goals: z.string().max(500, { message: "目標は500文字以下である必要があります" }).optional(),
});

// TypeScript型定義
export type ProfileFormData = z.infer<typeof profileSchema>;
export type MentorProfileFormData = z.infer<typeof mentorProfileSchema>;
export type StudentProfileFormData = z.infer<typeof studentProfileSchema>; 