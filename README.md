# Church Community Hub

A full-stack church community platform where members can:

- Register and login
- Create blog posts (faith, teachings, discussions)
- Ask and answer questions
- Comment on posts
- Like posts and upvote answers
- Moderate content through an admin panel

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB (Mongoose)

## Run Locally

### 1) Backend

```bash
cd /home/runner/work/gibi_gubae_Limat_kifil/gibi_gubae_Limat_kifil/backend
cp .env.example .env
npm install
npm run dev
```

### 2) Frontend

```bash
cd /home/runner/work/gibi_gubae_Limat_kifil/gibi_gubae_Limat_kifil/frontend
npm install
npm run dev
```

Frontend expects backend API at `http://localhost:5000/api` by default.
Override with `VITE_API_URL` if needed.

## Admin Role

Set `ADMIN_EMAILS` in `backend/.env` (comma-separated). Any registered user with matching email is created with `admin` role.
