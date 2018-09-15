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

//根据账户id获取账户信息
router.get('/account', urlencodedParser, async function (req, res, next) {
	let params = req.query;
	console.log(params);
	let collection = await informationDB.getCollection("ACCOUNT");
	collection.findOne({ id: params.id }, function (err, data) {
		if (!data) {
			res.status(400).json({ "code": "-1" })
		} else {
			res.status(200).json({
				_id: data._id,
				id: data.id,
				name: data.name,
				access: data.access,
				// wxInfo: data.wxInfo,
				tel: data.tel,
				college: data.college
			});
		}
	});
});

//根据账户昵称获取账户id
router.get('/account/id', urlencodedParser, async function (req, res, next) {
	let params = req.query;
	let collection = await informationDB.getCollection("ACCOUNT");
	collection.findOne({ name: params.name }, function (err, data) {
		if (!data) {
			res.status(400).json({ "code": "-1" })
		} else {
			res.status(200).json({
				id: data.id
			});
		}
	});
});

//申请时发送账户信息
router.post('/account', urlencodedParser, async function (req, res, next) {
	// 获取req.body传来的信息，暂存在UsearData中
	let UsearData = {
		id: req.body.id,
		name: req.body.name,
		// wxInfo: req.body.wxInfo,
		tel: req.body.tel,
		college: req.body.college
	}

	//开始初始化数据库
	let status = 0;
	let accountCollection = await informationDB.getCollection("ACCOUNT");
	//初始化账户表
	accountCollection.findOne({ id: UsearData.id }, function (err, data) {
		if (!data) {
			accountCollection.insertOne({
				id: UsearData.id,
				name: UsearData.name,
				// wxInfo: UsearData.wxInfo,
				tel: UsearData.tel,
				college: UsearData.college
			}, function () {
				status = 0;
			})
		}
		else {
			status = -1;
		}
	});

	let scoresCollection = await informationDB.getCollection("SCORES");
	//初始化积分表
	scoresCollection.findOne({ id: UsearData.id }, function (err, data) {
		if (!data) {
			scoresCollection.insertOne({
				id: UsearData.id,
				scores: "0",
				deals: []
			}, function () {
				status = 0;
			})
		}
		else {
			status = -1;
		}
	});

	let signsCollection = await informationDB.getCollection("SIGN");
	//初始化签到表
	signsCollection.findOne({ id: UsearData.id }, function (err, data) {
		if (!data) {
			signsCollection.insertOne({
				id: UsearData.id,
				lastSignTime: "",
				signNumber: "0",
				serialSignNumber: "0"
			}, function () {
				status = 0;
			})
		}
		else {
			status = -1;
		}
	});

	//判断是否初始化成功
	if (status != -1) {
		res.status(200).json({ "code": "1" });
	}
	else {
		res.status(400).json({ "code": "-1" });
	}


});

//根据账户id获取积分
router.get('/account/scores', urlencodedParser, async function (req, res, next) {
	let params = req.query;
	let collection = await informationDB.getCollection("SCORES");
	collection.findOne({ id: params.id }, function (err, data) {
		if (!data) {
			res.status(400).json({ "code": "-1" })
		} else {
			res.status(200).json({
				scores: data.scores
			});
		}
	});
});

//根据账户id获取积分流水
router.get('/account/scores/deal', urlencodedParser, async function (req, res, next) {
	let params = req.query;
	let collection = await informationDB.getCollection("SCORES");
	collection.findOne({ id: params.id }, function (err, data) {
		if (!data) {
			res.status(400).json({ "code": "-1" })
		} else {
			res.status(200).json({
				deals: data.deals
			});
		}
	});
});

//积分交易
router.post('/account/scores', urlencodedParser, async function (req, res, next) {
	let aDeal = {
		sender: req.body.sender,
		to: req.body.to,
		score: req.body.score
	}

	let collection = await informationDB.getCollection("SCORES");
	//在发送人积分表中加入数据
	collection.findOne({ id: aDeal.sender }, function (err, data) {
		if (!data) {
			res.status(400).json({ "code": "-1" })
		} else {
			let senderScores = {
				_id: data._id,
				id: data.id,
				scores: data.scores,
				deals: data.deals
			}
			if (aDeal.score < 0) {
				res.status(200).json({ "code": "-2" })
			}
			else {
				senderScores.deals.push({"sender": aDeal.sender,"to": aDeal.to, "score": aDeal.score, "time": getNowFormatDate()});
				let m_score = parseInt(senderScores.scores) - parseInt(aDeal.score);
				// console.log(m_score);
				if (m_score < 0) {
					res.status(200).json({ "code": "-3" })
				}
	
				else {
					senderScores.scores = String(m_score);
					// console.log(senderScores);
		
					collection.save({
						"_id": ObjectID(senderScores._id),
						"id": senderScores.id,
						"scores": senderScores.scores,
						"deals": senderScores.deals
					});
		
		
					//在收分人积分表中加入数据
					collection.findOne({ id: aDeal.to }, function (err, data) {
						if (!data) {
							res.status(400).json({ "code": "-1" })
						} else {
							let toScores = {
								_id: data._id,
								id: data.id,
								scores: data.scores,
								deals: data.deals
							}
				
							toScores.deals.push({"sender": aDeal.sender,"to": aDeal.to, "score": aDeal.score, "time": getNowFormatDate()});
							toScores.scores = String(parseInt(toScores.scores) + parseInt(aDeal.score));
				
							collection.save({
								"_id": ObjectID(toScores._id),
								"id": toScores.id,
								"scores": toScores.scores,
								"deals": toScores.deals
							});
						}
					});
		
					res.status(200).json({ "code": "1" })
				}
			}
		}
	});

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

module.exports = router;