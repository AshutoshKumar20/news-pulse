import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { errorHandler } from "./lib/errors.js";
import clustersRouter from "./routes/clusters.js";
import ingestRouter from "./routes/ingest.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use(clustersRouter);
app.use(ingestRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`News Pulse API listening on port ${PORT}`));
