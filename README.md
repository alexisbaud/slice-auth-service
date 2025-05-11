# auth-service

Handles user authentication (signup, login, logout, account deletion) and JWT management.

## Stack
- TypeScript
- Hono
- Zod (validation)
- Drizzle ORM (PostgreSQL)
- PostgreSQL LISTEN/NOTIFY for events
- Pino (logger)

## Environment Variables

Refer to `.env.example` for required environment variables.

## API Endpoints

| Method | Path           | Description                                                                 | Authentication | Request Body                       | Success Response                     | Error Responses                    |
|--------|----------------|-----------------------------------------------------------------------------|----------------|------------------------------------|--------------------------------------|------------------------------------|
| POST   | /signup        | Registers a new user.                                                       | None           | `AuthCredentials`                  | `201 Created` + User info (e.g. ID)  | `400 Bad Request`, `409 Conflict`  |
| POST   | /login         | Logs in an existing user.                                                   | None           | `AuthCredentials`                  | `200 OK` + `AuthTokens`              | `400 Bad Request`, `401 Unauthorized`|
| POST   | /logout        | Logs out the current user (client-side token invalidation).                 | JWT            | None                               | `204 No Content`                     | `401 Unauthorized`                 |
| GET    | /me            | Retrieves the authenticated user's basic information (ID, email).           | JWT            | None                               | `200 OK` + User info (ID, email)   | `401 Unauthorized`                 |
| DELETE | /account       | Deletes the authenticated user's account.                                   | JWT            | None                               | `204 No Content`                     | `401 Unauthorized`                 |
| GET    | /healthz       | Health check endpoint.                                                      | None           | None                               | `200 OK` + `{ "status": "ok" }`   | -                                  |

## Events Published

- `auth_user_registered`: Published via PostgreSQL NOTIFY when a new user signs up.
  - Payload: `{ "userId": "<uuid>", "email": "<user_email>", "timestamp": "<iso8601>" }`
- `auth_user_deleted`: Published via PostgreSQL NOTIFY when a user deletes their account.
  - Payload: `{ "userId": "<uuid>", "timestamp": "<iso8601>" }`

## Database Schema

- `users` table: Stores user credentials and basic information (`id`, `email`, `hashedPassword`, `createdAt`, `updatedAt`).

## Setup & Running Locally

1.  Install dependencies: `npm install`
2.  Set up your PostgreSQL database and update `.env` with `DATABASE_URL`.
3.  Generate a `JWT_SECRET` and add it to `.env`.
4.  Run Drizzle migrations: `npm run migrate` (You'll need to define this script and install `drizzle-kit`)
5.  Start the service: `npm run dev` (You'll need to define this script)

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

## Deployment

This service is designed to be easily deployable on platforms like Railway. Ensure your environment variables are set up in the Railway service configuration. 