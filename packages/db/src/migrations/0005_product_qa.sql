CREATE TABLE "product_questions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "product_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "question" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "product_answers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "question_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "answer" text NOT NULL,
  "is_seller_answer" boolean DEFAULT false NOT NULL,
  "helpful_count" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "answer_helpful_votes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "answer_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "answer_helpful_votes_answer_user_idx" UNIQUE("answer_id", "user_id")
);

ALTER TABLE "product_questions" ADD CONSTRAINT "product_questions_product_id_products_id_fk"
  FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "product_questions" ADD CONSTRAINT "product_questions_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "product_answers" ADD CONSTRAINT "product_answers_question_id_product_questions_id_fk"
  FOREIGN KEY ("question_id") REFERENCES "public"."product_questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "product_answers" ADD CONSTRAINT "product_answers_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "answer_helpful_votes" ADD CONSTRAINT "answer_helpful_votes_answer_id_product_answers_id_fk"
  FOREIGN KEY ("answer_id") REFERENCES "public"."product_answers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "answer_helpful_votes" ADD CONSTRAINT "answer_helpful_votes_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

CREATE INDEX "product_questions_product_idx" ON "product_questions" USING btree ("product_id");
CREATE INDEX "product_questions_user_idx" ON "product_questions" USING btree ("user_id");
CREATE INDEX "product_answers_question_idx" ON "product_answers" USING btree ("question_id");
CREATE INDEX "product_answers_user_idx" ON "product_answers" USING btree ("user_id");
