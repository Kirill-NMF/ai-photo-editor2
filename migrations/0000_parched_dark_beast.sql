CREATE TABLE "edits" (
	"id" serial PRIMARY KEY NOT NULL,
	"image_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"prompt" text NOT NULL,
	"result_url" text NOT NULL,
	"thumbnail_url" text,
	"saved_image_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "images" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"project_id" integer,
	"parent_image_id" integer,
	"is_original" integer DEFAULT 1 NOT NULL,
	"original_url" text NOT NULL,
	"current_url" text NOT NULL,
	"thumbnail_url" text,
	"file_name" varchar NOT NULL,
	"file_size" integer NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"name" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"telegram_id" varchar,
	"telegram_username" varchar,
	"api_requests_count" integer DEFAULT 0 NOT NULL,
	"api_requests_reset_date" timestamp,
	"promo_code_used" boolean DEFAULT false NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_telegram_id_unique" UNIQUE("telegram_id")
);
--> statement-breakpoint
ALTER TABLE "edits" ADD CONSTRAINT "edits_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edits" ADD CONSTRAINT "edits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edits" ADD CONSTRAINT "edits_saved_image_id_images_id_fk" FOREIGN KEY ("saved_image_id") REFERENCES "public"."images"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_parent_image_id_images_id_fk" FOREIGN KEY ("parent_image_id") REFERENCES "public"."images"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "edits_image_id_idx" ON "edits" USING btree ("image_id");--> statement-breakpoint
CREATE INDEX "edits_user_id_idx" ON "edits" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "edits_saved_image_id_idx" ON "edits" USING btree ("saved_image_id");--> statement-breakpoint
CREATE INDEX "edits_image_id_created_at_idx" ON "edits" USING btree ("image_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "edits_user_id_created_at_idx" ON "edits" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "images_user_id_idx" ON "images" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "images_project_id_idx" ON "images" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "images_parent_id_idx" ON "images" USING btree ("parent_image_id");--> statement-breakpoint
CREATE INDEX "images_user_id_created_at_idx" ON "images" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "images_project_id_created_at_idx" ON "images" USING btree ("project_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "projects_user_id_idx" ON "projects" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "projects_user_id_created_at_idx" ON "projects" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");