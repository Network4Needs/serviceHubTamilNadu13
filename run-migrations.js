// Serverless function to run database migrations
import { Pool } from '@neondatabase/serverless';
import ws from 'ws';

// Enable WebSocket for Neon serverless
process.env.neonConfig = JSON.stringify({ webSocketConstructor: ws });

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Check for required environment variables
  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ 
      error: 'DATABASE_URL is not defined in environment variables',
      instructions: 'Please add the DATABASE_URL environment variable in your Vercel project settings'
    });
  }

  // Log for debugging
  console.log("Migration script started");
  console.log("Database URL available:", !!process.env.DATABASE_URL);

  try {
    console.log("Starting database migration...");
    
    // Configure Neon database connection
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Create essential tables
    console.log("Creating users table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        wallet_balance NUMERIC(10, 2) DEFAULT 0.00,
        full_name TEXT,
        phone TEXT,
        pincode TEXT,
        district TEXT,
        state TEXT DEFAULT 'Tamil Nadu',
        taluk TEXT,
        address TEXT,
        referrer_id INTEGER,
        commission_percentage NUMERIC(5, 2) DEFAULT 1.00,
        profile_image_url TEXT,
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT
      );
    `);
    
    console.log("Creating wallet transactions table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        amount NUMERIC(10, 2) NOT NULL,
        description TEXT,
        transaction_type TEXT NOT NULL,
        transaction_id TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        reference_id INTEGER,
        service_type TEXT
      );
    `);
    
    console.log("Creating service agents table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS service_agents (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        pincode TEXT NOT NULL,
        district TEXT NOT NULL,
        taluk TEXT NOT NULL
      );
    `);
    
    console.log("Creating recharges table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS recharges (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        phone_number TEXT NOT NULL,
        amount NUMERIC(10, 2) NOT NULL,
        provider TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        reference_id TEXT,
        service_type TEXT DEFAULT 'mobile'
      );
    `);

    console.log("Creating recycling requests table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS recycling_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        material_type TEXT NOT NULL,
        quantity NUMERIC(10, 2) NOT NULL,
        status TEXT DEFAULT 'new',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        assigned_to INTEGER,
        address TEXT,
        pincode TEXT,
        scheduled_date TEXT,
        completed_date TIMESTAMPTZ,
        payment_amount NUMERIC(10, 2),
        description TEXT,
        request_number TEXT
      );
    `);

    console.log("Creating recycling rates table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS recycling_rates (
        id SERIAL PRIMARY KEY,
        material_type TEXT NOT NULL,
        rate_per_kg NUMERIC(10, 2) NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Creating commission configs table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS commission_configs (
        id SERIAL PRIMARY KEY,
        service_type TEXT NOT NULL,
        commission_type TEXT NOT NULL,
        percentage NUMERIC(5, 2) NOT NULL,
        role TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Creating commission transactions table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS commission_transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        amount NUMERIC(10, 2) NOT NULL,
        service_type TEXT NOT NULL,
        reference_id INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'pending'
      );
    `);

    console.log("Creating chat messages table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        read BOOLEAN DEFAULT FALSE
      );
    `);
    
    // Insert default recycling rates if not exist
    console.log("Setting up default recycling rates...");
    await pool.query(`
      INSERT INTO recycling_rates (material_type, rate_per_kg)
      VALUES 
        ('plastic', 10.00),
        ('aluminum', 60.00),
        ('copper', 400.00),
        ('brass', 300.00)
      ON CONFLICT (material_type) DO NOTHING;
    `);
    
    // Insert default commission configs if not exist
    console.log("Setting up default commission configs...");
    await pool.query(`
      INSERT INTO commission_configs (service_type, commission_type, percentage, role)
      VALUES 
        ('mobile_recharge', 'percentage', 0.5, 'admin'),
        ('mobile_recharge', 'percentage', 0.5, 'branch_manager'),
        ('mobile_recharge', 'percentage', 1.0, 'taluk_manager'),
        ('mobile_recharge', 'percentage', 3.0, 'service_agent'),
        ('mobile_recharge', 'percentage', 1.0, 'user')
      ON CONFLICT DO NOTHING;
    `);
    
    // Close the connection
    await pool.end();
    
    console.log("Migration completed successfully");
    res.status(200).json({ 
      success: true,
      message: "Database migration completed successfully",
      details: "Created essential tables for the Nalamini Service Platform",
      info: "This is a one-time operation to set up your database schema",
      next_steps: "Set up all required environment variables and deploy your full application"
    });
  } catch (error) {
    console.error("Migration failed:", error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      stack: error.stack,
      troubleshooting: "Check database connection string and permissions"
    });
  }
}