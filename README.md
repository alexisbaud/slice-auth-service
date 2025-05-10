# Slice Microservice Template

A generic Node.js + TypeScript starter template for microservices in the Slice MSv2 project, designed for deployment on Railway.

## Project Structure

```
.
├── src/
│   ├── index.ts        # Main entry point, Hono app initialization
│   ├── routes/         # Route handlers
│   │   └── example.ts  # Example route
│   ├── middleware/     # Custom middleware
│   │   └── logger.ts   # Request logger middleware
│   ├── utils/          # Utility functions
│   │   └── logger.ts   # Simple console logger
│   └── types/          # Shared TypeScript types for the service
│       └── index.ts    # Main types file
├── .env.example        # Example environment variables
├── package.json        # Project dependencies and scripts
├── tsconfig.json       # TypeScript compiler options
└── README.md           # This file
```

## Available Scripts

In the project directory, you can run:

### `npm install`

Installs the project dependencies.

### `npm run dev`

Runs the app in development mode using `tsx` for hot-reloading.
The service will be available at `http://localhost:PORT` (default PORT is 3000, can be changed in `.env`).

### `npm run build`

Builds the app for production to the `dist` folder.

### `npm run start`

Runs the compiled app from the `dist` folder.

## Environment Variables

Create a `.env` file in the root of this service (by copying `.env.example`) and define the following variables:

- `PORT`: The port the server will listen on (default: `3000`).

## Deployment

This service is designed to be easily deployable on platforms like Railway. Ensure your environment variables are set up in the Railway service configuration. 