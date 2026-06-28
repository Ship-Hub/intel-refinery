console.log("cwd:", process.cwd());
console.log("GROQ_API_KEY raw:", process.env.GROQ_API_KEY ? "SET" : "NOT SET");
console.log("OPENAI_API_KEY raw:", process.env.OPENAI_API_KEY ? "SET" : "NOT SET");

require("dotenv").config();
console.log("After dotenv.config():");
console.log("GROQ_API_KEY:", process.env.GROQ_API_KEY ? "SET" : "NOT SET");
console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "SET" : "NOT SET");
console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "SET" : "NOT SET");

const fs = require("fs");
const envPath = require("path").join(process.cwd(), ".env");
console.log("envPath:", envPath);
console.log(".env exists:", fs.existsSync(envPath));
