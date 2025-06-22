const mongoose = require('mongoose');

let isConnected = false;

async function connectDatabase() {
    if (isConnected) {
        console.log('Database already connected');
        return;
    }

    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://raja:Raja9315@cluster0.jvibbj6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
        
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        isConnected = true;
        console.log('✅ Connected to MongoDB successfully');

        // Handle connection events
        mongoose.connection.on('error', (error) => {
            console.error('MongoDB connection error:', error);
            isConnected = false;
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
            isConnected = false;
        });

        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected');
            isConnected = true;
        });

    } catch (error) {
        console.error('❌ Failed to connect to MongoDB:', error);
        console.log('\n🔧 To fix this, you have several options:');
        console.log('1. Use MongoDB Atlas (free cloud database):');
        console.log('   - Go to https://www.mongodb.com/atlas');
        console.log('   - Create a free account and cluster');
        console.log('   - Update MONGODB_URI in your .env file');
        console.log('\n2. Install MongoDB locally:');
        console.log('   - Download from https://www.mongodb.com/try/download/community');
        console.log('   - Install and start the MongoDB service');
        console.log('\n3. Use SQLite (simpler alternative):');
        console.log('   - We can modify the code to use SQLite instead');
        
        // For development, we can continue without database
        if (process.env.NODE_ENV === 'development') {
            console.log('\n⚠️  Continuing without database for development...');
            console.log('⚠️  Some features will be limited');
            return;
        }
        
        throw error;
    }
}

async function disconnectDatabase() {
    if (!isConnected) {
        return;
    }

    try {
        await mongoose.disconnect();
        isConnected = false;
        console.log('✅ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error disconnecting from MongoDB:', error);
        throw error;
    }
}

function getConnectionStatus() {
    return isConnected;
}

module.exports = {
    connectDatabase,
    disconnectDatabase,
    getConnectionStatus
}; 