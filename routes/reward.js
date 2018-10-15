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


//增加悬赏
router.post('/reward/add', urlencodedParser, async function (req, res, next) {
    let reward = {
        posterId: req.body.posterId,
        level: req.body.level,
        theme: req.body.theme,
        content: req.body.content,
        price: req.body.price,
        picture: req.body.picture,
        ddl: req.body.ddl
    }

    console.log(reward);

    let collection = await informationDB.getCollection("REWARD");
    let accountCollection = await informationDB.getCollection("ACCOUNT");
    
    accountCollection.findOne({ id: reward.posterId }, function (err, data) {
        if (!data) {
            res.status(200).json({ "code": "-1" ,"msg": "没有此用户"});
        }
        else {
            if (parseInt(data.scores) < parseInt(reward.price)) {
                res.status(200).json({ "code": "-1" ,"msg": "积分不足"});
            }
            else {
                accountCollection.save({
                    id: data.id,
                    nickName: data.nickName,
                    name: data.name,
                    gender: data.gender,
                    headimg: data.headimg,
                    tel: data.tel,
                    college: data.college,
                    access: data.access,
                    scores: String(parseInt(data.scores) - parseInt(reward.price)),
                    lockedScores: String(parseInt(data.lockedScores) + parseInt(reward.price)),
                    willGetScores: data.willGetScores,
                    community: data.community,
                    birthday: data.birthday,
                    IDcard: data.IDcard,
                    address: data.address,
                    QQ: data.QQ,
                    describe: data.describe
                })

                collection.insertOne({
                    poster: data,
                    level: reward.level,
                    theme: reward.theme,
                    content: reward.content,
                    price: reward.price,
                    picture: reward.picture,
                    ddl: reward.ddl,
                    status: "0",
                    completed: "0",
                    time: getDate()
                }, function () {
                    res.status(200).json({ "code": "1" });
                })
            }
        }
    })

});

//接收悬赏
router.post('/reward/pick', urlencodedParser, async function (req, res, next) {
    let rewardPick = {
        pickerId: req.body.pickerId,
        rewardId: req.body.rewardId,
        describe: req.body.describe
    }

    console.log(rewardPick);

    let collection = await informationDB.getCollection("REWARDCONFIRM");
    let rewardCollection = await informationDB.getCollection("REWARD");
    let accountCollection = await informationDB.getCollection("ACCOUNT");
    let newsCollection = await informationDB.getCollection("NEWS");
    
    accountCollection.findOne({ id: rewardPick.pickerId }, function (err, data) {
        if (!data) {
            res.status(200).json({ "code": "-1" ,"msg": "没有此用户"});
        }
        else {    
            rewardCollection.findOne({ _id: ObjectID(rewardPick.rewardId) }, function (err, rewardData) {
                if (!rewardData) {
                    res.status(200).json({ "code": "-1" ,"msg": "没有此悬赏"});
                }
                else {
                    console.log(rewardData)
                    collection.insertOne({
                        reward: rewardData,
                        picker: data,
                        status: "0",
                        completed: {
                            pickerComplete: "0",
                            posterComplete: "0"
                        },
                        describe: rewardPick.describe,
                        time: getDate(),
                        comment: {
                            pickerComment: "",
                            posterComment: ""
                        }
                    }, function () {
                        //发送消息
                        newsCollection.insertOne({
                            toId: rewardData.poster.id,
                            poster: data,
                            read: "0",
                            option: "接受悬赏",
                            content: rewardPick.describe,
                            time: getDate()
                        }, function () {
                            res.status(200).json({ "code": "1" });
                        })
                    })
                }
            })
        }
    })

});


// 审核悬赏
router.post('/reward/check', urlencodedParser, async function (req, res, next) {
    let rewardCheck = {
        rewardConfirmId: req.body.rewardConfirmId
    }

    console.log(rewardCheck);

    let collection = await informationDB.getCollection("REWARDCONFIRM");
    let rewardCollection = await informationDB.getCollection("REWARD");
    let accountCollection = await informationDB.getCollection("ACCOUNT");

    collection.findOne({ _id: ObjectID(rewardCheck.rewardConfirmId) }, function (err, data) {
        if (!data) {
            res.status(200).json({ "code": "-1" ,"msg": "没有此悬赏"});
        }
        else {
            collection.save({
                _id: ObjectID(data._id),
                reward: data.reward,
                picker: data.picker,
                status: "1",
                completed: data.completed,
                describe: data.describe,
                time: data.time,
                comment: data.comment
            }, function () {
                accountCollection.findOne({ id: data.picker.id }, function (err, userData) {
                    accountCollection.save({
                        id: userData.id,
                        nickName: userData.nickName,
                        name: userData.name,
                        gender: userData.gender,
                        headimg: userData.headimg,
                        tel: userData.tel,
                        college: userData.college,
                        access: userData.access,
                        scores: userData.scores,
                        lockedScores: userData.lockedScores,
                        willGetScores: String(parseInt(userData.willGetScores) + parseInt(data.reward.price)),
                        community: userData.community,
                        birthday: userData.birthday,
                        IDcard: userData.IDcard,
                        address: userData.address,
                        QQ: userData.QQ,
                        describe: userData.describe
                    })
                })
                
                rewardCollection.findOne({ _id: ObjectID(data.reward._id) }, function (err, rewardData) {
                    if (!rewardData) {
                        res.status(200).json({ "code": "-1" ,"msg": "没有此悬赏"});
                    }
                    else {
                        rewardCollection.save({
                            _id: ObjectID(rewardData._id),
                            poster: rewardData.poster,
                            level: rewardData.level,
                            theme: rewardData.theme,
                            content: rewardData.content,
                            price: rewardData.price,
                            picture: rewardData.picture,
                            ddl: rewardData.ddl,
                            status: "1",
                            completed: rewardData.completed,
                            time: rewardData.time
                        }, function () {
                            res.status(200).json({ "code": "1"});
                        })
                    }
                })
            })
        }
    })

});

//接受者完成悬赏
router.post('/reward/pickerComplete', urlencodedParser, async function (req, res, next) {
    let picker = {
        rewardConfirmId: req.body.rewardConfirmId,
        pickerComment: req.body.pickerComment
    }
    console.log(picker);

    let collection = await informationDB.getCollection("REWARDCONFIRM");
    let rewardCollection = await informationDB.getCollection("REWARD");
    let accountCollection = await informationDB.getCollection("ACCOUNT");
    let newsCollection = await informationDB.getCollection("NEWS");

    collection.findOne({ _id: ObjectID(picker.rewardConfirmId) }, function (err, data) {
        if (!data) {
            res.status(200).json({ "code": "-1" ,"msg": "没有此悬赏"});
        }
        else {
            collection.save({
                _id: ObjectID(data._id),
                reward: data.reward,
                picker: data.picker,
                status: data.status,
                completed: {
                    pickerComplete: "1",
                    posterComplete: data.completed.posterComplete
                },
                describe: data.describe,
                time: data.time,
                comment: {
                    pickerComment: picker.pickerComment,
                    posterComment: data.comment.posterComment
                }
            }, function () {
                if (data.completed.posterComplete == "1") {
                    rewardCollection.findOne({ _id: ObjectID(data.reward._id) }, function (err, rewardData) {
                        if (!rewardData) {
                            res.status(200).json({ "code": "-1" ,"msg": "没有此悬赏"});
                        }
                        else {
                            rewardCollection.save({
                                _id: ObjectID(rewardData._id),
                                poster: rewardData.poster,
                                level: rewardData.level,
                                theme: rewardData.theme,
                                content: rewardData.content,
                                price: rewardData.price,
                                picture: rewardData.picture,
                                ddl: rewardData.ddl,
                                status: rewardData.status,
                                completed: "1",
                                time: rewardData.time
                            }, function () {
                                //发布消息
                                newsCollection.insertOne({
                                    toId: rewardData.poster.id,
                                    poster: data.picker,
                                    read: "0",
                                    option: "悬赏评价",
                                    content: picker.pickerComment,
                                    time: getDate()
                                })

                                accountCollection.findOne({ id: data.picker.id }, function (err, userData) {
                                    accountCollection.save({
                                        _id: ObjectID(userData._id),
                                        id: userData.id,
                                        nickName: userData.nickName,
                                        name: userData.name,
                                        gender: userData.gender,
                                        headimg: userData.headimg,
                                        tel: userData.tel,
                                        college: userData.college,
                                        access: userData.access,
                                        scores: String(parseInt(userData.scores) + parseInt(data.reward.price)),
                                        lockedScores: userData.lockedScores,
                                        willGetScores: String(parseInt(userData.willGetScores) - parseInt(data.reward.price)),
                                        community: userData.community,
                                        birthday: userData.birthday,
                                        IDcard: userData.IDcard,
                                        address: userData.address,
                                        QQ: userData.QQ,
                                        describe: userData.describe
                                    })
                                })

                                accountCollection.findOne({ id: data.reward.poster.id }, function (err, userData) {
                                    accountCollection.save({
                                        _id: ObjectID(userData._id),
                                        id: userData.id,
                                        nickName: userData.nickName,
                                        name: userData.name,
                                        gender: userData.gender,
                                        headimg: userData.headimg,
                                        tel: userData.tel,
                                        college: userData.college,
                                        access: userData.access,
                                        scores: userData.scores,
                                        lockedScores: String(parseInt(userData.lockedScores) - parseInt(data.reward.price)),
                                        willGetScores: userData.willGetScores,
                                        community: userData.community,
                                        birthday: userData.birthday,
                                        IDcard: userData.IDcard,
                                        address: userData.address,
                                        QQ: userData.QQ,
                                        describe: userData.describe
                                    })
                                }),

                                res.status(200).json({ "code": "1"})
                            })
                        }
                    })
                }
            else {
                res.status(200).json({ "code": "1"});
            }
            })
        }
    })
})

//悬赏者完成悬赏
router.post('/reward/posterComplete', urlencodedParser, async function (req, res, next) {
    let poster = {
        rewardConfirmId: req.body.rewardConfirmId,
        posterComment: req.body.posterComment
    }
    console.log(poster);

    let collection = await informationDB.getCollection("REWARDCONFIRM");
    let rewardCollection = await informationDB.getCollection("REWARD");
    let accountCollection = await informationDB.getCollection("ACCOUNT");
    let newsCollection = await informationDB.getCollection("NEWS");

    collection.findOne({ _id: ObjectID(poster.rewardConfirmId) }, function (err, data) {
        if (!data) {
            res.status(200).json({ "code": "-1" ,"msg": "没有此悬赏"});
        }
        else {
            collection.save({
                _id: ObjectID(data._id),
                reward: data.reward,
                picker: data.picker,
                status: data.status,
                completed: {
                    pickerComplete: data.completed.pickerComplete,
                    posterComplete: "1"
                },
                describe: data.describe,
                time: data.time,
                comment: {
                    pickerComment: data.comment.pickerComment,
                    posterComment: poster.posterComment
                }
            }, function () {
                if (data.completed.pickerComplete == "1") {
                    rewardCollection.findOne({ _id: ObjectID(data.reward._id) }, function (err, rewardData) {
                        if (!rewardData) {
                            res.status(200).json({ "code": "-1" ,"msg": "没有此悬赏"});
                        }
                        else {
                            // console.log (rewardData)
                            rewardCollection.save({
                                _id: ObjectID(rewardData._id),
                                poster: rewardData.poster,
                                level: rewardData.level,
                                theme: rewardData.theme,
                                content: rewardData.content,
                                price: rewardData.price,
                                picture: rewardData.picture,
                                ddl: rewardData.ddl,
                                status: rewardData.status,
                                completed: "1",
                                time: rewardData.time
                            }, function () {
                                //发布消息
                                newsCollection.insertOne({
                                    toId: data.picker.id,
                                    poster: rewardData.poster,
                                    read: "0",
                                    option: "悬赏评价",
                                    content: poster.posterComment,
                                    time: getDate()
                                })

                                                                
                                accountCollection.findOne({ id: data.picker.id }, function (err, userData) {
                                    console.log(userData)
                                    accountCollection.save({
                                        _id: ObjectID(userData._id),
                                        id: userData.id,
                                        nickName: userData.nickName,
                                        name: userData.name,
                                        gender: userData.gender,
                                        headimg: userData.headimg,
                                        tel: userData.tel,
                                        college: userData.college,
                                        access: userData.access,
                                        scores: String(parseInt(userData.scores) + parseInt(data.reward.price)),
                                        lockedScores: userData.lockedScores,
                                        willGetScores: String(parseInt(userData.willGetScores) - parseInt(data.reward.price)),
                                        community: userData.community,
                                        birthday: userData.birthday,
                                        IDcard: userData.IDcard,
                                        address: userData.address,
                                        QQ: userData.QQ,
                                        describe: userData.describe
                                    })
                                })

                                accountCollection.findOne({ id: data.reward.poster.id }, function (err, userData) {
                                    accountCollection.save({
                                        _id: ObjectID(userData._id),
                                        id: userData.id,
                                        nickName: userData.nickName,
                                        name: userData.name,
                                        gender: userData.gender,
                                        headimg: userData.headimg,
                                        tel: userData.tel,
                                        college: userData.college,
                                        access: userData.access,
                                        scores: userData.scores,
                                        lockedScores: String(parseInt(userData.lockedScores) - parseInt(data.reward.price)),
                                        willGetScores: userData.willGetScores,
                                        community: userData.community,
                                        birthday: userData.birthday,
                                        IDcard: userData.IDcard,
                                        address: userData.address,
                                        QQ: userData.QQ,
                                        describe: userData.describe
                                    })
                                })

                                res.status(200).json({ "code": "1"});
                            })
                        }
                    })
                }
            else {
                res.status(200).json({ "code": "1"});
            }
            })
        }
    })
})


// 获取我的悬赏
router.get('/reward', urlencodedParser, async function (req, res, next) {
	let params = req.query;
	console.log(params);
	let collection = await informationDB.getCollection("REWARD");
    collection.find({"poster.id": params.id}).sort(['_id', -1]).toArray(function (err, data) {
        res.status(200).json({
            "reward": data
        });
    });
});

// 获取我的任务
router.get('/reward/confirm', urlencodedParser, async function (req, res, next) {
	let params = req.query;
	console.log(params);
	let collection = await informationDB.getCollection("REWARDCONFIRM");
    collection.find({"picker.id": params.id}).sort(['_id', -1]).toArray(function (err, data) {
        res.status(200).json({
            "reward": data
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