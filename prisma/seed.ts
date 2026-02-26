import { PrismaClient, Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin User",
      password: adminPassword,
      role: Role.ADMIN,
    },
  });
  console.log("Admin user:", admin.email);

  // Create editor user
  const editorPassword = await bcrypt.hash("editor123!", 12);
  const editor = await prisma.user.upsert({
    where: { email: "editor@example.com" },
    update: {},
    create: {
      email: "editor@example.com",
      name: "Editor User",
      password: editorPassword,
      role: Role.EDITOR,
    },
  });
  console.log("Editor user:", editor.email);

  // Create categories
  const gettingStarted = await prisma.category.upsert({
    where: { slug: "getting-started" },
    update: {},
    create: {
      name: "Getting Started",
      slug: "getting-started",
      order: 1,
    },
  });

  const tutorials = await prisma.category.upsert({
    where: { slug: "tutorials" },
    update: {},
    create: {
      name: "Tutorials",
      slug: "tutorials",
      order: 2,
    },
  });

  const faq = await prisma.category.upsert({
    where: { slug: "faq" },
    update: {},
    create: {
      name: "FAQ",
      slug: "faq",
      order: 3,
    },
  });

  console.log("Categories created:", gettingStarted.name, tutorials.name, faq.name);

  // Create tags
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { slug: "beginner" },
      update: {},
      create: { name: "Beginner", slug: "beginner" },
    }),
    prisma.tag.upsert({
      where: { slug: "advanced" },
      update: {},
      create: { name: "Advanced", slug: "advanced" },
    }),
    prisma.tag.upsert({
      where: { slug: "tutorial" },
      update: {},
      create: { name: "Tutorial", slug: "tutorial" },
    }),
  ]);

  console.log("Tags created:", tags.map((t) => t.name).join(", "));

  // Create a sample article
  const sampleContent = `<h2>Welcome to the Support Portal</h2>
<p>This is a sample article to help you get started with our knowledge base. You can find answers to common questions, tutorials, and guides here.</p>
<h3>How to Use This Portal</h3>
<ul>
  <li>Use the <strong>search bar</strong> to find articles quickly</li>
  <li>Browse by <strong>category</strong> to explore related topics</li>
  <li>Filter by <strong>tags</strong> to narrow down results</li>
  <li>Leave <strong>feedback</strong> on articles to help us improve</li>
</ul>
<h3>Getting Help</h3>
<p>If you can't find what you're looking for, you can leave a comment on any article and our team will respond as soon as possible.</p>`;

  const article = await prisma.article.upsert({
    where: { slug: "welcome-to-support-portal" },
    update: {},
    create: {
      title: "Welcome to the Support Portal",
      slug: "welcome-to-support-portal",
      content: sampleContent,
      excerpt: "A guide to help you get started with our knowledge base and support portal.",
      status: "PUBLISHED",
      publishedAt: new Date(),
      authorId: admin.id,
      categoryId: gettingStarted.id,
      tags: {
        create: [
          { tag: { connect: { id: tags[0].id } } },
        ],
      },
    },
  });

  console.log("Sample article created:", article.title);

  // Create initial version (idempotent)
  await prisma.articleVersion.upsert({
    where: { articleId_versionNumber: { articleId: article.id, versionNumber: 1 } },
    update: {},
    create: {
      articleId: article.id,
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
      authorId: admin.id,
      versionNumber: 1,
      changeNote: "Initial version",
    },
  });

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
