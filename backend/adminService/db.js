const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb+srv://devendra8182_db_user:h7bjVagR8ru8DFdo@devendra.io1nvag.mongodb.net/streamingapp';
    if (!mongoose.connection.readyState) {
      console.log('[admin/db] Connecting to MongoDB at:', uri);
      await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('[admin/db] MongoDB connection established');
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = {
  connectDB,
  mongoose,
};
