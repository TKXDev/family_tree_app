import mongoose from "mongoose";

export interface IRelationship extends mongoose.Document {
  person1_id: string;
  person2_id: string;
  relationship_type: string;
  createdAt: Date;
  updatedAt: Date;
}

const RelationshipSchema = new mongoose.Schema<IRelationship>(
  {
    person1_id: {
      type: String,
      required: [true, "Please provide person1_id"],
      ref: "FamilyMember",
    },
    person2_id: {
      type: String,
      required: [true, "Please provide person2_id"],
      ref: "FamilyMember",
    },
    relationship_type: {
      type: String,
      required: [true, "Please provide relationship type"],
      enum: [
        "parent-child",
        "spouse",
        "sibling",
        "grandparent",
        "cousin",
        "uncle-aunt",
        "nephew-niece",
        "other",
      ],
    },
  },
  { timestamps: true }
);

// Compound index to ensure unique relationships
RelationshipSchema.index(
  { person1_id: 1, person2_id: 1, relationship_type: 1 },
  { unique: true }
);

export default mongoose.models.Relationship ||
  mongoose.model<IRelationship>("Relationship", RelationshipSchema);
