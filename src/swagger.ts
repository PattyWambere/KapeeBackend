import swaggerJSDoc from "swagger-jsdoc";
import express from "express";

const router = express.Router();

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "E-Commerce API",
      version: "1.0.0",
      description: "API for managing categories, products, cart, and users",
    },

    servers: [
      {
        url: "http://localhost:8008",
        description: "Local server",
      },
    ],

    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },

    security: [
      {
        BearerAuth: [],
      },
    ],
  },

  apis: [
    "./src/routes/*.ts",
    "./src/controllers/*.ts",
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export { swaggerSpec, router };