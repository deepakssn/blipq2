const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars (if not already loaded, though typically done in app.js)
// dotenv.config({ path: './.env' }); // Make sure path is correct if using this here

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // useCreateIndex: true, // No longer supported in Mongoose 6+
      // useFindAndModify: false, // No longer supported in Mongoose 6+
      dbName: process.env.DB_NAME || 'classifieds_db', // Fallback db name
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
