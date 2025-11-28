#!/bin/bash

# ============================================================================
# SETUP SCRIPT FOR FIREBASE ADMIN SDK (Mac/Linux)
# ============================================================================
# This bash script will help you set up your .env.local file with
# the Firebase Admin SDK credentials.
#
# USAGE:
#   1. Make executable: chmod +x scripts/setup-firebase-admin.sh
#   2. Review the FIREBASE-ADMIN-SETUP-INSTRUCTIONS.md file
#   3. Run: ./scripts/setup-firebase-admin.sh
#
# SECURITY WARNING:
#   - NEVER commit .env.local to git (it's already gitignored)
#   - NEVER share your Firebase Admin credentials
#   - These credentials provide FULL ACCESS to your Firebase project
# ============================================================================

echo "========================================"
echo "Firebase Admin SDK Setup"
echo "========================================"
echo ""

# Check if .env.local already exists
if [ -f ".env.local" ]; then
    echo "WARNING: .env.local already exists!"
    echo ""
    read -p "Do you want to view/update it? (y/n): " overwrite
    
    if [ "$overwrite" != "y" ]; then
        echo "Setup cancelled."
        exit 0
    fi
    
    echo ""
    echo "Current .env.local location:"
    echo "$(pwd)/.env.local"
    echo ""
    echo "You can edit it manually with your preferred editor:"
    echo "  nano .env.local     # Nano editor"
    echo "  vim .env.local      # Vim editor"
    echo "  code .env.local     # VS Code"
    echo ""
else
    # Create new .env.local file with template
    cat > .env.local << 'EOF'
# ============================================================================
# Firebase Client Configuration (Public - Client-Side)
# ============================================================================
# Get these from: Firebase Console → Project Settings → General → Your apps
# If you already have these set up, replace the placeholder values below

NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=mentormatch-ba0d1.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=mentormatch-ba0d1
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=mentormatch-ba0d1.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# ============================================================================
# Firebase Admin SDK (Server-Side ONLY - NEVER expose these publicly)
# ============================================================================
# IMPORTANT: Replace the values below with your actual credentials
# From the service account JSON you received:

FIREBASE_ADMIN_PROJECT_ID=mentormatch-ba0d1
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-fbsvc@mentormatch-ba0d1.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nREPLACE_WITH_YOUR_ACTUAL_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"

# ============================================================================
# API Configuration
# ============================================================================
NEXT_PUBLIC_API_URL=/api
NODE_ENV=development
EOF
    
    echo "CREATED: .env.local file successfully!"
    echo ""
    echo "NEXT STEPS:"
    echo "  1. Open .env.local in your editor"
    echo "  2. Replace placeholder values with your actual credentials"
    echo "  3. Save the file"
    echo "  4. Restart your dev server: npm run dev"
    echo ""
fi

echo "========================================"
echo "Important Information"
echo "========================================"
echo ""
echo "Your Firebase Admin credentials:"
echo "  Project ID: mentormatch-ba0d1"
echo "  Client Email: firebase-adminsdk-fbsvc@mentormatch-ba0d1.iam.gserviceaccount.com"
echo ""
echo "The private key should be formatted as:"
echo '  FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"'
echo ""
echo "SECURITY REMINDERS:"
echo "  • .env.local is already in .gitignore - DO NOT commit it"
echo "  • Never share these credentials publicly"
echo "  • These provide FULL ACCESS to your Firebase project"
echo ""
echo "For detailed instructions, see:"
echo "  • FIREBASE-ADMIN-SETUP-INSTRUCTIONS.md"
echo "  • docs/firebase-admin-setup.md"
echo ""
echo "To verify setup, run: npm run dev"
echo "You should see: 'Firebase Admin SDK initialized successfully'"
echo ""

