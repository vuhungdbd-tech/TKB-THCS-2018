import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { store } from "./src/database/store";
import { runPreCheck } from "./src/scheduler/precheck";
import { solveTimetable } from "./src/scheduler/solver";
import { validateTimetable } from "./src/scheduler/validator";
import { processAIRequest } from "./src/gemini/assistant";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "TKB THCS 2018", version: "1.0.0" });
  });

  // Get full DB State
  app.get("/api/state", (req, res) => {
    res.json(store.getState());
  });

  // Reset to default
  app.post("/api/state/reset", (req, res) => {
    store.resetToDefaults();
    res.json({ success: true, message: "Đã khôi phục dữ liệu mẫu gốc" });
  });

  // Pre-check endpoint
  app.post("/api/scheduler/precheck", (req, res) => {
    const { weekId } = req.body;
    const state = store.getState();
    const result = runPreCheck(state, weekId || store.getCurrentWeek().id);
    res.json(result);
  });

  // Run Solver endpoint
  app.post("/api/scheduler/run", (req, res) => {
    const { weekId, strategy, maxIterations } = req.body;
    const targetWeekId = weekId || store.getCurrentWeek().id;
    const state = store.getState();

    const result = solveTimetable(state, targetWeekId, { strategy, maxIterations });

    if (result.version) {
      store.saveTimetableVersion(targetWeekId, result.version);
    }

    res.json(result);
  });

  // Validate current Timetable endpoint
  app.post("/api/scheduler/validate", (req, res) => {
    const { weekId, entries } = req.body;
    const targetWeekId = weekId || store.getCurrentWeek().id;
    const state = store.getState();
    const issues = validateTimetable(state, targetWeekId, entries);
    res.json({ issues, isValid: !issues.some(i => i.type === 'error') });
  });

  // Copy Week endpoint
  app.post("/api/scheduler/copy-week", (req, res) => {
    const { sourceWeekId, targetWeekId, options } = req.body;
    store.copyWeekData(sourceWeekId, targetWeekId, options);
    res.json({ success: true, message: `Đã sao chép dữ liệu từ ${sourceWeekId} sang ${targetWeekId}` });
  });

  // Gemini AI Assistant Chat endpoint
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, weekId } = req.body;
      const state = store.getState();
      const currentWeekId = weekId || store.getCurrentWeek().id;
      const weekName = state.weeks.find(w => w.id === currentWeekId)?.name || currentWeekId;

      const currentVer = store.getTimetableVersion(currentWeekId);
      const scheduledCount = currentVer?.score.scheduledPeriods || 0;
      const totalRequiredCount = currentVer?.score.totalRequiredPeriods || 0;
      const completionRate = currentVer?.score.completionRate || 0;

      const response = await processAIRequest(message, {
        weekName,
        totalClasses: state.classes.length,
        totalTeachers: state.teachers.length,
        scheduledCount,
        totalRequiredCount,
        completionRate,
        classes: state.classes.map(c => ({ code: c.code, name: c.name })),
        teachers: state.teachers.map(t => ({ code: t.code, name: t.fullName, mainSubject: t.department })),
      });

      res.json(response);
    } catch (err: any) {
      res.status(500).json({ answer: `Lỗi xử lý server AI: ${err.message}` });
    }
  });

  // Vite middleware in dev mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[TKB THCS 2018] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
