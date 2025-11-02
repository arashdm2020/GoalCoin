# GoalCoin

**Coin of the People**

This repository contains the source code for the GoalCoin project, a platform designed to integrate cryptocurrency with personal goals. This initial version includes a responsive frontend, a secure backend, and wallet connection capabilities.

## Tech Stack

### Backend
- **Runtime:** Node.js 20
- **Framework:** Express.js with TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Security:** Helmet, CORS, Rate Limiting, bcrypt

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Web3:** Wagmi, Viem

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- A package manager like `npm` or `yarn`

### Installation

1.  **Clone the repo**
    ```sh
    git clone https://github.com/your_username/goalcoin.git
    cd goalcoin
    ```

2.  **Backend Setup**
    ```sh
    cd backend
    npm install
    
    # Set up environment variables
    cp .env.example .env 
    ```
    You'll need to edit the `.env` file to add your `DATABASE_URL` and a secure `ADMIN_PASSWORD_HASH`. To generate a hash, you can run:
    ```sh
    node -e "require('bcrypt').hash('your-password', 10).then(console.log)"
    ```
    Then, set up the database:
    ```sh
    npm run db:generate
    npm run db:push
    
    # Start the server
    npm run dev
    ```

3.  **Frontend Setup**
    ```sh
    cd ../frontend
    npm install

    # Set up environment variables
    cp .env.local.example .env.local
    ```
    Edit `.env.local` and set `NEXT_PUBLIC_BACKEND_URL` to point to your local backend server (e.g., `http://localhost:3001`).
    ```sh
    # Start the development server
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the app in your browser.

## Deployment on Vercel

This project is configured for easy deployment on Vercel.

1.  **Push to GitHub:** Push your project to a new GitHub repository.
2.  **Import Project on Vercel:** Log in to your Vercel account and import the GitHub repository.
3.  **Configure Project:** Vercel will automatically detect that this is a Next.js application. You will need to configure the environment variables for both the frontend and backend.
    - **Root Directory:** Set the root directory to `frontend`.
4.  **Add Environment Variables:** In the Vercel project settings, add the necessary environment variables from `backend/.env` and `frontend/.env.local`.
5.  **Deploy:** Click the "Deploy" button. Vercel will handle the build and deployment process.

*Note: The backend is an Express server. For Vercel, you would typically deploy this as a serverless function. You may need to add a `vercel.json` file in the `backend` directory to configure rewrites if you deploy both frontend and backend from the same repository root. A simpler approach is to deploy the backend to a separate service (like Heroku or Railway) and the frontend to Vercel.*

## Key Features

- **Wallet Integration:** Connect with MetaMask and WalletConnect.
- **Secure API:** Backend endpoints for user connections and data retrieval.
- **Admin Panel:** A password-protected page to view connected users.
- **Modern Tech:** Built with Next.js, Express, and TypeScript for a robust and scalable application.

## License

Distributed under the ISC License.
