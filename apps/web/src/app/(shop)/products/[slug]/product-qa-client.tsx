"use client";

import { useState, useTransition, useOptimistic } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  askQuestionSchema,
  answerQuestionSchema,
  type AskQuestionInput,
  type QuestionWithAnswers,
  type AnswerWithUser,
} from "@amazone/reviews";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Loader2,
  MessageSquare,
  Store,
  ThumbsUp,
  User,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { submitQuestion, submitAnswer, voteAnswerHelpful } from "./qa-actions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatQADate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function getFirstName(fullName: string): string {
  return fullName.split(" ")[0] ?? fullName;
}

// ─── Ask Question Form ─────────────────────────────────────────────────────────

interface AskQuestionFormProps {
  productId: string;
  onSuccess: (question: QuestionWithAnswers) => void;
}

function AskQuestionForm({
  productId,
  onSuccess,
}: AskQuestionFormProps): React.ReactElement {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AskQuestionInput>({
    resolver: zodResolver(askQuestionSchema),
    defaultValues: { productId, question: "" },
  });

  function onSubmit(data: AskQuestionInput): void {
    startTransition(async () => {
      const result = await submitQuestion(data);
      if (result.success) {
        toast.success("Your question has been submitted!");
        // Build an optimistic question to show immediately
        const optimisticQuestion: QuestionWithAnswers = {
          id: crypto.randomUUID(),
          productId,
          userId: session!.user!.id!,
          question: data.question,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: { id: session!.user!.id!, name: session!.user!.name ?? "You" },
          answers: [],
        };
        onSuccess(optimisticQuestion);
        reset();
        setIsOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  if (status === "loading") {
    return <div className="h-10" />;
  }

  if (!session?.user) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-center">
        <p className="text-sm text-muted-foreground">
          <Link
            href="/sign-in"
            className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Sign in
          </Link>{" "}
          to ask a question
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full justify-between sm:w-auto"
        aria-expanded={isOpen}
        aria-controls="ask-question-form"
      >
        <HelpCircle className="mr-2 h-4 w-4" />
        Ask a Question
        {isOpen ? (
          <ChevronUp className="ml-2 h-4 w-4" />
        ) : (
          <ChevronDown className="ml-2 h-4 w-4" />
        )}
      </Button>

      {isOpen && (
        <Card id="ask-question-form">
          <CardHeader>
            <CardTitle className="text-lg">Ask a Question</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate
            >
              <div className="space-y-2">
                <label
                  htmlFor="question-text"
                  className="text-sm font-medium leading-none"
                >
                  Your Question{" "}
                  <span className="text-destructive">*</span>
                </label>
                <Textarea
                  id="question-text"
                  placeholder="What would you like to know about this product?"
                  maxLength={1000}
                  rows={3}
                  {...register("question")}
                  aria-invalid={!!errors.question}
                  aria-describedby={
                    errors.question ? "question-error" : undefined
                  }
                />
                {errors.question && (
                  <p id="question-error" className="text-sm text-destructive">
                    {errors.question.message}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={isPending}>
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Submit Question
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    reset();
                    setIsOpen(false);
                  }}
                  disabled={isPending}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Answer Form ──────────────────────────────────────────────────────────────

interface AnswerFormProps {
  questionId: string;
  userId: string;
  sellerId: string;
  onSuccess: (answer: AnswerWithUser) => void;
  onCancel: () => void;
}

function AnswerForm({
  questionId,
  userId,
  sellerId,
  onSuccess,
  onCancel,
}: AnswerFormProps): React.ReactElement {
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const isSeller = session?.user?.id === sellerId;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(answerQuestionSchema),
    defaultValues: { questionId, answer: "", isSeller: isSeller as boolean },
  });

  function onSubmit(data: { questionId: string; answer: string; isSeller: boolean }): void {
    startTransition(async () => {
      const result = await submitAnswer({ ...data, isSeller });
      if (result.success) {
        toast.success("Your answer has been submitted!");
        const optimisticAnswer: AnswerWithUser = {
          id: crypto.randomUUID(),
          questionId,
          userId,
          answer: data.answer,
          isSellerAnswer: isSeller,
          helpfulCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: userId,
            name: session?.user?.name ?? "You",
          },
        };
        onSuccess(optimisticAnswer);
        reset();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-3 space-y-3"
      noValidate
    >
      <div className="space-y-2">
        <Textarea
          placeholder="Write your answer..."
          maxLength={2000}
          rows={3}
          {...register("answer")}
          aria-label="Your answer"
          aria-invalid={!!errors.answer}
          aria-describedby={errors.answer ? "answer-error" : undefined}
        />
        {errors.answer && (
          <p id="answer-error" className="text-sm text-destructive">
            {errors.answer.message}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSeller ? "Answer as Seller" : "Submit Answer"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ─── Answer Item ──────────────────────────────────────────────────────────────

interface AnswerItemProps {
  answer: AnswerWithUser;
  currentUserId: string | undefined;
}

function AnswerItem({
  answer,
  currentUserId,
}: AnswerItemProps): React.ReactElement {
  const [isPending, startTransition] = useTransition();
  const [optimisticHelpful, addOptimisticHelpful] = useOptimistic(
    answer.helpfulCount,
    (current: number) => current + 1
  );
  const [hasVoted, setHasVoted] = useState(false);

  function handleHelpful(): void {
    if (!currentUserId || hasVoted) return;
    startTransition(async () => {
      addOptimisticHelpful(1);
      const result = await voteAnswerHelpful(answer.id);
      if (result.success) {
        setHasVoted(true);
      } else {
        // If already voted server-side but not locally reflected
        if (result.error.includes("already voted")) {
          setHasVoted(true);
        } else {
          toast.error(result.error);
        }
      }
    });
  }

  return (
    <div className="rounded-md bg-muted/40 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            {answer.isSellerAnswer ? (
              <Badge
                variant="secondary"
                className="gap-1 border-amber-200 bg-amber-50 text-amber-700"
              >
                <Store className="h-3 w-3" />
                Seller
              </Badge>
            ) : (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                <span>{getFirstName(answer.user.name)}</span>
              </div>
            )}
            <span className="text-xs text-muted-foreground">
              {formatQADate(answer.createdAt)}
            </span>
          </div>
          <p className="text-sm leading-relaxed">{answer.answer}</p>
        </div>
      </div>

      {/* Helpful button */}
      <div className="mt-2 flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Helpful?</span>
        <button
          type="button"
          onClick={handleHelpful}
          disabled={!currentUserId || hasVoted || isPending}
          aria-label={`Mark answer as helpful. ${optimisticHelpful} people found this helpful.`}
          className="flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ThumbsUp className="h-3 w-3" />
          <span>{optimisticHelpful}</span>
        </button>
      </div>
    </div>
  );
}

// ─── Question Item ─────────────────────────────────────────────────────────────

interface QuestionItemProps {
  question: QuestionWithAnswers;
  sellerId: string;
  currentUserId: string | undefined;
  onAnswerAdded: (questionId: string, answer: AnswerWithUser) => void;
}

function QuestionItem({
  question,
  sellerId,
  currentUserId,
  onAnswerAdded,
}: QuestionItemProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(
    // Auto-expand if there are answers
    question.answers.length > 0
  );
  const [isAnswering, setIsAnswering] = useState(false);

  const answerCount = question.answers.length;
  const hasAnswers = answerCount > 0;

  return (
    <article
      className="space-y-3 rounded-lg border p-4"
      aria-label={`Question: ${question.question}`}
    >
      {/* Question header */}
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
          aria-hidden="true"
        >
          <MessageSquare className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="font-medium leading-snug">{question.question}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Asked by{" "}
            <span className="font-medium">
              {getFirstName(question.user.name)}
            </span>{" "}
            &middot; {formatQADate(question.createdAt)}
          </p>
        </div>

        {hasAnswers && (
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
            className="flex items-center gap-1 rounded-sm text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {answerCount} {answerCount === 1 ? "answer" : "answers"}
            {isExpanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        )}
      </div>

      {/* Answers */}
      {isExpanded && hasAnswers && (
        <div className="ml-11 space-y-2" role="list" aria-label="Answers">
          {question.answers.map((answer) => (
            <div key={answer.id} role="listitem">
              <AnswerItem answer={answer} currentUserId={currentUserId} />
            </div>
          ))}
        </div>
      )}

      {/* No answers placeholder */}
      {!hasAnswers && (
        <p className="ml-11 text-xs text-muted-foreground">
          No answers yet. Be the first to answer!
        </p>
      )}

      {/* Answer form toggle */}
      {currentUserId && !isAnswering && (
        <div className="ml-11">
          <button
            type="button"
            onClick={() => setIsAnswering(true)}
            className="text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Answer this question
          </button>
        </div>
      )}

      {isAnswering && currentUserId && (
        <div className="ml-11">
          <AnswerForm
            questionId={question.id}
            userId={currentUserId}
            sellerId={sellerId}
            onSuccess={(answer) => {
              onAnswerAdded(question.id, answer);
              setIsAnswering(false);
              setIsExpanded(true);
            }}
            onCancel={() => setIsAnswering(false)}
          />
        </div>
      )}
    </article>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

interface ProductQAClientProps {
  productId: string;
  sellerId: string;
  initialQuestions: QuestionWithAnswers[];
  initialTotal: number;
  pageSize: number;
}

export function ProductQAClient({
  productId,
  sellerId,
  initialQuestions,
  initialTotal,
  pageSize,
}: ProductQAClientProps): React.ReactElement {
  const { data: session } = useSession();
  const router = useRouter();
  const [questions, setQuestions] = useState<QuestionWithAnswers[]>(initialQuestions);
  const [total, setTotal] = useState(initialTotal);
  const [isLoadingMore, startLoadMore] = useTransition();

  const currentUserId = session?.user?.id ?? undefined;
  const hasMore = questions.length < total;

  function handleQuestionAdded(newQuestion: QuestionWithAnswers): void {
    setQuestions((prev) => [newQuestion, ...prev]);
    setTotal((prev) => prev + 1);
    router.refresh();
  }

  function handleAnswerAdded(questionId: string, answer: AnswerWithUser): void {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? { ...q, answers: [...q.answers, answer] }
          : q
      )
    );
    router.refresh();
  }

  function loadMore(): void {
    startLoadMore(async () => {
      try {
        const { getProductQuestions } = await import("@amazone/reviews");
        const result = await getProductQuestions(
          productId,
          pageSize,
          questions.length
        );
        setQuestions((prev) => {
          // Deduplicate by id in case optimistic items overlap
          const existingIds = new Set(prev.map((q) => q.id));
          const newItems = result.questions.filter(
            (q) => !existingIds.has(q.id)
          );
          return [...prev, ...newItems];
        });
        setTotal(result.total);
      } catch {
        toast.error("Failed to load more questions.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Ask a question */}
      <AskQuestionForm
        productId={productId}
        onSuccess={handleQuestionAdded}
      />

      <Separator />

      {/* Question list */}
      {questions.length === 0 ? (
        <div className="py-8 text-center">
          <HelpCircle className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">No questions yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Be the first to ask a question about this product.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {questions.map((question) => (
              <QuestionItem
                key={question.id}
                question={question}
                sellerId={sellerId}
                currentUserId={currentUserId}
                onAnswerAdded={handleAnswerAdded}
              />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={isLoadingMore}
                aria-label="Load more questions"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  `See more questions (${total - questions.length} remaining)`
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
