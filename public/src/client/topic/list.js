'use strict';

define('forum/topics/list', [
	'forum/infinitescroll', 'benchpress', 'api', 'bootbox', 'alerts', 'utils', 'socket',
], function (infinitescroll, Benchpress, api, bootbox, alerts, utils, socket) { // Added 'utils' and 'socket'
	const Topics = {};

	Topics.init = function () {
		infinitescroll.init(Topics.loadMoreTopics);

		// Topic creation
		$('button[data-action="new"]').on('click', function () {
			bootbox.prompt('[[topics:new-topic.topic-name]]', function (title) {
				if (title && title.length) {
					api.post('/topics', {
						title: title,
					}).then((res) => {
						ajaxify.go('topic/' + res.slug);
					}).catch(alerts.error);
				}
			});
		});

		const params = utils.params();
		$('#search-sort').val(params.sort || 'alpha');

		// Topic searching
		$('#search-text').on('keyup', Topics.search);
		$('#submit-search-button').on('click', Topics.search);
		$('#search-sort').on('change', function () {
			ajaxify.go('topics?sort=' + $('#search-sort').val());
		});
	};

	Topics.loadMoreTopics = function (direction) {
		if (direction < 0) {
			return;
		}

		infinitescroll.loadMore('/topics', {
			sort: $('#search-sort').val(),
			after: $('[component="topics/container"]').attr('data-nextstart'),
		}, function (data, done) {
			if (data && data.topics.length) {
				Benchpress.render('partials/topics/list', {
					topics: data.topics,
				}).then(function (html) {
					$('#topics-list').append(html);
					done();
				});
			} else {
				done();
			}

			if (data && data.nextStart) {
				$('[component="topics/container"]').attr('data-nextstart', data.nextStart);
			}
		});
	};

	Topics.search = function () {
		const topicsEl = $('#topics-list');
		const queryEl = $('#search-text');
		const sortEl = $('#search-sort');

		socket.emit('topics.search', {
			query: queryEl.val(),
			options: {
				sort: sortEl.val(),
				filterHidden: true,
				showMembers: true,
				hideEphemeralTopics: true,
			},
		}, function (err, topics) {
			if (err) {
				return alerts.error(err);
			}

			// Filter out topics you don't want to display
			topics = topics.filter(function (topic) {
				return topic.title !== 'off-topic' && topic.title !== 'guests';
			});

			Benchpress.render('partials/topics/list', {
				topics: topics,
			}).then(function (html) {
				topicsEl.empty().append(html);
			});
		});
		return false;
	};

	return Topics;
});
