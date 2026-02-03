import app from "./app";
import { connectDB } from "./config/database.connection";
const PORT = process.env.PORT || 8008;
const startServer = async () => {
    try {
        // Connect to the database
        await connectDB();
        // Start the server
        app.listen(PORT, () => {
            console.log(`Server is running on port http://localhost:${PORT}`);
        });
    }
    catch (error) {
        console.error("Failed to start server:", error);
    }
};
startServer();
