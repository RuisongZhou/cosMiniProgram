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
                status: "0",
                time: getDate(),
                comment: [],
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




// 获取活动列表
router.get('/activity/list', urlencodedParser, async function (req, res, next) {
	let params = req.query;
	console.log(params);
    let collection = await informationDB.getCollection("ACTIVITY");
    let confirmCollection = await informationDB.getCollection("ACTIVITYCONFIRM");
    collection.find({level: params.level}).sort(['_id', -1]).toArray(function (err, data) {
        res.status(200).json({
            "rewards": data
        });
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