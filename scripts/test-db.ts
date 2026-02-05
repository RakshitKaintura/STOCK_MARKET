import dotenv from 'dotenv';

// 1. Load Environment Variables
dotenv.config({ path: '.env.local' });

async function main() {
  // 2. Dynamic Import: This forces the file to load AFTER variables are set
  const { connectToDatabase } = await import("../database/mongoose");

  try {
   
    
    await connectToDatabase();
    
    console.log("✅ OK: Database connection succeeded");
    process.exit(0);
  } catch (err) {
    console.error("❌ ERROR: Database connection failed");
    console.error(err);
    process.exit(1);
  }
}

main();