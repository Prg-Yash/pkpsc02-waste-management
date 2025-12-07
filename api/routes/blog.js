import express from "express";
import multer from "multer";
import { prisma } from "../lib/prisma.js";
import { uploadToS3 } from "../lib/s3Uploader.js";

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed"));
        }
    },
});

/**
 * Helper function to generate slug from title
 */
function generateSlug(title) {
    const timestamp = Date.now();
    const slugTitle = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    return `${slugTitle}-${timestamp}`;
}

/**
 * Helper function to calculate read time
 */
function calculateReadTime(content) {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
}

/**
 * GET /api/blog
 * Get all blog posts with optional filters
 */
router.get("/", async (req, res) => {
    try {
        const {
            category,
            tag,
            featured,
            published = "true",
            limit = "20",
            offset = "0",
            sortBy = "createdAt",
            order = "desc",
        } = req.query;

        const filters = {
            published: published === "true",
        };

        if (category) {
            filters.category = category;
        }

        if (tag) {
            filters.tags = {
                has: tag,
            };
        }

        if (featured) {
            filters.featured = featured === "true";
        }

        const posts = await prisma.blogPost.findMany({
            where: filters,
            orderBy: {
                [sortBy]: order,
            },
            take: parseInt(limit),
            skip: parseInt(offset),
            select: {
                id: true,
                slug: true,
                title: true,
                excerpt: true,
                imageUrl: true,
                author: true,
                authorRole: true,
                category: true,
                tags: true,
                readTime: true,
                featured: true,
                views: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        const total = await prisma.blogPost.count({
            where: filters,
        });

        res.json({
            success: true,
            posts,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
        });
    } catch (error) {
        console.error("Error fetching blog posts:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch blog posts",
            details: error.message,
        });
    }
});

/**
 * GET /api/blog/categories
 * Get all unique categories
 */
router.get("/categories", async (req, res) => {
    try {
        const categories = await prisma.blogPost.findMany({
            where: { published: true },
            select: { category: true },
            distinct: ["category"],
        });

        res.json({
            success: true,
            categories: categories.map((c) => c.category).sort(),
        });
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch categories",
        });
    }
});

/**
 * GET /api/blog/tags
 * Get all unique tags
 */
router.get("/tags", async (req, res) => {
    try {
        const posts = await prisma.blogPost.findMany({
            where: { published: true },
            select: { tags: true },
        });

        const allTags = new Set();
        posts.forEach((post) => {
            post.tags.forEach((tag) => allTags.add(tag));
        });

        res.json({
            success: true,
            tags: Array.from(allTags).sort(),
        });
    } catch (error) {
        console.error("Error fetching tags:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch tags",
        });
    }
});

/**
 * GET /api/blog/:slug
 * Get a single blog post by slug
 */
router.get("/:slug", async (req, res) => {
    try {
        const { slug } = req.params;

        const post = await prisma.blogPost.findUnique({
            where: { slug },
        });

        if (!post) {
            return res.status(404).json({
                success: false,
                error: "Blog post not found",
            });
        }

        // Increment view count
        await prisma.blogPost.update({
            where: { slug },
            data: { views: { increment: 1 } },
        });

        res.json({
            success: true,
            post,
        });
    } catch (error) {
        console.error("Error fetching blog post:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch blog post",
            details: error.message,
        });
    }
});

/**
 * POST /api/blog
 * Create a new blog post with image upload
 */
router.post("/", upload.single("image"), async (req, res) => {
    try {
        const { title, excerpt, content, category, tags, featured = "false" } = req.body;

        // Validate required fields
        if (!title || !excerpt || !content || !category) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields: title, excerpt, content, category",
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: "Blog image is required",
            });
        }

        // Parse tags (comma-separated string or JSON array)
        let parsedTags = [];
        if (tags) {
            try {
                parsedTags = typeof tags === "string" ? (tags.includes(",") ? tags.split(",").map(t => t.trim()) : JSON.parse(tags)) : tags;
            } catch (e) {
                parsedTags = [tags];
            }
        }

        // Generate slug
        const slug = generateSlug(title);

        // Calculate read time
        const readTime = calculateReadTime(content);

        // Upload image to S3
        const s3Result = await uploadToS3(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            `blog-posts/${slug}`
        );

        // Create blog post in database
        const blogPost = await prisma.blogPost.create({
            data: {
                slug,
                title,
                excerpt,
                content,
                imageUrl: s3Result.url,
                category,
                tags: parsedTags,
                readTime,
                featured: featured === "true" || featured === true,
                author: "Admin",
                authorRole: "Content Writer",
            },
        });

        res.status(201).json({
            success: true,
            message: "Blog post created successfully",
            post: blogPost,
        });
    } catch (error) {
        console.error("Error creating blog post:", error);
        res.status(500).json({
            success: false,
            error: "Failed to create blog post",
            details: error.message,
        });
    }
});

/**
 * PATCH /api/blog/:slug
 * Update a blog post
 */
router.patch("/:slug", upload.single("image"), async (req, res) => {
    try {
        const { slug } = req.params;
        const { title, excerpt, content, category, tags, featured, published } = req.body;

        // Check if blog post exists
        const existingPost = await prisma.blogPost.findUnique({
            where: { slug },
        });

        if (!existingPost) {
            return res.status(404).json({
                success: false,
                error: "Blog post not found",
            });
        }

        // Prepare update data
        const updateData = {};

        if (title) {
            updateData.title = title;
            // Regenerate slug if title changed
            updateData.slug = generateSlug(title);
        }
        if (excerpt) updateData.excerpt = excerpt;
        if (content) {
            updateData.content = content;
            updateData.readTime = calculateReadTime(content);
        }
        if (category) updateData.category = category;
        if (tags) {
            try {
                updateData.tags = typeof tags === "string" ? (tags.includes(",") ? tags.split(",").map(t => t.trim()) : JSON.parse(tags)) : tags;
            } catch (e) {
                updateData.tags = [tags];
            }
        }
        if (featured !== undefined) updateData.featured = featured === "true" || featured === true;
        if (published !== undefined) updateData.published = published === "true" || published === true;

        // Upload new image if provided
        if (req.file) {
            const s3Result = await uploadToS3(
                req.file.buffer,
                req.file.originalname,
                req.file.mimetype,
                `blog-posts/${updateData.slug || slug}`
            );
            updateData.imageUrl = s3Result.url;
        }

        // Update blog post
        const updatedPost = await prisma.blogPost.update({
            where: { slug },
            data: updateData,
        });

        res.json({
            success: true,
            message: "Blog post updated successfully",
            post: updatedPost,
        });
    } catch (error) {
        console.error("Error updating blog post:", error);
        res.status(500).json({
            success: false,
            error: "Failed to update blog post",
            details: error.message,
        });
    }
});

/**
 * DELETE /api/blog/:slug
 * Delete a blog post
 */
router.delete("/:slug", async (req, res) => {
    try {
        const { slug } = req.params;

        // Check if blog post exists
        const existingPost = await prisma.blogPost.findUnique({
            where: { slug },
        });

        if (!existingPost) {
            return res.status(404).json({
                success: false,
                error: "Blog post not found",
            });
        }

        // Delete blog post
        await prisma.blogPost.delete({
            where: { slug },
        });

        res.json({
            success: true,
            message: "Blog post deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting blog post:", error);
        res.status(500).json({
            success: false,
            error: "Failed to delete blog post",
            details: error.message,
        });
    }
});

export default router;
