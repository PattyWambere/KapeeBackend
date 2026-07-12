import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { logger } from "./middleware/logger.middleware";
import categoryRoutes from "./routes/category.routes";
import productRoutes from "./routes/product.routes";
import cartRoutes from "./routes/cart.routes";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import orderRoutes from "./routes/order.routes";
import reviewRouters from "./routes/review.routes"
import settingsRoutes from "./routes/settings.routes";
import paymentRoutes from "./routes/payment.routes";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger";

dotenv.config();

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL || 'https://kapee-frontend-auw5.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json());
app.use(logger);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));//

// console.log("Swagger docs available at /api-docs", swaggerSpec);
app.use("/api/categories/", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRouters)
app.use("/api/settings", settingsRoutes);
app.use("/api/payments", paymentRoutes);

export default app;