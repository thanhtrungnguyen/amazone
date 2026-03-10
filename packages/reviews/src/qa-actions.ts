"use server";

import {
  db,
  productQuestions,
  productAnswers,
  answerHelpfulVotes,
  users,
} from "@amazone/db";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import {
  askQuestionSchema,
  answerQuestionSchema,
  type AskQuestionInput,
  type AnswerQuestionInput,
  type QuestionWithAnswers,
} from "./qa-types";

export async function askQuestion(
  userId: string,
  input: AskQuestionInput
): Promise<typeof productQuestions.$inferSelect> {
  const validated = askQuestionSchema.parse(input);

  const [question] = await db
    .insert(productQuestions)
    .values({
      productId: validated.productId,
      userId,
      question: validated.question,
    })
    .returning();

  return question;
}

export async function answerQuestion(
  userId: string,
  input: AnswerQuestionInput
): Promise<typeof productAnswers.$inferSelect> {
  const validated = answerQuestionSchema.parse(input);

  const [answer] = await db
    .insert(productAnswers)
    .values({
      questionId: validated.questionId,
      userId,
      answer: validated.answer,
      isSellerAnswer: validated.isSeller,
    })
    .returning();

  return answer;
}

export async function getProductQuestions(
  productId: string,
  limit = 5,
  offset = 0
): Promise<{ questions: QuestionWithAnswers[]; total: number }> {
  // Fetch questions with their answer counts to sort by most answered,
  // then by most recent. We join user and answers in a second query to
  // avoid a complex multi-join that is harder to paginate correctly.
  const rows = await db
    .select({
      id: productQuestions.id,
      productId: productQuestions.productId,
      userId: productQuestions.userId,
      question: productQuestions.question,
      createdAt: productQuestions.createdAt,
      updatedAt: productQuestions.updatedAt,
      userName: users.name,
      answerCount: sql<number>`(
        SELECT COUNT(*)::integer
        FROM product_answers pa
        WHERE pa.question_id = ${productQuestions.id}
      )`,
    })
    .from(productQuestions)
    .innerJoin(users, eq(productQuestions.userId, users.id))
    .where(eq(productQuestions.productId, productId))
    .orderBy(
      // Most answered first, then most recent
      sql`(
        SELECT COUNT(*)
        FROM product_answers pa
        WHERE pa.question_id = ${productQuestions.id}
      ) DESC`,
      desc(productQuestions.createdAt)
    )
    .limit(limit)
    .offset(offset);

  // Total count for pagination
  const [countRow] = await db
    .select({ total: sql<number>`COUNT(*)::integer` })
    .from(productQuestions)
    .where(eq(productQuestions.productId, productId));

  const total = countRow?.total ?? 0;

  if (rows.length === 0) {
    return { questions: [], total };
  }

  // Fetch all answers for these questions in a single query
  const questionIds = rows.map((r) => r.id);
  const answerRows = await db
    .select({
      id: productAnswers.id,
      questionId: productAnswers.questionId,
      userId: productAnswers.userId,
      answer: productAnswers.answer,
      isSellerAnswer: productAnswers.isSellerAnswer,
      helpfulCount: productAnswers.helpfulCount,
      createdAt: productAnswers.createdAt,
      updatedAt: productAnswers.updatedAt,
      userName: users.name,
    })
    .from(productAnswers)
    .innerJoin(users, eq(productAnswers.userId, users.id))
    .where(inArray(productAnswers.questionId, questionIds))
    .orderBy(
      // Seller answers first, then by helpful count desc
      desc(productAnswers.isSellerAnswer),
      desc(productAnswers.helpfulCount),
      desc(productAnswers.createdAt)
    );

  // Group answers by questionId
  const answersByQuestion = new Map<string, typeof answerRows>();
  for (const answer of answerRows) {
    const existing = answersByQuestion.get(answer.questionId) ?? [];
    existing.push(answer);
    answersByQuestion.set(answer.questionId, existing);
  }

  const questions: QuestionWithAnswers[] = rows.map((row) => ({
    id: row.id,
    productId: row.productId,
    userId: row.userId,
    question: row.question,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    user: { id: row.userId, name: row.userName },
    answers: (answersByQuestion.get(row.id) ?? []).map((a) => ({
      id: a.id,
      questionId: a.questionId,
      userId: a.userId,
      answer: a.answer,
      isSellerAnswer: a.isSellerAnswer,
      helpfulCount: a.helpfulCount,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      user: { id: a.userId, name: a.userName },
    })),
  }));

  return { questions, total };
}

export async function markAnswerHelpful(
  answerId: string,
  userId: string
): Promise<{ success: boolean; alreadyVoted: boolean }> {
  // Check for duplicate vote
  const existing = await db.query.answerHelpfulVotes.findFirst({
    where: and(
      eq(answerHelpfulVotes.answerId, answerId),
      eq(answerHelpfulVotes.userId, userId)
    ),
  });

  if (existing) {
    return { success: false, alreadyVoted: true };
  }

  // Insert vote and increment count atomically
  await db.transaction(async (tx) => {
    await tx.insert(answerHelpfulVotes).values({ answerId, userId });
    await tx
      .update(productAnswers)
      .set({
        helpfulCount: sql`${productAnswers.helpfulCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(productAnswers.id, answerId));
  });

  return { success: true, alreadyVoted: false };
}
