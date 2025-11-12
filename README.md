McD Assistant: AI-Powered Employee Assistant

Live Prototype: https://tu-url-de-render.onrender.com (Reemplaza esto con la URL de tu deploy)

Overview

The "McD Assistant" is an intelligent, secure, and context-aware chatbot built to support McDonald's employees in the Czech Republic. It serves as a single source of truth for staff, providing instant answers to questions about internal procedures, emergency contacts, and administrative tasks.

This application is built with a secure Node.js backend, leveraging Google's Gemini 2.5 Flash model for natural language processing, and a Retrieval-Augmented Generation (RAG) system to ensure all answers are based only on internal company knowledge.

Core Features

Internal Knowledge Base (RAG): The assistant is grounded in local knowledge files (procedures.json, contacts.json). It uses this context to provide accurate answers specific to the store, rather than generic web information.

Intelligent Chat: Powered by the Google Gemini API (gemini-2.5-flash) for fast and natural conversation.

Intent Classification: The system is designed to classify user intent (e.g., "Cleaning Procedure," "Shift Planning," "Emergency Contact") to optimize the context provided to the AI.

Secure Backend: Built with a Node.js and Express server, ensuring that all API keys and internal data remain secure on the backend.

Production Ready: Configured for easy deployment on hosting platforms like Render, with a stable Node.js version specified.

Tech Stack

Component

Technology

Backend

Node.js, Express.js

AI Model

Google Gemini 2.5 Flash

AI SDK

@google/generative-ai

Environment

Node.js 20.x (LTS)

Deployment

Render (Recommended)

Getting Started

Follow these instructions to get a local copy of the project up and running for development and testing.

1. Prerequisites

Node.js (v20.x recommended)

Git

A Google Gemini API Key from Google AI Studio

2. Local Installation

Clone the repository:

git clone [https://github.com/vanos0600/mc-assisten-ai.git](https://github.com/vanos0600/mc-assisten-ai.git)
cd mc-assisten-ai


Install dependencies:

npm install


Configure Environment:
Create a file named .env in the root of the project. This file is critical for storing your secret API key.

touch .env


Open the .env file and add your Gemini API key. Ensure there are no quotes or spaces.

GEMINI_API_KEY=AIzaSy...your_key_here
PORT=3000


Note: The .gitignore file is already configured to ignore .env to prevent accidentally leaking your key.

Run the server:

npm start


The server will start on http://localhost:3000. You can now send requests to the POST /api/ask endpoint using a tool like Postman or by connecting the frontend.

3. Populating the Knowledge Base

This assistant's intelligence comes from the files in the /knowledge directory:

knowledge/procedures.json

knowledge/contacts.json

Ensure these files are populated with your specific internal data for the RAG system to function correctly.

Deployment

This application is ready to be deployed to a "Web Service" host like Render.

Push to GitHub: Ensure your repository is up-to-date on GitHub.

Create a new Web Service on Render:

Connect your GitHub repository.

Build Command: npm install

Start Command: npm start

Add Environment Variables:
In the Render dashboard under "Environment", add your secret API key:

Key: GEMINI_API_KEY

Value: AIzaSy...your_key_here

Render will automatically deploy your application using the stable Node.js version (20.x) specified in package.json./mc-assisten-ai.git
