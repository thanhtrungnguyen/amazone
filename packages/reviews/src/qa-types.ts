import { z } from "zod";

export const askQuestionSchema = z.object({
  productId: z.string().uuid(),
  question: z.string().min(10, "Question must be at least 10 characters").max(1000),
});

export const answerQuestionSchema = z.object({
  questionId: z.string().uuid(),
  answer: z.string().min(10, "Answer must be at least 10 characters").max(2000),
  isSeller: z.boolean().default(false),
});

export type AskQuestionInput = z.infer<typeof askQuestionSchema>;
export type AnswerQuestionInput = z.infer<typeof answerQuestionSchema>;

export interface QuestionUser {
  id: string;
  name: string;
}

export interface AnswerWithUser {
  id: string;
  questionId: string;
  userId: string;
  answer: string;
  isSellerAnswer: boolean;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
  user: QuestionUser;
}

export interface QuestionWithAnswers {
  id: string;
  productId: string;
  userId: string;
  question: string;
  createdAt: Date;
  updatedAt: Date;
  user: QuestionUser;
  answers: AnswerWithUser[];
}
