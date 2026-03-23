import express from "express";
import cors from "cors";

import booksRouter from "./routes/books";
import reflectionsRouter from "./routes/reflections";
import journalRouter from "./routes/journal";
import emotionsRouter from "./routes/emotions";
import insightsRouter from "./routes/insights";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/books", booksRouter);
app.use("/api/reflections", reflectionsRouter);
app.use("/api/journal", journalRouter);
app.use("/api/emotions", emotionsRouter);
app.use("/api/insights", insightsRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
