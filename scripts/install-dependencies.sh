#!/bin/bash

# Fortisel Backend Dependencies Installation Script
# This script installs the required dependencies for the Fortisel backend

echo "🚀 Installing Fortisel Backend Dependencies..."
echo "=============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if ! node -e "process.exit(require('semver').gte('$NODE_VERSION', '$REQUIRED_VERSION') ? 0 : 1)" 2>/dev/null; then
    echo "❌ Node.js version $NODE_VERSION is not supported."
    echo "   Please upgrade to Node.js $REQUIRED_VERSION or higher."
    exit 1
fi

echo "✅ Node.js version $NODE_VERSION is supported"

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm is available"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Check if MongoDB is running (optional)
if command -v mongod &> /dev/null; then
    if pgrep -x "mongod" > /dev/null; then
        echo "✅ MongoDB is running"
    else
        echo "⚠️  MongoDB is not running. Please start MongoDB:"
        echo "   sudo systemctl start mongod"
        echo "   or"
        echo "   brew services start mongodb-community"
    fi
else
    echo "⚠️  MongoDB is not installed. Please install MongoDB:"
    echo "   Visit: https://docs.mongodb.com/manual/installation/"
fi

echo ""
echo "🎉 Installation completed successfully!"
echo ""
echo "Next steps:"
echo "1. Run: node scripts/setup-env.js"
echo "2. Configure your .env file"
echo "3. Start the application: npm run start:dev"
echo ""
echo "For detailed setup instructions, see ENVIRONMENT_SETUP.md"
