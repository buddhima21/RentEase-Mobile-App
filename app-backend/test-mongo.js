const mongoose = require('mongoose');

const uri = "mongodb://Buddhima:buddhima321@ac-qvwpwuy-shard-00-00.wscsft9.mongodb.net:27017,ac-qvwpwuy-shard-00-01.wscsft9.mongodb.net:27017,ac-qvwpwuy-shard-00-02.wscsft9.mongodb.net:27017/rentease_mobile?ssl=true&replicaSet=atlas-qvwpwuy-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(uri, {
  serverSelectionTimeoutMS: 5000,
  family: 4
})
  .then(() => {
    console.log("Successfully connected to MongoDB with new credentials!");
    process.exit(0);
  })
  .catch(err => {
    console.error("Connection failed:", err.message);
    process.exit(1);
  });
