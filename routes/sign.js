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


//获取签到信息
router.get('/sign', urlencodedParser, async function (req, res, next) {
	let params = req.query;
    console.log(params);
    let collection = await informationDB.getCollection("SIGN");
	if (params.describe == 'getSign') {
        collection.find({id: params.id}).sort(['_id', 1]).toArray(function (err, data) {
            // console.log(data);
			res.status(200).json({
				"sign": data[0]
			});
        });
	}
	else {
		res.status(200).json({ "code": "-1" });
	}
});

//签到
router.post('/sign', urlencodedParser, async function (req, res, next) {
    let SIGN = {
		id: req.body.id,
		describe: req.body.describe
    }
    console.log(SIGN);
    //将数据插入签到表
    if (SIGN.describe == "sign") {
        let signCollection = await informationDB.getCollection("SIGN");
        let collection = await informationDB.getCollection("ACCOUNT");
        signCollection.findOne({ id: SIGN.id }, function (err, data) {
            if (!data) {
                res.status(200).json({ "msg": "用户不存在" });
            }
            else {
                let serialSignNumber = parseInt(data.serialSignNumber);
                let signNumber = parseInt(data.signNumber);
                let nowDate = new Date();
    
                console.log(data)
    
                if (data.lastSignTime == "") {
                    serialSignNumber += 1;
                    signNumber += 1;
                    signCollection.save({
                        _id: data._id,
                        id: data.id,
                        lastSignTime: nowDate,
                        signNumber: String(signNumber),
                        serialSignNumber: String(serialSignNumber)
                    });
                    res.status(200).json({ "code": "1" });
    
                }
                else {
                    if (getDays(data.lastSignTime,nowDate)　>= 1) {
                        if (getDays(data.lastSignTime,nowDate) == 1) {
                            serialSignNumber += 1;
                            signNumber += 1;
                        }
                        else {
                            serialSignNumber = 0;
                            signNumber += 1;
                        }
                        signCollection.save({
                            _id: data._id,
                            id: data.id,
                            lastSignTime: nowDate,
                            signNumber: String(signNumber),
                            serialSignNumber: String(serialSignNumber)
                        });
            
                        //签到加分
                        if (serialSignNumber >=2) {
                            collection.findOne({ id: SIGN.id }, function (err, data) {
                                collection.save({
                                    _id: ObjectID(data._id),
                                    id: data.id,
                                    nickName: data.nickName,
                                    name: data.name,
                                    gender: data.gender,
                                    access: data.access,
                                    headimg: data.headimg,
                                    tel: data.tel,
                                    college: data.college,
                                    scores: String(parseInt(data.scores)+1),
                                    lockedScores: data.lockedScores,
                                    willGetScores: data.willGetScores,
                                    community: userData.community,
                                    birthday: userData.birthday,
                                    IDcard: userData.IDcard,
                                    address: userData.address,
                                    QQ: userData.QQ,
                                    describe: userData.describe
                                });
                            });
                        }
                        res.status(200).json({ "code": "1" });
                    }
                    else {
                        res.status(200).json({ "code": "-2" });
                    }
                }
            }

        });
    }
    else {
	    res.status(200).json({ "code": "-1" });
    }

});


function getDays(strDateStart,strDateEnd){
    iDays = parseInt(strDateStart.getDate()) - parseInt(strDateEnd.getDate());
    return iDays ;
}

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