let express = require('express');
let informationDB = require('../models/information_db');
let router = express.Router();
let bodyParser = require('body-parser');
let urlencodedParser = bodyParser.urlencoded({ extended: false });

// 跨域header设定
router.all('*', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
	res.header("X-Powered-By",' 3.2.1')
	res.header("Content-Type", "application/json;charset=utf-8");
	next();
});

//签到
router.post('/sign', urlencodedParser, async function (req, res, next) {
    let SIGN = {
		id: req.body.id,
		describe: req.body.describe
    }
    console.log(SIGN);
    //讲数据插入签到表
    if (SIGN.describe === "sign") {
        let signCollection = await informationDB.getCollection("SIGN");
        let scoreCollection = await informationDB.getCollection("SCORES");
        signCollection.findOne({ id: SIGN.id }, function (err, data) {
            let serialSignNumber = parseInt(data.serialSignNumber);
            let nowDate = getNowFormatDate();
            console.log(nowDate, data.lastSignTime,(nowDate != data.lastSignTime));
            if (nowDate != data.lastSignTime) {
                if (data.lastSignTime != "" || getDays(data.lastSignTime,nowDate)　<= 1) {
                    serialSignNumber += 1;
                }
                else {
                    serialSignNumber = 0;
                }
                signCollection.save({
                    _id: data._id,
                    id: data.id,
                    lastSignTime: nowDate,
                    signNumber: String(parseInt(data.signNumber)+1),
                    serialSignNumber: String(serialSignNumber)
                });
    
                //签到加分
                if (serialSignNumber >=2) {
                    scoreCollection.findOne({ id: SIGN.id }, function (err, data) {
                        scoreCollection.save({
                            "_id": data._id,
                            "id": data.id,
                            "scores": String(parseInt(data.scores)+1),
                            "deals": data.deals
                        });
                    });
                }
                res.status(200).json({ "code": "1" });
            }
            else {
                res.status(200).json({ "code": "-2" });
            }

        });
    }
    else {
	    res.status(400).json({ "code": "-1" });
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

function getDays(strDateStart,strDateEnd){
    var strSeparator = "-"; //日期分隔符
    var oDate1;
    var oDate2;
    var iDays;
    oDate1= strDateStart.split(strSeparator);
    oDate2= strDateEnd.split(strSeparator);
    var strDateS = new Date(oDate1[0], oDate1[1]-1, oDate1[2]);
    var strDateE = new Date(oDate2[0], oDate2[1]-1, oDate2[2]);
    iDays = parseInt(Math.abs(strDateS - strDateE ) / 1000 / 60 / 60 /24)//把相差的毫秒数转换为天数 
    return iDays ;
}

module.exports = router;