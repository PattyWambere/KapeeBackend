import { students } from "../data/students.data.js";
export const home = (req, res) => {
    res.send("Welcome to the Student Management System API");
};
export const getStudents = (req, res) => {
    res.json(students);
};
export const getStudentById = (req, res) => {
    const id = Number(req.params.id);
    const student = students.find(s => s.id === id);
    if (student) {
        res.json(student);
    }
    else {
        res.status(404).send("Student not found");
    }
};
export const createStudent = (req, res) => {
    const { name, age, grade } = req.body;
    if (!name || !age || !grade) {
        return res.status(400).send("All fields are required");
    }
    const newStudent = {
        id: students.length + 1,
        name,
        age,
        grade
    };
    students.push(newStudent);
    res.status(201).json({
        message: "Student created successfully",
        student: newStudent
    });
};
