# Admin Dashboard

## Overview
This project is an admin dashboard application that allows administrators to manage various aspects of a web application, including users, products, orders, categories, and reviews. It provides a user-friendly interface for performing CRUD operations and monitoring the application's performance.

## Features
- User authentication (login and registration)
- Manage categories (create, update, delete)
- Manage products (create, update, delete)
- Manage orders (view and update order statuses)
- Manage users (create, update, delete)
- Manage product reviews (view and delete)
- Responsive design for mobile and desktop

## Technologies Used
- Node.js
- Express.js
- MongoDB
- Mongoose
- EJS (Embedded JavaScript)
- Bootstrap (for styling)
- dotenv (for environment variables)

## Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd admin-dashboard
   ```
3. Install the dependencies:
   ```
   npm install
   ```
4. Create a `.env` file in the root directory and add your environment variables:
   ```
   NODE_ENV=development
   PORT=3000
   MONGO_URI=<your-mongodb-uri>
   SESSION_SECRET=<your-session-secret>
   ```

## Running the Application
To start the application in development mode, run:
```
npm run dev
```

## License
This project is licensed under the MIT License.