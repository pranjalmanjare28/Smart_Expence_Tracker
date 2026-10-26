require("dotenv").config();

module.exports = {
  earlyAccess: true,
  schema: "prisma/schema.prisma",
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/entp_db?schema=public",
    },
  },
};
