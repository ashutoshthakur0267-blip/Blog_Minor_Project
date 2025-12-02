const { Router } = require("express");
const User = require("../models/user");
const Blog = require("../models/blog");

const router = Router();

// ✅ Add Bookmark
router.post("/add/:blogId", async (req, res) => {
  if (!req.user) return res.redirect("/user/signin");

  try {
    const userId = req.user._id;
    const blogId = req.params.blogId;

    await User.findByIdAndUpdate(userId, {
      $addToSet: { bookmarks: blogId }, // prevents duplicates
    });

    return res.redirect(`/blog/${blogId}`);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Error adding bookmark");
  }
});

// ✅ Remove Bookmark
router.post("/remove/:blogId", async (req, res) => {
  if (!req.user) return res.redirect("/user/signin");

  try {
    const userId = req.user._id;
    const blogId = req.params.blogId;

    await User.findByIdAndUpdate(userId, {
      $pull: { bookmarks: blogId },
    });

    return res.redirect(`/blog/${blogId}`);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Error removing bookmark");
  }
});

// ✅ View All Bookmarked Blogs (SAFE & FIXED)
router.get("/my", async (req, res) => {
  if (!req.user) return res.redirect("/user/signin");

  try {
    // Step 1: Safely populate bookmark IDs
    const user = await User.findById(req.user._id).populate("bookmarks");

    // Step 2: Fetch blog documents with author details
    const blogs = await Blog.find({ 
      _id: { $in: user.bookmarks }
    }).populate("createdBy", "fullname profileImageURL");

    return res.render("bookmarks", {
      user: req.user,
      blogs,
    });

  } catch (err) {
    console.error("Bookmark fetch error:", err);
    return res.status(500).send("Error fetching bookmarks");
  }
});

module.exports = router;
