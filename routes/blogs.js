let express = require('express');
let informationDB = require('../models/information_db');
let router = express.Router();
let bodyParser = require('body-parser');
let urlencodedParser = bodyParser.urlencoded({ extended: false });
var ObjectID = require('mongodb').ObjectID;

// 跨域header设定
router.all('*', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
	res.header("X-Powered-By",' 3.2.1')
	res.header("Content-Type", "application/json;charset=utf-8");
	next();
});

// 获取发帖
router.get('/postblogs', urlencodedParser, async function (req, res, next) {
	let params = req.query;
	console.log(params);
	let collection = await informationDB.getCollection("POSTBLOGS");
	if (params.describe == 'getPostBlogs') {
		let page = parseInt(params.page);
		collection.find().sort(['_id', 1]).skip(page*10).limit(10).toArray(function (err, data) {
            // console.log(data);
			res.status(200).json({
				"PostBlogs": data
			});
        });
	}
	else {
		res.status(400).json({ "code": "-1" });
	}
});

// 获取回帖
router.get('/replyblogs', urlencodedParser, async function (req, res, next) {
	let params = req.query;
	console.log(params);
	let collection = await informationDB.getCollection("REPLYBLOGS");
	if (params.describe == 'getReplyBlogs') {
		let page = parseInt(params.page);
		if (page === 0) {
			collection.find({themeId: params.themeId}).sort(['_id', 1]).limit(3).toArray(function (err, data) {
				res.status(200).json({
					"replyBlogs": data
				});
			});
			
		}
		else {
			collection.find({themeId: params.themeId}).sort(['_id', 1]).skip(page*10-7).limit(10).toArray(function (err, data) {
				res.status(200).json({
					"replyBlogs": data
				});
			});
		}
		console.log(replyBlogs);
		res.status(200).json({
			"replyBlogs": replyBlogs
		});
	}
	else {
		res.status(400).json({ "code": "-1" });
	}
});

//发帖
router.post('/postblogs', urlencodedParser, async function (req, res, next) {
	// 获取req.body传来的信息，暂存在postBlog中
	let postBlog = {
		theme: req.body.theme,
		contant: req.body.contant,
		poster: req.body.poster
	}

	let collection = await informationDB.getCollection("POSTBLOGS");
	collection.insertOne({
		theme: postBlog.theme,
		contant: postBlog.contant,
		poster: postBlog.poster,
		time: getNowFormatDate(),
		replyBlogsId: [],
		like: []
	});
	res.status(200).json({ "code": "1" });
});

//回帖
router.post('/replyblogs', urlencodedParser, async function (req, res, next) {
	// 获取req.body传来的信息，暂存在replyBlog中
	let replyBlog = {
		themeId: req.body.themeId,
		contant: req.body.contant,
		poster: req.body.poster
	}

	//添加回帖
	let replyCollection = await informationDB.getCollection("REPLYBLOGS");
	replyCollection.insertOne({
		themeId: replyBlog.themeId,
		contant: replyBlog.contant,
		poster: replyBlog.poster,
		time: getNowFormatDate(),
		like: []
	});
	
	let postCollection = await informationDB.getCollection("POSTBLOGS");

	replyCollection.find({themeId: replyBlog.themeId, contant: replyBlog.contant, poster: replyBlog.poster}).sort(['_id', 1]).toArray(function (err, replyData) {

		// console.log(replyData);
		let replyId = replyData[replyData.length-1]._id.toString();
		//将评论加入发帖中
		postCollection.findOne({ _id: ObjectID(replyBlog.themeId) }, function (err, data) {

			if (data) {
				let replyBlogsId = data.replyBlogsId;
				replyBlogsId.push(replyId);
				postCollection.save({
					_id: ObjectID(data._id),
					theme: data.theme,
					contant: data.contant,
					poster: data.poster,
					time: data.time,
					replyBlogsId: replyBlogsId,
					like: data.like
				}, function () {
					res.status(200).json({ "code": "1" });
				})
			}
			else {
				res.status(400).json({ "code": "-1" });
			}
		});
	});
});


//点赞/取消点赞
router.post('/like', urlencodedParser, async function (req, res, next) {
	// 获取req.body传来的信息，暂存在likeBlog中
	let likeBlog = {
		describe: req.body.describe,
		id: req.body.id,
		themeId: req.body.themeId
	}

	let postCollection = await informationDB.getCollection("POSTBLOGS");
	let replyCollection = await informationDB.getCollection("REPLYBLOGS");

	if (likeBlog.describe == 'post') {
		//将点赞加入发帖中
		postCollection.findOne({ _id: ObjectID(likeBlog.themeId) }, function (err, data) {
			if (data) {
				let likeIds = data.like;
				if(likeIds.indexOf(likeBlog.id) > -1) {
					console.log(likeIds);
					likeIds.remove(likeBlog.id);
					console.log(likeIds);
				}
				else {
					likeIds.push(likeBlog.id);
				}
				postCollection.save({
					_id: ObjectID(data._id),
					theme: data.theme,
					contant: data.contant,
					poster: data.poster,
					time: data.time,
					replyBlogsId: data.replyBlogsId,
					like: likeIds
				}, function () {
					res.status(200).json({ "code": "1" });
				})
			}
			else {
				res.status(400).json({ "code": "-1" });
			}
		});
	}

	if (likeBlog.describe == 'reply') {
		//将点赞加入发帖中
		replyCollection.findOne({ _id: ObjectID(likeBlog.themeId) }, function (err, data) {
			if (data) {
				let likeIds = data.like;
				if(likeIds.indexOf(likeBlog.id) > -1) {
					likeIds.remove(likeBlog.id);
				}
				else {
					likeIds.push(likeBlog.id);
				}
				replyCollection.save({
					_id: ObjectID(data._id),
					themeId: data.themeId,
					contant: data.contant,
					poster: data.poster,
					time: data.time,
					like: likeIds
				}, function () {
					res.status(200).json({ "code": "1" });
				})
			}
			else {
				res.status(400).json({ "code": "-1" });
			}
		});
	}


});


function getNowFormatDate() {
	var date = new Date();
	var seperator1 = "-";
	var year = date.getFullYear();
	var month = date.getMonth() + 1;
	var strDate = date.getDate();
	if (month >= 1 && month <= 9) {
		month = "0" + month;
	}
	if (strDate >= 0 && strDate <= 9) {
		strDate = "0" + strDate;
	}
	var currentdate = year + seperator1 + month + seperator1 + strDate;
	return currentdate;
}

Array.prototype.indexOf = function(val) {
    for (var i = 0; i < this.length; i++) {
          if (this[i] == val) return i;
    }
    return -1;
};

Array.prototype.remove = function(val) {
    var index = this.indexOf(val);
    if (index > -1) {
        this.splice(index, 1);
    }
};

module.exports = router;