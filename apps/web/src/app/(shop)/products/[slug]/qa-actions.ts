"use server";

import { auth } from "@/lib/auth";
import type { AskQuestionInput, AnswerQuestionInput } from "@amazone/reviews";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function submitQuestion(
  input: AskQuestionInput
): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to ask a question." };
  }

  try {
    const { askQuestion } = await import("@amazone/reviews");
    await askQuestion(session.user.id, input);
    return { success: true, data: undefined };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to submit question.";
    return { success: false, error: message };
  }
}

export async function submitAnswer(
  input: AnswerQuestionInput
): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to answer a question." };
  }

  try {
    const { answerQuestion } = await import("@amazone/reviews");
    await answerQuestion(session.user.id, input);
    return { success: true, data: undefined };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to submit answer.";
    return { success: false, error: message };
  }
}

export async function voteAnswerHelpful(
  answerId: string
): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to vote." };
  }

  try {
    const { markAnswerHelpful } = await import("@amazone/reviews");
    const result = await markAnswerHelpful(answerId, session.user.id);

    if (result.alreadyVoted) {
      return { success: false, error: "You have already voted this answer as helpful." };
    }

    return { success: true, data: undefined };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to record vote.";
    return { success: false, error: message };
  }
}
