import { Router } from "express";
const router = Router();

router.post("/register", async (req, res) => {
  try {
    const body = req.body;

    // your existing logic here
    // prisma / bcrypt / etc works normally here

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
