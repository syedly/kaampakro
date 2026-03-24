import mongoose, { Schema, Document, Model, Types } from "mongoose"

export interface ICoverLetter extends Document {
  userId: Types.ObjectId
  title: string
  company?: string
  jobDescription: string
  generatedText: string
  templateId?: Types.ObjectId | null
  templateName?: string
  isDraft: boolean
  wordCount: number
  createdAt: Date
  updatedAt: Date
}

const CoverLetterSchema = new Schema<ICoverLetter>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    company: { type: String, trim: true },
    jobDescription: { type: String, required: true },
    generatedText: { type: String, required: true },
    templateId: { type: Schema.Types.ObjectId, ref: "Template", default: null },
    templateName: { type: String, trim: true },
    isDraft: { type: Boolean, default: false },
    wordCount: { type: Number, default: 0 },
  },
  { timestamps: true }
)

const CoverLetter: Model<ICoverLetter> =
  mongoose.models.CoverLetter ||
  mongoose.model<ICoverLetter>("CoverLetter", CoverLetterSchema)

export default CoverLetter
