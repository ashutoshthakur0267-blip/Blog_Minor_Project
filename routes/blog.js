const { Router } = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Blog = require("../models/blog");
const Comment = require("../models/comment");

const router = Router();

// ==================== Multer Storage =====================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!req.user) return cb(new Error("Unauthorized"));
    const uploadPath = path.resolve(`./public/uploads/${req.user._id}`);
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage });

// ==================== Add New Blog Page =====================
router.get("/add-new", (req, res) => {
  if (!req.user) return res.redirect("/user/signin");
  return res.render("addBlog", { user: req.user });
});

// ==================== Create Blog =====================
router.post("/", upload.single("coverImage"), async (req, res) => {
  if (!req.user) return res.redirect("/user/signin");

  const { title, body,category } = req.body;

  // ⭐ Calculate reading time
  const wordCount = body.trim().split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);

  const coverImageURL = req.file
    ? `/uploads/${req.user._id}/${req.file.filename}`
    : null;

  const blog = await Blog.create({
    title,
    body,
    createdBy: req.user._id,
    coverImageURL,
    readingTime, // ⭐ Added
    category
  });

  return res.redirect(`/blog/${blog.id}`);
});

// ==================== View Blog =====================
router.get("/:id", async (req, res) => {
  const blog = await Blog.findById(req.params.id).populate("createdBy");
  const comments = await Comment.find({ blogId: req.params.id }).populate("createdBy");

  if (!blog) return res.status(404).send("Blog not found");

  const isOwner =
    req.user && blog.createdBy._id.toString() === req.user._id.toString();

  return res.render("blog", {
    user: req.user,
    blog,
    comments,
    isOwner,
  });
});

// ==================== Add Comment =====================
router.post("/comment/:blogId", async (req, res) => {
  if (!req.user) return res.redirect("/user/signin");

  await Comment.create({
    content: req.body.content,
    blogId: req.params.blogId,
    createdBy: req.user._id,
  });

  return res.redirect(`/blog/${req.params.blogId}`);
});

// ==================== Edit Blog Page =====================
router.get("/edit/:id", async (req, res) => {
  if (!req.user) return res.redirect("/user/signin");

  const blog = await Blog.findById(req.params.id);
  if (!blog) return res.status(404).send("Blog not found");

  if (blog.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).send("Unauthorized");
  }

  return res.render("editBlog", { user: req.user, blog });
});

// ==================== Edit Blog (POST) =====================
router.post("/edit/:id", upload.single("coverImage"), async (req, res) => {
  if (!req.user) return res.redirect("/user/signin");

  const blog = await Blog.findById(req.params.id);
  if (!blog) return res.status(404).send("Blog not found");

  if (blog.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).send("Unauthorized");
  }

  blog.title = req.body.title;
  blog.body = req.body.body;
  blog.category=req.body.category;

  // ⭐ Recalculate reading time on edit
  const wordCount = req.body.body.trim().split(/\s+/).length;
  blog.readingTime = Math.ceil(wordCount / 200);

  if (req.file) {
    blog.coverImageURL = `/uploads/${req.user._id}/${req.file.filename}`;
  }

  await blog.save();
  return res.redirect(`/blog/${blog._id}`);
});

// ==================== Delete Blog =====================
router.post("/delete/:id", async (req, res) => {
  if (!req.user) return res.redirect("/user/signin");

  const blog = await Blog.findById(req.params.id);
  if (!blog) return res.status(404).send("Blog not found");

  if (blog.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).send("Unauthorized");
  }

  await Blog.deleteOne({ _id: req.params.id });
  return res.redirect("/");
});

// ==================== Like / Unlike =====================
router.post("/:id/like", async (req, res) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ success: false, message: "Please log in to like blogs" });
  }

  const blog = await Blog.findById(req.params.id);
  if (!blog) return res.status(404).json({ success: false });

  const userId = req.user._id;
  const hasLiked = blog.likes.includes(userId);

  if (hasLiked) {
    blog.likes.pull(userId);
  } else {
    blog.likes.push(userId);
  }

  await blog.save();

  res.json({
    success: true,
    liked: !hasLiked,
    likesCount: blog.likes.length,
  });
});

module.exports = router;
