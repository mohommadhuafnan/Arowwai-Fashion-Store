const mongoose = require('mongoose');

const connectDB = async () => {
  const uris = [
    process.env.MONGODB_URI,
    process.env.MONGODB_URI_SRV,
    'mongodb://127.0.0.1:27017/trendypos',
  ].filter(Boolean);

  const options = {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
  };

  for (let i = 0; i < uris.length; i++) {
    const uri = uris[i];
    let attempts = 0;
    while (attempts < 3) {
      try {
        const conn = await mongoose.connect(uri, options);
        console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
        console.log(`📂 Database: ${conn.connection.name}`);
        return;
      } catch (error) {
        attempts += 1;
        console.error(`MongoDB [${i + 1}/${uris.length}] attempt ${attempts}/3: ${error.message}`);
        if (attempts < 3) await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  console.error('\n⚠️  MongoDB unavailable — API running but database features disabled.');
  console.error('Fix: Atlas → Network Access → allow your IP (0.0.0.0/0 for dev)\n');
};

module.exports = connectDB;
