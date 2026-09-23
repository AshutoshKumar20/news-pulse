import { spawn } from "child_process";
import path from "path";
import { Router } from "express";
import { pool } from "../db.js";
import { ApiError } from "../lib/errors.js";

const router = Router();

router.post("/ingest/trigger", async (req, res, next) => {
  try {
    const jobResult = await pool.query(
      "INSERT INTO ingest_jobs (status) VALUES ('running') RETURNING id"
    );
    const jobId = jobResult.rows[0].id;

    runPipeline(jobId);

    res.status(202).json({ jobId, status: "running" });
  } catch (err) {
    next(err);
  }
});

router.get("/ingest/status/:jobId", async (req, res, next) => {
  try {
    const jobId = Number(req.params.jobId);
    if (!Number.isInteger(jobId)) throw new ApiError(400, "jobId must be a number");

    const { rows } = await pool.query("SELECT * FROM ingest_jobs WHERE id = $1", [jobId]);
    if (rows.length === 0) throw new ApiError(404, "Job not found");

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

function extractNumber(text, label) {
  const match = text.match(new RegExp(`${label}: (\\d+)`));
  return match ? Number(match[1]) : null;
}

function runPipeline(jobId) {
  const scraperDir = path.resolve(process.env.SCRAPER_DIR || "../scraper");
  const entry = process.env.SCRAPER_ENTRY || "pipeline.py";
  const pythonPath = process.env.PYTHON_PATH || "python3";

  const child = spawn(pythonPath, [entry], { cwd: scraperDir });

  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => (stdout += chunk));
  child.stderr.on("data", (chunk) => (stderr += chunk));

  child.on("close", async (code) => {
    const added = extractNumber(stdout, "Articles added");
    const clusterCount = extractNumber(stdout, "Clusters formed");

    if (code === 0) {
      await pool.query(
        `UPDATE ingest_jobs
         SET status = 'done', finished_at = now(), articles_added = $1, clusters_created = $2
         WHERE id = $3`,
        [added || 0, clusterCount || 0, jobId]
      );
    } else {
      await pool.query(
        `UPDATE ingest_jobs SET status = 'failed', finished_at = now(), error = $1 WHERE id = $2`,
        [stderr.slice(0, 2000) || `Process exited with code ${code}`, jobId]
      );
    }
  });

  child.on("error", async (err) => {
    await pool.query(
      `UPDATE ingest_jobs SET status = 'failed', finished_at = now(), error = $1 WHERE id = $2`,
      [err.message, jobId]
    );
  });
}

export default router;
