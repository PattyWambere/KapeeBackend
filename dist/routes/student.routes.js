// filepath: c:\Users\Pattywrld\Documents\kLabNodeJs\src\routes\student.routes.ts
import { Router } from "express";
import { home, getStudents, getStudentById, createStudent } from "../controllers/students.controller.js";
const router = Router();
router.get("/", home);
router.get("/all", getStudents);
router.get("/:id", getStudentById);
router.post("/create", createStudent);
export const studentRoutes = router;
