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

//增加活动
router.post('/activity/add', urlencodedParser, async function (req, res, next) {
    let activity = {
        posterId: req.body.posterId,
        theme: req.body.theme,
        content: req.body.content,
        picture: req.body.picture,
        ddl: req.body.ddl,
        place: req.body.place
    }

    console.log(activity);

    let collection = await informationDB.getCollection("ACTIVITY");
    let accountCollection = await informationDB.getCollection("ACCOUNT");
    
    accountCollection.findOne({ id: activity.posterId }, function (err, data) {
        if (!data) {
            res.status(200).json({ "code": "-1" ,"msg": "没有此用户"});
        }
        else {
            collection.insertOne({
                poster: data,
                theme: activity.theme,
                content: activity.content,
                picture: activity.picture,
                ddl: activity.ddl,
                place: activity.place,
                status: "1",
                time: getDate(),
                headImgs: [],
                participantNums: 0
            }, function () {
                res.status(200).json({ "code": "1" });
            })
            }
    })

});

//报名活动
router.post('/activity/partIn', urlencodedParser, async function (req, res, next) {
    let activity = {
        ParticipantId: req.body.ParticipantId,
        activityId: req.body.activityId
    }

    console.log(activity);

    let collection = await informationDB.getCollection("ACTIVITYCONFIRM");
    let activityCollection = await informationDB.getCollection("ACTIVITY");
    let accountCollection = await informationDB.getCollection("ACCOUNT");
    
    accountCollection.findOne({ id: activity.ParticipantId }, function (err, data) {
        if (!data) {
            res.status(200).json({ "code": "-1" ,"msg": "没有此用户"});
        }
        else {
            activityCollection.find({_id: ObjectID(activity.activityId)}).sort(['_id', -1]).toArray(function (err, activityData) {
                let NewparticipantNums = activityData[0].participantNums +1;
                let NewHeadImgs = activityData[0].headImgs;
                NewHeadImgs.push(data.headimg);
                activityCollection.update({_id: ObjectID(activity.activityId)},{$set:{headImgs: NewHeadImgs,participantNums: NewparticipantNums}});
            });
            
                collection.insertOne({
                    activityId: activity.activityId,
                    Participant: data
                }, function () {
                    res.status(200).json({ "code": "1" });
                })
            }
    })
});

//活动截止
router.post('/activity/stop', urlencodedParser, async function (req, res, next) {
    let activity = {
        activityId: req.body.activityId
    }

    console.log(activity);

    let activityCollection = await informationDB.getCollection("ACTIVITY");
    
    activityCollection.find({_id: ObjectID(activity.activityId)}).sort(['_id', -1]).toArray(function (err, activityData) {
        if (!activityData) {
            res.status(200).json({ "code": "-1","msg": "没有此活动" });
        }
        else {
            activityCollection.update({_id: ObjectID(activity.activityId)},{$set:{status: "0"}});
            res.status(200).json({ "code": "1" });
        }

    });
    
});

// 判断活动是否截止
router.get('/activity/stopOrNot', urlencodedParser, async function (req, res, next) {
	let params = req.query;
	console.log(params);
    let activityCollection = await informationDB.getCollection("ACTIVITY");

    activityCollection.find({_id: ObjectID(activity.activityId)}).sort(['_id', -1]).toArray(function (err, activityData) {
        if (!activityData) {
            res.status(200).json({ "code": "-1","msg": "没有此活动" });
        }
        else {
            if (activityData[0].status == "1") {
                res.status(200).json({ "code": "1" ,"msg": "活动未截止"});
            }
            else {
                res.status(200).json({ "code": "０" ,"msg": "活动已截止"});
            }
        }

    });
});

// 删除活动
router.delete('/activity/remove', urlencodedParser, async function (req, res, next) {
    let activityId  =  req.body.activityId;

    console.log(activityId);

    let collection = await informationDB.getCollection("ACTIVITY");
    collection.findOne({ _id: ObjectID(activityId) }, function (err, data) {
        if (!data) {
            res.status(200).json({ "code":"0","description": "not found" })
        } else {
            collection.remove({_id: ObjectID(activityId)},function () {
                res.status(200).json({ "code":"1", "description": "delete success" });
                });
        }
    });

});


// 获取活动列表
router.get('/activity/list', urlencodedParser, async function (req, res, next) {
	let params = req.query;
	console.log(params);
    let collection = await informationDB.getCollection("ACTIVITY");
    collection.find().sort(['_id', -1]).toArray(function (err, data) {
        res.status(200).json({
            "activitys": data
        });
    });
});

//评论活动
router.post('/activity/reply', urlencodedParser, async function (req, res, next) {
    let replyActivity = {
        posterId: req.body.posterId,
        activityId: req.body.activityId,
        content: req.body.content,
    }

    console.log(replyActivity);

    let collection = await informationDB.getCollection("ACTIVITYREPLY");
    let accountCollection = await informationDB.getCollection("ACCOUNT");
    
    accountCollection.findOne({ id: replyActivity.posterId }, function (err, data) {
        if (!data) {
            res.status(200).json({ "code": "-1" ,"msg": "没有此用户"});
        }
        else {
                collection.insertOne({
                    activityId: replyActivity.activityId,
                    poster: data,
                    content: replyActivity.content,
                }, function () {
                    res.status(200).json({ "code": "1" });
                })
            }
    })
});

// 获取某活动人员列表
router.get('/activity/signlist', urlencodedParser, async function (req, res, next) {
	let params = req.query;
	console.log(params);
    let collection = await informationDB.getCollection("ACTIVITYCONFIRM");
    let activityCollection = await informationDB.getCollection("ACTIVITY");

    activityCollection.findOne({ _id: ObjectID(params.activityId) }, function (err, data) {
        if (!data) {
            res.status(200).json({ "code": "-1","msg": "没有此活动" })
        } else {
            collection.find({ activityId: params.activityId }).sort(['_id', -1]).toArray(function (err, confirmData) {
                res.status(200).json({
                     "activity": data,
                     "confirm": confirmData
                    })
            })
        }
    });
});




// 获取活动列表
router.get('/activity/list', urlencodedParser, async function (req, res, next) {
	let params = req.query;
	console.log(params);
    let collection = await informationDB.getCollection("ACTIVITY");
    collection.find({level: params.level}).sort(['_id', -1]).toArray(function (err, data) {
        res.status(200).json({
            "rewards": data
        });
    });
});

// 获取某活动评论

router.get('/activity/getReply', urlencodedParser, async function (req, res, next) {
	let params = req.query;
	console.log(params);
    let collection = await informationDB.getCollection("ACTIVITYREPLY");
    let activityCollection = await informationDB.getCollection("ACTIVITY");

    activityCollection.findOne({ _id: ObjectID(params.activityId) }, function (err, data) {
        if (!data) {
            res.status(200).json({ "code": "-1","msg": "没有此活动" })
        } else {
            collection.find({ activityId: params.activityId }).sort(['_id', -1]).toArray(function (err, replyData) {
                res.status(200).json({
                     "activity": data,
                     "reply": replyData
                    })
            })
        }
    });
});


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