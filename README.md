# 📺 VideoTube

A **Node.js backend application** built with a modular and scalable architecture.  
This project provides a full-featured backend with secure authentication, media handling, and advanced data management using MongoDB aggregation pipelines.

---

## 🚀 Features

- **User Management** – sign up, login, authentication, and authorization  
- **Token-Based Security** – access and refresh tokens using **JWT**  
- **Password Security** – hashing with **bcrypt**  
- **Video Management** – upload, update, and fetch videos with media storage on **Cloudinary**  
- **User Interactions** – likes, dislikes, comments, and replies  
- **Channel Management** – subscriptions and unsubscriptions  
- **Advanced Queries** – optimized with **MongoDB aggregation pipelines and sub-pipelines**  

---

## 🛠️ Technologies & Modules Used

- **Node.js** & **Express.js** – server-side development and API handling  
- **MongoDB** & **Mongoose** – database and schema modeling  
- **Cloudinary** – media storage and management  
- **JWT (JSON Web Tokens)** – authentication and authorization  
- **bcrypt** – password hashing and security  
- **Multer** – file handling and uploads  
- **dotenv** – environment variable management  

---

## 📂 Project Setup

1. Clone the repository:
   
   ```bash
   git clone https://github.com/your-username/videotube.git
   cd videotube
   
2. Install dependencies:
   
   ```bash
    npm install

3. Create a `.env` file in the root directory and configure the following:
   
   ```env
    PORT=5000
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret
    CLOUDINARY_CLOUD_NAME=your_cloudinary_name
    CLOUDINARY_API_KEY=your_cloudinary_api_key
    CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   
4. Run the server:
   
   ```bash
   npm run dev
