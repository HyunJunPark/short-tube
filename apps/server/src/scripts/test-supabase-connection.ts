#!/usr/bin/env tsx
/**
 * Test Supabase Connection Script
 *
 * This script tests the connection to Supabase and verifies that all tables exist.
 * Run this before migration to ensure everything is set up correctly.
 *
 * Usage:
 *   npm run db:test
 */

import dotenv from 'dotenv';
import { getSupabaseClient, testSupabaseConnection } from '../lib/supabase';

// Load environment variables
dotenv.config();

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');

  try {
    // Check environment variables
    console.log('📋 Checking environment variables...');
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL environment variable is not set');
    }
    if (!supabaseKey) {
      throw new Error('SUPABASE_SERVICE_KEY environment variable is not set');
    }

    console.log(`   ✓ SUPABASE_URL: ${supabaseUrl}`);
    console.log(`   ✓ SUPABASE_SERVICE_KEY: ${supabaseKey.substring(0, 20)}...`);
    console.log();

    // Test connection
    console.log('📡 Testing connection to Supabase...');
    const connected = await testSupabaseConnection();

    if (!connected) {
      throw new Error('Failed to connect to Supabase');
    }
    console.log('   ✓ Connected successfully');
    console.log();

    // Get Supabase client
    const supabase = getSupabaseClient();

    // Test each table
    console.log('🗄️  Checking database tables...');

    const tables = [
      'user_settings',
      'subscriptions',
      'videos',
      'summaries',
      'notification_logs',
    ];

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          throw error;
        }

        console.log(`   ✓ ${table.padEnd(20)} - ${count || 0} rows`);
      } catch (error: any) {
        console.log(`   ✗ ${table.padEnd(20)} - ERROR: ${error.message}`);
        throw new Error(`Table ${table} is not accessible`);
      }
    }

    console.log();
    console.log('✅ All tests passed! You can now run migration.');
    console.log();
    console.log('Next steps:');
    console.log('   1. Backup your JSON files (optional)');
    console.log('   2. Run: npm run db:migrate');
    console.log('   3. Set USE_DATABASE=true in .env');
    console.log('   4. Restart your server');
    console.log();
  } catch (error) {
    console.error('\n❌ Connection test failed:', error);
    console.error('\nPlease check:');
    console.error('   1. SUPABASE_URL is correct');
    console.error('   2. SUPABASE_SERVICE_KEY is correct');
    console.error('   3. Database schema is created (run 001_initial_schema.sql)');
    console.error('   4. RLS policies are configured correctly');
    console.error();
    process.exit(1);
  }
}

// Run test
testConnection();
