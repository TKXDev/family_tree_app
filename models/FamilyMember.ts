import mongoose from "mongoose";

export interface IFamilyMember extends mongoose.Document {
  first_name: string;
  last_name: string;
  birth_date: Date;
  death_date?: Date;
  gender: string;
  generation: number;
  parent_ids: string[];
  spouse_id?: string;
  children_ids: string[];
  photo_url?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FamilyMemberSchema = new mongoose.Schema<IFamilyMember>(
  {
    first_name: {
      type: String,
      required: [true, "Please provide a first name"],
      maxlength: [50, "First name cannot be more than 50 characters"],
    },
    last_name: {
      type: String,
      required: [true, "Please provide a last name"],
      maxlength: [50, "Last name cannot be more than 50 characters"],
    },
    birth_date: {
      type: Date,
      required: [true, "Please provide a birth date"],
    },
    death_date: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: [true, "Please provide a gender"],
    },
    generation: {
      type: Number,
      required: [true, "Please provide a generation number"],
    },
    parent_ids: {
      type: [String],
      default: [],
    },
    spouse_id: {
      type: String,
      default: null,
    },
    children_ids: {
      type: [String],
      default: [],
    },
    photo_url: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.models.FamilyMember ||
  mongoose.model<IFamilyMember>("FamilyMember", FamilyMemberSchema);
