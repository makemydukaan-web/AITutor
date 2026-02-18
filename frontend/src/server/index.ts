import express from "express";
import cors from "cors";

import registerRoute from "./routes/auth/register.ts";

const app = express();


app.use(
  cors({
    origin: "https://aitutor-9cw.pages.dev", // your Cloudflare frontend
    credentials: true,                       // allow cookies
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json());

app.use("/auth", registerRoute);

app.get("/", (req, res) => {
  res.send("API running");
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
