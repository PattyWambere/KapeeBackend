import { Request, Response } from 'express';
import { userModel } from '../models/user.model';

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management APIs (Admin only)
 */

/**
 * @swagger
 * /api/users/getUsers:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *                   email:
 *                     type: string
 *                   role:
 *                     type: string
 *                     enum: [admin, vendor, customer]
 *                   createdAt:
 *                     type: string
 *                   updatedAt:
 *                     type: string
 *       401:
 *         description: Unauthorized
 */


/**
 * @swagger
 * /api/users/upload-avatar:
 *   post:
 *     summary: Upload user avatar
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 avatar:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: No file uploaded
 *       500:
 *         description: Upload failed
 */
export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const avatarUrl = req.file.path; // Cloudinary URL

    const user = await userModel.findByIdAndUpdate(
      userId,
      { avatar: avatarUrl },
      { new: true }
    );

    res.json({ message: "Avatar uploaded successfully", avatar: avatarUrl, user });
  } catch (error) {
    console.error("Upload avatar error:", error);
    res.status(500).json({ message: "Upload failed" });
  }
};

export const getUsers = async (_req: Request, res: Response) => {
  const users = await userModel.find().select("-password");
  res.json(users);
};

/**
 * @swagger
 * /api/users/updateUser/{id}:
 *   put:
 *     summary: Update a user (Admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, vendor, customer]
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */
export const updateUser = async (req: Request, res: Response) => {
  const user = await userModel
    .findByIdAndUpdate(req.params.id, req.body, { new: true })
    .select("-password");

  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
};

/**
 * @swagger
 * /api/users/deleteUser/{id}:
 *   delete:
 *     summary: Delete a user (Admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       204:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */
export const deleteUser = async (req: Request, res: Response) => {
  await userModel.findByIdAndDelete(req.params.id);
  res.status(204).send();
};
