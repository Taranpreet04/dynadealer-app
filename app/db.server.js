import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config()

function dbConnect() {
  const uri = process.env.SHOPIFY_DATABASE_URL || "mongodb://localhost:27017/subscription"
  mongoose.connect(uri).then(() => {
    console.log("subscription connected successfully")
  }).catch((err) => {
    console.log("mongodb connection error")
  })
}
export default dbConnect;
