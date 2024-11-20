'use strict';

const db = require('../database');

module.exports = function (Posts) {
	Posts.search = async function (query, options) {
		if (!query) {
			return [];
		}

		query = String(query).toLowerCase();

		const postIds = await db.getSortedSetRangeByScore('posts:pid', 0, -1);
		let posts = await Posts.getPostsData(postIds);

		posts = posts.filter(post => post.content.toLowerCase().includes(query));

		posts = posts.slice(0, 100);

		if (options && options.sort) {
			posts = Posts.sort(options.sort, posts);
		}

		return posts;
	};

	Posts.sort = function (strategy, posts) {
		switch (strategy) {
			case 'date':
				posts.sort((a, b) => b.timestamp - a.timestamp);
				break;
			case 'alpha':
				posts.sort((a, b) => (a.content > b.content ? 1 : -1));
				break;
			default:
				posts.sort((a, b) => b.timestamp - a.timestamp);
		}

		return posts;
	};
};
