import { PrismaClient } from "@prisma/client";


const prisma = new PrismaClient();
async function main() {
  console.log("🌱 Seeding database...");

  // Demo user
  const demoUser = await prisma.user.upsert({
    where: { id: "demo-user-id" },
    update: {},
    create: {
      id: "demo-user-id",
      name: "Butter Demo User",
      avatarUrl: "https://api.dicebear.com/7.x/personas/svg?seed=butter",
    },
  });

  console.log("✅ Created demo user:", demoUser.name);

  // Books
  const books = await Promise.all([
    prisma.book.upsert({
      where: { id: "book-1" },
      update: {},
      create: {
        id: "book-1",
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        cover:
          "https://covers.openlibrary.org/b/id/8432734-L.jpg",
        description:
          "A story of the fabulously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan, set in the Jazz Age on Long Island.",
        tags: ["Classic", "American Literature", "Jazz Age"],
        rating: 4.2,
        historicalContext:
          "Written in 1925, the novel is set during the Roaring Twenties and captures the excesses and moral decay of the era.",
        quote:
          "So we beat on, boats against the current, borne back ceaselessly into the past.",
      },
    }),
    prisma.book.upsert({
      where: { id: "book-2" },
      update: {},
      create: {
        id: "book-2",
        title: "To Kill a Mockingbird",
        author: "Harper Lee",
        cover:
          "https://covers.openlibrary.org/b/id/8228691-L.jpg",
        description:
          "The story of racial injustice and the loss of innocence in the American South, seen through the eyes of young Scout Finch.",
        tags: ["Classic", "Social Justice", "Coming of Age"],
        rating: 4.8,
        historicalContext:
          "Published in 1960, the novel addresses racial tension in the American South during the 1930s.",
        quote:
          "You never really understand a person until you consider things from his point of view.",
      },
    }),
    prisma.book.upsert({
      where: { id: "book-3" },
      update: {},
      create: {
        id: "book-3",
        title: "Beloved",
        author: "Toni Morrison",
        cover:
          "https://covers.openlibrary.org/b/id/8225984-L.jpg",
        description:
          "A powerful tale about the traumatic legacy of slavery in America, following Sethe and the ghost that haunts her home.",
        tags: ["African American Literature", "Historical Fiction", "Trauma"],
        rating: 4.5,
        historicalContext:
          "Set after the American Civil War, the novel explores the psychological wounds of slavery.",
        quote:
          "Definitions belong to the definers, not the defined.",
      },
    }),
    prisma.book.upsert({
      where: { id: "book-4" },
      update: {},
      create: {
        id: "book-4",
        title: "The Remains of the Day",
        author: "Kazuo Ishiguro",
        cover:
          "https://covers.openlibrary.org/b/id/8736571-L.jpg",
        description:
          "An English butler reflects on his years of service and the choices he made that led to a life of quiet regret.",
        tags: ["British Literature", "Memory", "Identity"],
        rating: 4.4,
        historicalContext:
          "Set in 1950s England, the novel looks back at pre-war aristocratic life and the coming of a new social order.",
        quote:
          "It is all too easy for a person to become so consumed with their professional role that they lose sight of their own humanity.",
      },
    }),
  ]);

  console.log(`✅ Created ${books.length} books`);

  // Reflections
  const reflections = await Promise.all([
    prisma.reflection.upsert({
      where: { id: "reflection-1" },
      update: {},
      create: {
        id: "reflection-1",
        title: "The Green Light and Unreachable Dreams",
        content:
          "Gatsby's green light across the bay is one of literature's most enduring symbols. It represents not just Daisy, but every dream we chase that stays just out of reach. Reading this book again as an adult, I feel the tragedy more acutely — the way hope can become its own prison.",
        author: "Elena Vasquez",
        authorAvatar: "https://api.dicebear.com/7.x/personas/svg?seed=elena",
        date: new Date("2024-03-15"),
        tags: ["Symbolism", "Dreams", "Loss"],
        bookId: "book-1",
      },
    }),
    prisma.reflection.upsert({
      where: { id: "reflection-2" },
      update: {},
      create: {
        id: "reflection-2",
        title: "Empathy as a Moral Act",
        content:
          "Atticus Finch taught me that empathy isn't passive — it's an active, courageous choice. To truly see another person's perspective requires you to be willing to be changed by what you see. This book shaped how I try to move through the world.",
        author: "James Okafor",
        authorAvatar: "https://api.dicebear.com/7.x/personas/svg?seed=james",
        date: new Date("2024-03-10"),
        tags: ["Empathy", "Justice", "Courage"],
        bookId: "book-2",
      },
    }),
  ]);

  console.log(`✅ Created ${reflections.length} reflections`);

  // Journal entries
  const journalEntries = await Promise.all([
    prisma.journalEntry.upsert({
      where: { id: "journal-1" },
      update: {},
      create: {
        id: "journal-1",
        userId: demoUser.id,
        date: new Date("2024-03-18"),
        content:
          "Finished Beloved tonight. I had to sit in silence for a long time afterward. Morrison's language moves like water and like stone at the same time — it carries you and crushes you. I keep thinking about the idea that love can become indistinguishable from harm.",
        prompt: "What emotion lingered after the last page?",
        mood: "Overwhelmed",
        intensity: 9,
      },
    }),
    prisma.journalEntry.upsert({
      where: { id: "journal-2" },
      update: {},
      create: {
        id: "journal-2",
        userId: demoUser.id,
        date: new Date("2024-03-14"),
        content:
          "Started The Remains of the Day. Stevens is so frustrating and so heartbreaking. He has organized his entire interior life around service and propriety, and somewhere along the way the person inside went quiet. Is that discipline, or erasure?",
        prompt: "Which character do you understand but wish you didn't?",
        mood: "Pensive",
        intensity: 6,
      },
    }),
    prisma.journalEntry.upsert({
      where: { id: "journal-3" },
      update: {},
      create: {
        id: "journal-3",
        userId: demoUser.id,
        date: new Date("2024-03-10"),
        content:
          "Re-reading Gatsby. I remember being assigned this in school and finding it shallow. Now the shallowness feels like the whole point — it's a novel about the hollowness at the center of the American story. Fitzgerald was writing tragedy and disguising it as glamour.",
        prompt: "What did this book mean to you then vs now?",
        mood: "Nostalgic",
        intensity: 5,
      },
    }),
  ]);

  console.log(`✅ Created ${journalEntries.length} journal entries`);

  // Emotion logs
  const emotionLogs = await Promise.all([
    prisma.emotionLog.upsert({
      where: { id: "emotion-1" },
      update: {},
      create: {
        id: "emotion-1",
        userId: demoUser.id,
        dateLabel: "Mon",
        intensity: 4,
        emotion: "Calm",
      },
    }),
    prisma.emotionLog.upsert({
      where: { id: "emotion-2" },
      update: {},
      create: {
        id: "emotion-2",
        userId: demoUser.id,
        dateLabel: "Tue",
        intensity: 6,
        emotion: "Curious",
      },
    }),
    prisma.emotionLog.upsert({
      where: { id: "emotion-3" },
      update: {},
      create: {
        id: "emotion-3",
        userId: demoUser.id,
        dateLabel: "Wed",
        intensity: 8,
        emotion: "Inspired",
      },
    }),
    prisma.emotionLog.upsert({
      where: { id: "emotion-4" },
      update: {},
      create: {
        id: "emotion-4",
        userId: demoUser.id,
        dateLabel: "Thu",
        intensity: 5,
        emotion: "Melancholy",
      },
    }),
    prisma.emotionLog.upsert({
      where: { id: "emotion-5" },
      update: {},
      create: {
        id: "emotion-5",
        userId: demoUser.id,
        dateLabel: "Fri",
        intensity: 9,
        emotion: "Awe",
      },
    }),
    prisma.emotionLog.upsert({
      where: { id: "emotion-6" },
      update: {},
      create: {
        id: "emotion-6",
        userId: demoUser.id,
        dateLabel: "Sat",
        intensity: 7,
        emotion: "Nostalgic",
      },
    }),
    prisma.emotionLog.upsert({
      where: { id: "emotion-7" },
      update: {},
      create: {
        id: "emotion-7",
        userId: demoUser.id,
        dateLabel: "Sun",
        intensity: 6,
        emotion: "Calm",
      },
    }),
  ]);

  console.log(`✅ Created ${emotionLogs.length} emotion logs`);
  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
