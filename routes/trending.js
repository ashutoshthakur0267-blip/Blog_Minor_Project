const router = require("express").Router();
const Blog = require("../models/blog");

// ⭐ TRENDING PAGE (Separate Page)
router.get("/", async (req, res) => {
  try {
    // ⭐ Trending by Likes (Top 10)
    const trendingByLikes = await Blog.find({})
      .populate("createdBy", "fullname profileImageURL")
      .sort({ likes: -1 })
      .limit(10);

    // ⭐ Trending by Comments (Top 10)
    const trendingByComments = await Blog.aggregate([
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "blogId",
          as: "comments",
        },
      },
      {
        $addFields: {
          commentCount: { $size: "$comments" },
        },
      },
      { $sort: { commentCount: -1 } },
      { $limit: 10 },
    ]);

    // Populate createdBy for aggregated blogs
    await Blog.populate(trendingByComments, {
      path: "createdBy",
      select: "fullname profileImageURL",
    });

    // ⭐ Combine and remove duplicates
    const uniqueMap = new Map();
    [...trendingByLikes, ...trendingByComments].forEach((blog) => {
      uniqueMap.set(blog._id.toString(), blog);
    });

    const trending = Array.from(uniqueMap.values());

    return res.render("trending", {
      user: req.user || null,
      trending,
    });
  } catch (err) {
    console.error("Trending Error:", err);
    return res.status(500).send("Error loading trending blogs");
  }
});

module.exports = router;
