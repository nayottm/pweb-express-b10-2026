import { Router } from "express";
import { getAllSkins, getSkinDetail } from "../controllers/skin.controller.js";

const router = Router();

router.get("/", getAllSkins);
router.get("/:skin_id", getSkinDetail);

export default router;

