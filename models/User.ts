import mongoose, { Schema, Document, Model } from "mongoose"

export interface IUser extends Document {
  name: string
  email: string
  password: string
  phone?: string
  location?: string
  linkedin?: string
  summary?: string
  skills: string[]
  education: {
    institution: string
    degree: string
    field: string
    startYear: string
    endYear: string
  }[]
  experience: {
    company: string
    title: string
    location: string
    startDate: string
    endDate: string
    description: string
  }[]
  projects: {
    name: string
    description: string
    url: string
    technologies: string
  }[]
  apiKey?: string
  usageCount: number
  resetDate: Date
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, trim: true },
    location: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    summary: { type: String, trim: true },
    skills: [{ type: String, trim: true }],
    education: [
      {
        institution: String,
        degree: String,
        field: String,
        startYear: String,
        endYear: String,
      },
    ],
    experience: [
      {
        company: String,
        title: String,
        location: String,
        startDate: String,
        endDate: String,
        description: String,
      },
    ],
    projects: [
      {
        name: String,
        description: String,
        url: String,
        technologies: String,
      },
    ],
    apiKey: { type: String, default: null },
    usageCount: { type: Number, default: 0 },
    resetDate: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
)

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema)

export default User
