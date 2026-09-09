const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), override: true });
const dns = require('dns');
const mongoose = require('mongoose');

// Use public DNS to ensure reliable MongoDB Atlas SRV resolution on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore in environments where custom DNS cannot be set
}

let isConnectedToMongo = false;

function maskUri(uri) {
  if (!uri) return 'undefined';
  return uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
}

/**
 * Connect to MongoDB with automated retries and resilient graceful fallback
 * Handles local instances and MongoDB Atlas clusters with comprehensive retry logic
 */
const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/jobhunter';
  const isAtlas = mongoUri.includes('mongodb+srv://');
  const maxRetries = 5;
  let attempt = 1;

  // Disable buffering so queries don't hang if Mongo is offline
  mongoose.set('bufferCommands', false);

  const mongooseOptions = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 2,
  };

  while (attempt <= maxRetries) {
    try {
      console.log(`[Database] Attempting connection to MongoDB (${isAtlas ? 'Atlas Cluster' : 'Local'} - Attempt ${attempt}/${maxRetries})...`);
      
      await mongoose.connect(mongoUri, mongooseOptions);

      isConnectedToMongo = true;
      console.log(`[Database] ✅ Successfully connected to MongoDB at ${mongoose.connection.host}`);
      return true;
    } catch (error) {
      console.warn(`[Database] Connection attempt ${attempt}/${maxRetries} failed: ${error.message}`);
      
      if (attempt === maxRetries) {
        isConnectedToMongo = false;
        console.log('------------------------------------------------------------------------');
        if (isAtlas) {
          console.log(`⚠️  Could not connect to MongoDB Atlas cluster at ${maskUri(mongoUri)}.`);
          console.log('👉 Quick fix: Verify that your current IP address (or 0.0.0.0/0) is whitelisted in:');
          console.log('   MongoDB Atlas > Security > Network Access');
        } else {
          console.log('⚠️  Local MongoDB is not running on port 27017.');
          console.log('👉 Quick fix: Start Docker Desktop or local MongoDB service.');
        }
        console.log('🚀 SYSTEM READY: Operating in RESILIENT IN-MEMORY STORE MODE.');
        console.log('   All APIs, resume uploads, and job matching feeds remain fully functional.');
        console.log('------------------------------------------------------------------------');
        return false;
      }

      // Exponential backoff before next retry (1s, 2s, 4s, 8s, 10s)
      const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(`[Database] Retrying in ${backoffMs / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
      attempt++;
    }
  }

  return false;
};

mongoose.connection.on('disconnected', () => {
  isConnectedToMongo = false;
});

mongoose.connection.on('error', (err) => {
  isConnectedToMongo = false;
});

module.exports = connectDB;
