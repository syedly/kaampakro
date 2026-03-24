import mongoose from "mongoose"

const MONGO_URI = process.env.MONGO_URI!

if (!MONGO_URI) {
  throw new Error("MONGO_URI is not defined in environment variables")
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn: typeof mongoose | null
}

let cached = global._mongooseConn

export async function connectDB(): Promise<typeof mongoose> {
  if (cached) return cached

  cached = await mongoose.connect(MONGO_URI, {
    bufferCommands: false,
  })

  global._mongooseConn = cached
  return cached
}
