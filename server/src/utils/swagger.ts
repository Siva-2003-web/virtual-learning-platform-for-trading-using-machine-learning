import { Express } from "express";
import swaggerUi from "swagger-ui-express";
import path from "path";
const version = "1.0.0";

export function swaggerDocs(app: Express, port: number) {
	try {
        // Enforce a static path for the generated swagger file
        const swaggerFilePath = path.join(__dirname, "..", "swagger-output.json");
        
        // Try to require the file (it must exist in src for it to be moved to dist)
        const swaggerDocument = require(swaggerFilePath);
        
        app.use(
            "/api/docs",
            swaggerUi.serve,
            swaggerUi.setup(swaggerDocument, {
                swaggerOptions: { persistAuthorization: true },
            })
        );
        console.log(`[OK] Swagger docs loaded at http://localhost:${port}/api/docs`);
    } catch (error) {
        console.warn("[SKIP] Swagger documentation could not be loaded. (Normal in production)");
    }
}
