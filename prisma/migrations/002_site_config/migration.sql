-- CreateTable: SiteConfig (single-row configuration)
CREATE TABLE "site_config" (
  "id"                       TEXT      NOT NULL DEFAULT 'default',
  "siteName"                 TEXT      NOT NULL DEFAULT 'Support Portal',
  "siteDescription"          TEXT,
  "allowRegistration"        BOOLEAN   NOT NULL DEFAULT true,
  "defaultRole"              "Role"    NOT NULL DEFAULT 'VIEWER',
  "commentsEnabled"          BOOLEAN   NOT NULL DEFAULT true,
  "commentsRequireApproval"  BOOLEAN   NOT NULL DEFAULT true,
  "anonymousCommentsEnabled" BOOLEAN   NOT NULL DEFAULT true,
  "articlesPerPage"          INTEGER   NOT NULL DEFAULT 10,
  "showAuthor"               BOOLEAN   NOT NULL DEFAULT true,
  "updatedAt"                TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "site_config_pkey" PRIMARY KEY ("id")
);

-- Seed the default row so it always exists
INSERT INTO "site_config" ("id", "updatedAt") VALUES ('default', NOW()) ON CONFLICT DO NOTHING;
