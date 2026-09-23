import { Router } from "express";
import { pool } from "../db.js";
import { ApiError } from "../lib/errors.js";

const router = Router();

function parseSourceFilter(raw) {
  if (!raw) return null;
  const list = String(raw).split(",").map((s) => s.trim()).filter(Boolean);
  return list.length ? list : null;
}

router.get("/clusters", async (req, res, next) => {
  try {
    const sources = parseSourceFilter(req.query.sources);
    const params = [];
    let sourceClause = "";
    if (sources) {
      params.push(sources);
      sourceClause = "AND a.source = ANY($1)";
    }

    const { rows } = await pool.query(
      `
      SELECT c.id, c.label,
             COUNT(a.id)::int AS article_count,
             MIN(a.published_at) AS start_time,
             MAX(a.published_at) AS end_time
      FROM clusters c
      JOIN articles a ON a.cluster_id = c.id
      WHERE 1=1 ${sourceClause}
      GROUP BY c.id, c.label
      HAVING COUNT(a.id) > 0
      ORDER BY end_time DESC NULLS LAST
      `,
      params
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get("/clusters/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new ApiError(400, "Cluster id must be a number");

    const clusterResult = await pool.query(
      "SELECT id, label, keywords FROM clusters WHERE id = $1",
      [id]
    );
    if (clusterResult.rows.length === 0) throw new ApiError(404, "Cluster not found");

    const articlesResult = await pool.query(
      `SELECT id, source, title, link, summary, published_at
       FROM articles WHERE cluster_id = $1
       ORDER BY published_at ASC NULLS LAST`,
      [id]
    );

    res.json({ ...clusterResult.rows[0], articles: articlesResult.rows });
  } catch (err) {
    next(err);
  }
});

router.get("/timeline", async (req, res, next) => {
  try {
    const sources = parseSourceFilter(req.query.sources);
    const params = [];
    let sourceClause = "";
    if (sources) {
      params.push(sources);
      sourceClause = "AND a.source = ANY($1)";
    }

    const { rows } = await pool.query(
      `
      SELECT c.id, c.label,
             COUNT(a.id)::int AS article_count,
             MIN(a.published_at) AS start_time,
             MAX(a.published_at) AS end_time
      FROM clusters c
      JOIN articles a ON a.cluster_id = c.id
      WHERE 1=1 ${sourceClause}
      GROUP BY c.id, c.label
      HAVING COUNT(a.id) > 0
      ORDER BY start_time ASC NULLS LAST
      `,
      params
    );

    const maxCount = Math.max(1, ...rows.map((r) => r.article_count));
    const timeline = rows.map((r) => ({
      id: r.id,
      label: r.label,
      start_time: r.start_time,
      end_time: r.end_time,
      article_count: r.article_count,
      intensity: Number((r.article_count / maxCount).toFixed(2)),
    }));

    res.json(timeline);
  } catch (err) {
    next(err);
  }
});

router.get("/sources", async (req, res, next) => {
  try {
    const { rows } = await pool.query("SELECT DISTINCT source FROM articles ORDER BY source");
    res.json(rows.map((r) => r.source));
  } catch (err) {
    next(err);
  }
});

export default router;
