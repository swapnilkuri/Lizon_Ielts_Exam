// supabase-config.js
const SUPABASE_URL = "https://iyamcwbzunwknlvpxxoa.supabase.co"; // Replace with your Project URL
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5YW1jd2J6dW53a25sdnB4eG9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMTA2MTQsImV4cCI6MjEwNDg4NjYxNH0.UD-GIxH5EVv0b9TMIVBit4rAcREFKSXBK1N4Md4yczg"; // Replace with your Project Anon Key

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);