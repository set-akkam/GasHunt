import fetch from 'node-fetch';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';
import mongoose from 'mongoose';

// Get the directory name of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables from the backend .env file
const envPath = path.join(__dirname, '../../backend/.env');
console.log('Loading environment variables from:', envPath);
dotenv.config({ path: envPath });

// Debug environment variables
console.log('Environment variables loaded:');
console.log('MONGO_URI:', process.env.MONGO_URI);
console.log('PORT:', process.env.PORT);

const API_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// Connect to MongoDB
async function connectDB() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is not set');
    }
    
    console.log('Attempting to connect to MongoDB with URI:', process.env.MONGO_URI);
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
}

async function recordPriceHistory() {
  try {
    console.log('Recording price history...', new Date().toISOString());
    console.log('Using API URL:', API_URL);
    
    const response = await fetch(`${API_URL}/api/price-history/record`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to record price history: ${response.statusText}\n${errorData}`);
    }

    const result = await response.json();
    console.log('Price history recorded successfully:', result);
  } catch (error) {
    console.error('Error in recordPriceHistory:', error);
  }
}

// Connect to database first
console.log('Connecting to MongoDB...');
await connectDB();

// Run every 15 minutes
cron.schedule('*/15 * * * *', recordPriceHistory);

console.log('Price history recording service started...');
console.log('Will record prices every 15 minutes');

// Initial run
recordPriceHistory(); 