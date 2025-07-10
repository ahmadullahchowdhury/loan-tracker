# Loan Tracker - Family Loan Management System

A full-stack web application for tracking loans given to and received from family members, with transaction history and balance management.

## Features

### Core Functionality
- **Dual Loan Tracking**: Track both money lent to others and money borrowed from others
- **Transaction Management**: Add, edit, and delete transactions with detailed notes
- **Balance Tracking**: Automatic balance calculation after each transaction
- **Dashboard Overview**: Real-time summary of total lent, total taken, net amount, and loan counts
- **Transaction History**: Complete history with dates, amounts, methods, and notes
- **Responsive Design**: Works on both desktop and mobile devices

### User Interface
- Modern, clean interface built with React and Tailwind CSS
- Professional UI components using shadcn/ui
- Intuitive forms for loan and transaction management
- Real-time data updates using React Query

## Technology Stack

### Backend
- **Node.js** with Express.js framework
- **MongoDB** for data storage
- **Mongoose** for database modeling
- **CORS** enabled for cross-origin requests

### Frontend
- **React** with modern hooks
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **Lucide React** for icons
- **TanStack React Query** for API state management
- **Axios** for HTTP requests

## Project Structure

```
loan-tracker/
├── backend/
│   ├── models/
│   │   ├── Loan.js          # Loan data model
│   │   └── Transaction.js   # Transaction data model
│   ├── routes/
│   │   ├── loans.js         # Loan CRUD operations
│   │   ├── transactions.js  # Transaction CRUD operations
│   │   └── summary.js       # Dashboard summary data
│   ├── index.js             # Main server file
│   ├── package.json         # Backend dependencies
│   └── .env                 # Environment variables
└── frontend/
    └── loan-tracker-frontend/
        ├── src/
        │   ├── components/
        │   │   ├── Dashboard.jsx
        │   │   ├── LoanList.jsx
        │   │   ├── LoanForm.jsx
        │   │   ├── TransactionHistory.jsx
        │   │   └── TransactionForm.jsx
        │   ├── lib/
        │   │   └── api.js       # API utility functions
        │   ├── App.jsx          # Main app component
        │   └── main.jsx         # Entry point
        ├── package.json         # Frontend dependencies
        └── index.html           # HTML template
```

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or pnpm package manager

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd loan-tracker/backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start MongoDB service:**
   ```bash
   # On Ubuntu/Debian
   sudo systemctl start mongod
   sudo systemctl enable mongod
   
   # On macOS with Homebrew
   brew services start mongodb-community
   
   # On Windows
   net start MongoDB
   ```

4. **Configure environment variables:**
   The `.env` file is already configured with:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/loan-tracker
   NODE_ENV=development
   ```

5. **Start the backend server:**
   ```bash
   # Development mode (with auto-restart)
   npm run dev
   
   # Production mode
   npm start
   ```

   The backend will be available at `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd loan-tracker/frontend/loan-tracker-frontend
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Start the development server:**
   ```bash
   pnpm run dev --host
   # or
   npm run dev -- --host
   ```

   The frontend will be available at `http://localhost:5173`

## API Endpoints

### Loans
- `GET /api/loans` - Get all loans
- `POST /api/loans` - Create a new loan
- `GET /api/loans/:id` - Get loan by ID
- `PUT /api/loans/:id` - Update loan
- `DELETE /api/loans/:id` - Delete loan

### Transactions
- `GET /api/transactions/loan/:loanId` - Get transactions for a loan
- `POST /api/transactions` - Create a new transaction
- `GET /api/transactions/:id` - Get transaction by ID
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Summary
- `GET /api/summary/total-lend` - Get total lent amount
- `GET /api/summary/total-taken` - Get total taken amount
- `GET /api/summary/overview` - Get complete dashboard overview

## Usage Guide

### Adding a Loan

1. Click the "Add Loan" button
2. Fill in the form:
   - **Person Name**: Name of the family member
   - **Loan Type**: Choose "Money Lent" or "Money Borrowed"
   - **Initial Amount**: The loan amount
   - **Transaction Method**: How the money was transferred
   - **Currency**: Default is BDT (Bangladeshi Taka)
   - **Notes**: Optional additional information
3. Click "Create Loan"

### Managing Transactions

1. Click the eye icon (👁️) next to any loan to view transaction history
2. Click "Add Transaction" to record:
   - **Additional money given/taken**
   - **Partial or full payments**
   - **Transaction details** (date, method, notes)
3. Edit or delete existing transactions using the action buttons

### Dashboard Overview

The dashboard provides real-time summaries:
- **Total Lent**: Sum of all outstanding money you've lent
- **Total Taken**: Sum of all outstanding money you've borrowed
- **Net Amount**: Your overall financial position
- **Total Loans**: Count of all loan records

## Deployment Options

### Option 1: Local Network Deployment

For use within your home/office network:

1. **Backend**: Change the server to listen on all interfaces
   ```javascript
   // In backend/index.js, the server already listens on 0.0.0.0
   app.listen(PORT, '0.0.0.0', () => {
     console.log(`Server is running on port ${PORT}`);
   });
   ```

2. **Frontend**: Update API base URL to your server's IP
   ```javascript
   // In frontend/src/lib/api.js
   const API_BASE_URL = 'http://YOUR_SERVER_IP:5000/api';
   ```

3. **Build frontend for production:**
   ```bash
   cd frontend/loan-tracker-frontend
   pnpm run build
   ```

### Option 2: Cloud Deployment

For internet-accessible deployment, consider:

1. **Backend**: Deploy to services like Heroku, Railway, or DigitalOcean
2. **Database**: Use MongoDB Atlas for cloud database
3. **Frontend**: Deploy to Vercel, Netlify, or similar static hosting

### Option 3: Docker Deployment

Create Docker containers for easy deployment:

1. **Backend Dockerfile:**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   EXPOSE 5000
   CMD ["npm", "start"]
   ```

2. **Frontend Dockerfile:**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build
   FROM nginx:alpine
   COPY --from=0 /app/dist /usr/share/nginx/html
   ```

## Security Considerations

- The application currently runs without authentication
- For production use, consider adding:
  - User authentication and authorization
  - Input validation and sanitization
  - Rate limiting
  - HTTPS encryption
  - Environment-specific configurations

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error:**
   - Ensure MongoDB service is running
   - Check the connection string in `.env`

2. **Port Already in Use:**
   - Kill existing processes: `sudo lsof -ti:5000 | xargs sudo kill -9`
   - Or change the port in `.env`

3. **Frontend API Connection Issues:**
   - Verify backend is running on port 5000
   - Check CORS configuration
   - Ensure API base URL is correct

4. **Dependencies Issues:**
   - Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

## Support

For issues or questions:
1. Check the console logs for error messages
2. Verify all services are running correctly
3. Ensure all dependencies are properly installed

## License

This project is created for personal/family use. Feel free to modify and adapt according to your needs.

