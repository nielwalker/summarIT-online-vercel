# Repository Setup Instructions

## 🚀 How to Clone and Set Up This Repository

### 1. Clone the Repository
```bash
git clone https://github.com/nielwalker/summarize-application.git
cd summarize-application
```

### 2. Frontend Setup (React/Vite)
```bash
cd frontend
npm install
```

### 3. Backend Setup (Next.js)
```bash
cd ../summarit
npm install
```

### 4. Environment Variables Setup

#### Frontend (.env file in `frontend/` directory)
```env
VITE_API_URL=http://localhost:3000
```

#### Backend (.env.local file in `summarit/` directory)
```env
# Database
DATABASE_URL="your_supabase_database_url"

# OpenAI API Key
OPENAI_API_KEY="your_openai_api_key"

# Optional: For development
NEXTAUTH_SECRET="your_nextauth_secret"
NEXTAUTH_URL=http://localhost:3000
```

### 5. Database Setup (Supabase)
1. Go to [Supabase](https://supabase.com) and create a new project
2. Get your database URL from Settings > Database
3. Update the `DATABASE_URL` in `summarit/.env.local`
4. Run database migrations:
```bash
cd summarit
npx prisma generate
npx prisma db push
```

### 6. Running the Application

#### Terminal 1 - Backend (Next.js)
```bash
cd summarit
npm run dev
```

#### Terminal 2 - Frontend (React)
```bash
cd frontend
npm run dev
```

### 7. Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## 🔧 Troubleshooting

### Common Issues:

1. **Port Conflicts**: If ports 3000 or 5173 are busy, change them in package.json scripts
2. **Database Connection**: Ensure your Supabase database URL is correct
3. **OpenAI API**: Make sure your OpenAI API key is valid and has credits
4. **Node Modules**: If you get errors, delete `node_modules` and `package-lock.json`, then run `npm install`

### File Structure After Setup:
```
summarize-application/
├── frontend/          # React/Vite frontend
│   ├── src/
│   ├── package.json
│   └── .env
├── summarit/          # Next.js backend
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── .env.local
└── .gitignore
```

## 📝 Important Notes

- **Never commit `.env` files** - They contain sensitive information
- **Database migrations** - Run `npx prisma db push` after setting up Supabase
- **API endpoints** - Backend must be running before frontend can work
- **Development mode** - Both servers run in development mode with hot reload

## 🆘 Need Help?

If you encounter issues:
1. Check that all environment variables are set correctly
2. Ensure both servers are running (backend on :3000, frontend on :5173)
3. Check the browser console and terminal for error messages
4. Verify your Supabase database connection
