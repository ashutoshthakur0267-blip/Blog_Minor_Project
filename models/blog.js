const mongoose = require("mongoose");

// ✅ Blog Schema
const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
    },
    coverImageURL: {
      type: String,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user", // Reference to User collection
      required: true,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],

    // ⭐️ Reading Time (if already added)
    readingTime: {
      type: Number,
      default: 1,
    },

    // ⭐️ Category (new)
    category: {
      type: String,
      enum: [
        "Technology",
        "Lifestyle",
        "Travel",
        "Education",
        "Sports",
        "Food",
        "Finance",
        "Other"
      ],
      default: "Other",
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

// ✅ Export Model
const Blog = mongoose.model("Blog", blogSchema);

module.exports = Blog;
