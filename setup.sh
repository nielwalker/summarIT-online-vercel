#!/bin/bash

echo "Setting up the Summarize Application..."
echo

echo "Installing frontend dependencies..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "Frontend installation failed!"
    exit 1
fi

echo
echo "Installing backend dependencies..."
cd ../summarit
npm install
if [ $? -ne 0 ]; then
    echo "Backend installation failed!"
    exit 1
fi

echo
echo "Setup complete!"
echo
echo "Next steps:"
echo "1. Create .env file in frontend/ directory with VITE_API_URL=http://localhost:3000"
echo "2. Create .env.local file in summarit/ directory with your database and API keys"
echo "3. Run 'npx prisma generate' and 'npx prisma db push' in the summarit/ directory"
echo "4. Start the backend: cd summarit && npm run dev"
echo "5. Start the frontend: cd frontend && npm run dev"
echo
echo "See SETUP_INSTRUCTIONS.md for detailed instructions."
