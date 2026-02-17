import express from "express";
import cors from "cors";

import registerRoutes from "./routes/auth/register/route.ts";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", registerRoute);

app.get("/", (req, res) => {
  res.send("API running");
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
