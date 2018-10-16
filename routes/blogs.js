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
		// let page = parseInt(params.page);
		collection.find({board: params.board, isTop: "0"}).sort(['_id', -1]).toArray(function (err, data) {
            console.log(data);
			res.status(200).json({
				"PostBlogs": data
			});
        });
	}
	else {
		res.status(200).json({ "code": "-1" });
	}
});

// 获取置顶帖
router.get('/postblogs/top', urlencodedParser, async function (req, res, next) {
	let params = req.query;
	console.log(params);
	let collection = await informationDB.getCollection("POSTBLOGS");
	if (params.describe == 'getPostBlogs') {
		// let page = parseInt(params.page);
		collection.find({board: params.board, isTop: "1"}).sort(['_id', -1]).toArray(function (err, data) {
            console.log(data);
			res.status(200).json({
				"PostBlogs": data
			});
        });
	}
	else {
		res.status(200).json({ "code": "-1" });
	}
});

// 获取精华帖子
router.get('/postblogs/essence', urlencodedParser, async function (req, res, next) {
	let params = req.query;
	console.log(params);
	let collection = await informationDB.getCollection("POSTBLOGS");
	if (params.describe == 'getPostBlogs') {
		// let page = parseInt(params.page);
		collection.find({board: params.board, isEssence: "1"}).sort(['_id', -1]).toArray(function (err, data) {
            console.log(data);
			res.status(200).json({
				"PostBlogs": data
			});
        });
	}
	else {
		res.status(200).json({ "code": "-1" });
	}
});


// 根据用户id获取发帖
router.get('/user/postblogs', urlencodedParser, async function (req, res, next) {
	let params = req.query;
	console.log(params);
	let collection = await informationDB.getCollection("POSTBLOGS");
	if (params.describe == 'getPostBlogsByid') {
		// let page = parseInt(params.page);
		collection.find({"poster.id":params.id}).sort(['_id', -1]).toArray(function (err, data) {
            console.log(data);
			res.status(200).json({
				"PostBlogs": data
			});
        });
	}
	else {
		res.status(200).json({ "code": "-1" });
	}
});


// 获取部分板块信息
router.get('/boards', urlencodedParser, async function (req, res, next) {
	let params = req.query;
	console.log(params);
	let collection = await informationDB.getCollection("BOARDS");
	if (params.describe == 'getBoards') {
		collection.find({isSystem: params.isSystem}).sort(['_id', 1]).toArray(function (err, data) {
            console.log(data);
			res.status(200).json({
				"Boards": data
			});
        });
	}
	else {
		res.status(200).json({ "code": "-1" });
	}
});

// 获取所有板块信息
router.get('/allBoards', urlencodedParser, async function (req, res, next) {
	let collection = await informationDB.getCollection("BOARDS");
	collection.find().sort(['_id', 1]).toArray(function (err, data) {
		console.log(data);
		res.status(200).json({
			"Boards": data
		});
	});
});

// 获取回帖
router.get('/replyblogs', urlencodedParser, async function (req, res, next) {
	let params = req.query;
	console.log(params);
	let collection = await informationDB.getCollection("REPLYBLOGS");
	let postCollection = await informationDB.getCollection("POSTBLOGS");

	if (params.describe == 'getReplyBlogs') {
		// let page = parseInt(params.page);

		if (!params.themeId) {
			res.status(200).json({ "code": "-1" });
		}
		else {
			collection.find({themeId: params.themeId}).sort(['_id', -1]).toArray(function (err, replydata) {
				postCollection.find({_id: ObjectID(params.themeId)}).toArray(function (err, postdata) {
					res.status(200).json({
						"postBlogs": postdata[0],
						"replyBlogs": replydata
					});
				});
			});	
		}
	}
	else {
		res.status(200).json({ "code": "-1" });
	}
});

//新建板块
router.post('/newBoard', urlencodedParser, async function (req, res, next) {
	// 获取req.body传来的信息，暂存在postBlog中
	let board = {
		name: req.body.name,
		description: req.body.description,
		picture: req.body.picture,
		isSystem: req.body.isSystem
	}

	console.log(board);

	let collection = await informationDB.getCollection("BOARDS");

	collection.insertOne({
		name: board.name,
		description: board.description,
		time: getDate(),
		picture: board.picture,
		isSystem: board.isSystem
	});
	res.status(200).json({ "code": "1" });

});

//修改板块信息
router.post('/board/edit', urlencodedParser, async function (req, res, next) {
	let board = {
		_id: req.body.id,
		name: req.body.name,
		description: req.body.description
	}
	console.log(board)
	let collection = await informationDB.getCollection("BOARDS");
	collection.findOne({ _id: ObjectID(board._id) }, function (err, data) {
		if (!data) {
			res.status(200).json({ "code": "-1" })
		} else {
			collection.save({
				_id: ObjectID(data._id),
				name: board.name,
				description: board.description,
				time: data.time,
				picture: data.picture,
				isSystem: data.isSystem
			},function () {
				res.status(200).json({ "code": "1" })
			});
		}
	});
});
// 删除板块
router.post('/board/remove', urlencodedParser, async function (req, res, next) {
    let Id  =  req.body.id;

    console.log(Id);

    let collection = await informationDB.getCollection("BOARDS");
    collection.findOne({ _id: ObjectID(Id) }, function (err, data) {
        if (!data) {
            res.status(200).json({ "code":"0","msg": "not found" })
        } else {
            collection.remove({_id: ObjectID(Id)},function () {
                res.status(200).json({  "code":"1", "msg": "delete success" });
                });
        }
    });

});

// 删除发帖
router.delete('/postblogs/delete', urlencodedParser, async function (req, res, next) {
    let Id  =  req.body.id;

    console.log(Id);

    let collection = await informationDB.getCollection("POSTBLOGS");
    collection.findOne({ _id: ObjectID(Id) }, function (err, data) {
        if (!data) {
            res.status(200).json({"code":"0", "msg": "not found" })
        } else {
            collection.remove({_id: ObjectID(Id)},function () {
                res.status(200).json({ "code":"1","msg": "delete success" });
                });
        }
    });

});



//发帖
router.post('/postblogs', urlencodedParser, async function (req, res, next) {
	// 获取req.body传来的信息，暂存在postBlog中
	let postBlog = {
		theme: req.body.theme,
		content: req.body.content,
		poster: req.body.poster,
		board: req.body.board,
		picture: req.body.picture
	}

	let collection = await informationDB.getCollection("POSTBLOGS");
	let accountCollection = await informationDB.getCollection("ACCOUNT");

	accountCollection.findOne({ id: postBlog.poster }, function (err, data) {
		collection.insertOne({
			theme: postBlog.theme,
			content: postBlog.content,
			poster: {
				id: postBlog.poster,
				headimg: data.headimg,
				nickName: data.nickName,
			},
			time: getDate(),
			replyBlogsId: [],
			likeIds: [],
			likePicture: [],
			likenumber: 0,
			board: postBlog.board,
			picture: postBlog.picture,
			isTop: "0",
			isEssence: "0"
		});
		res.status(200).json({ "code": "1" });
	});
});

//回帖
router.post('/replyblogs', urlencodedParser, async function (req, res, next) {
	// 获取req.body传来的信息，暂存在replyBlog中
	let replyBlog = {
		themeId: req.body.themeId,
		content: req.body.content,
		poster: req.body.poster
	}

	//添加回帖
	let replyCollection = await informationDB.getCollection("REPLYBLOGS");
	let accountCollection = await informationDB.getCollection("ACCOUNT");
	let postCollection = await informationDB.getCollection("POSTBLOGS");
	let newsCollection = await informationDB.getCollection("NEWS");

	accountCollection.findOne({ id: replyBlog.poster }, function (err, data) {
		replyCollection.insertOne({
			themeId: replyBlog.themeId,
			content: replyBlog.content,
			poster: {
				id: replyBlog.poster,
				headimg: data.headimg,
				nickName: data.nickName,
			},
			time: getDate(),
			likeIds: [],
			likePicture: [],
			likenumber: 0
		}, function () {
			replyCollection.find({themeId: replyBlog.themeId, content: replyBlog.content}).sort(['_id', 1]).toArray(function (err, replyData) {

				console.log(replyData);
				let replyId = replyData[replyData.length-1]._id.toString();
				//将评论加入发帖中
				postCollection.findOne({ _id: ObjectID(replyBlog.themeId) }, function (err, data) {
		
					if (data) {
						let replyBlogsId = data.replyBlogsId;
						replyBlogsId.push(replyId);
						postCollection.save({
							_id: ObjectID(data._id),
							theme: data.theme,
							content: data.content,
							poster: data.poster,
							time: data.time,
							replyBlogsId: replyBlogsId,
							likeIds: data.likeIds,
							likePicture: data.likePicture,
							likenumber: data.likenumber,
							board: data.board,
							picture: data.picture,
							isTop: data.isTop,
							isEssence: data.isEssence
						}, function () {
							//发送消息
							accountCollection.findOne({ id: replyBlog.poster }, function (err, userData) {
								if (!userData) {
									res.status(200).json({ "code": "-1" , "msg": "查无此人"});
								}
								else {
									newsCollection.insertOne({
										toId: data.poster.id,
										poster: userData,
										read: "0",
										option: "回复",
										content: replyBlog.content,
										time: getDate(),
										details: data
									}, function () {
										res.status(200).json({ "code": "1" });
									})
								}
							})
						})
					}
					else {
						res.status(200).json({ "code": "-1" });
					}
				});
			});
		});
	});

});



//点赞/取消点赞
router.post('/like', urlencodedParser, async function (req, res, next) {
	// 获取req.body传来的信息，暂存在likeBlog中
	let likeBlog = {
		describe: req.body.describe,
		id: req.body.id,
		themeId: req.body.themeId,
		headimg: req.body.headimg
	}

	let postCollection = await informationDB.getCollection("POSTBLOGS");
	let replyCollection = await informationDB.getCollection("REPLYBLOGS");
	let newsCollection = await informationDB.getCollection("NEWS");
	let accountCollection = await informationDB.getCollection("ACCOUNT");

	if (likeBlog.describe == 'post') {
		//将点赞加入发帖中
		postCollection.findOne({ _id: ObjectID(likeBlog.themeId) }, function (err, data) {
			if (data) {
				let likeIds = data.likeIds;
				let likePicture = data.likePicture;
				let likenumber = data.likenumber;
				if(likeIds.indexOf(likeBlog.id) > -1) {
					console.log(likeIds);
					likeIds.remove(likeBlog.id);
					likePicture.remove(likeBlog.headimg);
					console.log(likeIds);
				}
				else {
					likeIds.push(likeBlog.id);
					if (likePicture.length <= 6) {
						likePicture.push(likeBlog.headimg);
					}
				}
				likenumber = likeIds.length;

				postCollection.save({
					_id: ObjectID(data._id),
					theme: data.theme,
					content: data.content,
					poster: data.poster,
					time: data.time,
					replyBlogsId: data.replyBlogsId,
					likeIds: likeIds,
					likePicture: likePicture,
					likenumber: likenumber,
					board: data.board,
					picture: data.picture,
					isTop: data.isTop,
					isEssence: data.isEssence
				}, function () {
					//发送消息
					accountCollection.findOne({ id: likeBlog.id }, function (err, userData) {
						if (!userData) {
							res.status(200).json({ "code": "-1" , "msg": "查无此人"});
						}
						else {
							newsCollection.insertOne({
								toId: data.poster.id,
								poster: userData,
								read: "0",
								option: "点赞发帖",
								content: "点赞发帖",
								time: getDate(),
								details: data
							}, function () {
								res.status(200).json({ "code": "1" });
							})
						}
					})
				})
			}
			else {
				res.status(200).json({ "code": "-1" });
			}
		});
	}

	if (likeBlog.describe == 'reply') {
		//将点赞加入回帖中
		replyCollection.findOne({ _id: ObjectID(likeBlog.themeId) }, function (err, data) {
			if (data) {
				let likeIds = data.likeIds;
				let likePicture = data.likePicture;
				let likenumber = data.likenumber;
				if(likeIds.indexOf(likeBlog.id) > -1) {
					likeIds.remove(likeBlog.id);
					likePicture.remove(likeBlog.headimg);
				}
				else {
					likeIds.push(likeBlog.id);
					if (likePicture.length <= 6) {
						likePicture.push(likeBlog.headimg);
					}
				}
				likenumber = likeIds.length;
				replyCollection.save({
					_id: ObjectID(data._id),
					themeId: data.themeId,
					content: data.content,
					poster: data.poster,
					time: data.time,
					likeIds: likeIds,
					likePicture: likePicture,
					likenumber: likenumber
				}, function () {
					//发送消息
					accountCollection.findOne({ id: likeBlog.id }, function (err, userData) {
						if (!userData) {
							res.status(200).json({ "code": "-1" , "msg": "查无此人"});
						}
						else {
							newsCollection.insertOne({
								toId: data.poster.id,
								poster: userData,
								read: "0",
								option: "点赞回帖",
								content: "点赞回帖",
								time: getDate(),
								details: data
							}, function () {
								res.status(200).json({ "code": "1" });
							})
						}
					})
				})
			}
			else {
				res.status(200).json({ "code": "-1" });
			}
		});
	}


});


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

function getDate(){
	nowDate = new Date();
	var nowMonth = nowDate.getMonth()+1;
	nowDateArray = {
		year: nowDate.getFullYear(),
		month: nowMonth>9?nowMonth:"0"+nowMonth,
		day: nowDate.getDate()>9?nowDate.getDate() :"0"+nowDate.getDate(),
		hour: nowDate.getHours()>9?nowDate.getHours() :"0"+nowDate.getHours(),
		minutes: nowDate.getMinutes()>9?nowDate.getMinutes() :"0"+nowDate.getMinutes(),
		second: nowDate.getSeconds()>9?nowDate.getSeconds() :"0"+nowDate.getSeconds()
	}

    return nowDateArray ;
}

module.exports = router;