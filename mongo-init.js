// MongoDB initialization script for evoFlowAI

db = db.getSiblingDB('evoflowai');

// Create collections
db.createCollection('users');
db.createCollection('fooditems');
db.createCollection('chatmessages');
db.createCollection('airecommendations');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.fooditems.createIndex({ "userId": 1, "createdAt": -1 });
db.fooditems.createIndex({ "userId": 1, "mealType": 1 });
db.chatmessages.createIndex({ "userId": 1, "timestamp": -1 });
db.airecommendations.createIndex({ "userId": 1, "createdAt": -1 });

print('evoFlowAI database initialized successfully!');