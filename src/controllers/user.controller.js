const User = require("../schema/user.schema");
const Post = require("../schema/post.schema");

module.exports.getUsersWithPostCount = async (req, res) => {
  try {
    //TODO: Implement this API
    const limit = req.limit || 10;
    const page = req.page || 1;
    const skip = (page - 1) * limit;

    const users = await User.find({}).limit(limit).skip(skip);

    const userIds = users.map((user) => user._id);

    const postCounts = await Post.aggregate([
      {
        $match: {
          userId: { $in: userIds },
        },
      },
      {
        $group: {
          _id: "$userId",
          count: { $sum: 1 },
        },
      },
    ]);

    const userData = users.map((user) => {
      const postCount = postCounts.find(
        (count) => count._id.toString() === user._id.toString()
      );
      return {
        _id: user._id,
        name: user.name,
        posts: postCount ? postCount.count : 0,
      };
    });

    const totalDocs = userIds.length;
    const totalPages = Math.ceil(totalDocs / limit);
    const hasNextPage = page < totalPages;

    const pagination = {
      totalDocs: totalDocs,
      limit: limit,
      page: page,
      totalPages: totalPages,
      pagingCounter: skip + 1,
      hasPrevPage: page > 1,
      hasNextPage: hasNextPage,
      prevPage: page > 1 ? page - 1 : null,
      nextPage: hasNextPage ? page + 1 : null,
    };

    res.status(200).json({ data: { users: userData, pagination } });
  } catch (error) {
    res.send({ error: error.message });
  }
};
