const mongoose = require('mongoose');

const uris = [
  process.env.MONGODB_URI,
  process.env.MONGODB_URI_SRV,
  'mongodb://127.0.0.1:27017/trendypos',
].filter(Boolean);

const options = {
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 45000,
};

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = (async () => {
      for (let i = 0; i < uris.length; i++) {
        const uri = uris[i];
        let attempts = 0;
        while (attempts < 3) {
          try {
            const conn = await mongoose.connect(uri, options);
            console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
            console.log(`📂 Database: ${conn.connection.name}`);
            return conn;
          } catch (error) {
            attempts += 1;
            console.error(`MongoDB [${i + 1}/${uris.length}] attempt ${attempts}/3: ${error.message}`);
            if (attempts < 3) await new Promise((r) => setTimeout(r, 2000));
          }
        }
      }
      console.error('\n⚠️  MongoDB unavailable — API running but database features disabled.');
      console.error('Fix: Atlas → Network Access → allow 0.0.0.0/0\n');
      return null;
    })();
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDB;
