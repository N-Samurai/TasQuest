const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", // XAMPP の root パスワード（未設定なら空でOK）
  database: "task_app",
});

app.get("/tasks", (req, res) => {
  db.query("SELECT * FROM tasks", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

app.listen(3002, () => {
  console.log("API server running on http://localhost:3002");
});
// タスク追加API
app.post("/tasks", (req, res) => {
  const { title, description, linkTo } = req.body;
  if (!title) return res.status(400).json({ error: "タイトルが必要です" });

  const sql = "INSERT INTO tasks (title, description) VALUES (?, ?)";
  db.query(sql, [title, description], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    const newTaskId = result.insertId;

    if (linkTo) {
      // リンク用のテーブルがあると仮定
      const linkSql =
        "INSERT INTO task_links (source_id, target_id) VALUES (?, ?)";
      db.query(linkSql, [newTaskId, linkTo], (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });

        res.status(201).json({ id: newTaskId, title, description });
      });
    } else {
      res.status(201).json({ id: newTaskId, title, description });
    }
  });
});
