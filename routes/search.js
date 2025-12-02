const router = require("express").Router();
const Blog = require("../models/blog");
const User = require("../models/user");

router.get("/", async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.render("search", {
      user: req.user || null,
      blogs: [],
      query: "",
    });
  }

  // Find authors matching search
  const matchingUsers = await User.find({
    fullname: { $regex: query, $options: "i" }
  }).select("_id");

  const authorIds = matchingUsers.map(u => u._id);

  // Search in multiple fields
  const blogs = await Blog.find({
    $or: [
      { title: { $regex: query, $options: "i" } },
      { body: { $regex: query, $options: "i" } },
      { category: { $regex: query, $options: "i" } },
      { createdBy: { $in: authorIds } }
    ]
  })
    .populate("createdBy", "fullname profileImageURL")
    .sort({ createdAt: -1 });

  res.render("search", {
    user: req.user || null,
    blogs,
    query,
  });
});

module.exports = router;
