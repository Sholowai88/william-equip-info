# Configuration Setup Guide

## Step 1: Create Your Config File

1. Copy `config/config.template.js` to `config/config.js`
2. Open `config/config.js`
3. Replace the placeholder values with your actual credentials

## Step 2: Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Click on **Settings** → **API**
3. Copy:
   - **URL** (Project URL)
   - **anon public** key

## Step 3: Update config.js

Open `config/config.js` and replace:

```javascript
SUPABASE_URL: 'YOUR_SUPABASE_URL_HERE',
SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY_HERE',
