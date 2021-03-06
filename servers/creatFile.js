/**
 * Created by HUI on 23/01/2017.
 */
let async = require('async');
let fs = require("fs");
let path = require("path");
let filePath = path.join(__dirname, '../public/tmp/paper_tmp');
let officegen = require('officegen');

exports.create = async function (data, time, id, order) {
    const type1_list = []
    const type2_list = []
    const type3_list = []
    const type4_list = []
    const type5_list = []
    const type6_list = []
    await data.forEach(function (element) {
        if (element.type == "选择题") {
            type1_list.push(element)
        } else if (element.type == "填空题") {
            type2_list.push(element)
        } else if (element.type == "判断题") {
            type3_list.push(element)
        } else if (element.type == "简答题") {
            type4_list.push(element)
        } else if (element.type == "解答题") {
            type5_list.push(element)
        } else if (element.type == "名词解释") {
            type6_list.push(element)
        }
    })

    let docx = officegen('docx')
    docx.on('error', function (err) {
        console.log(err);
    });

    var pObj = docx.createP({align: 'center'});
    pObj.addText(' 苏州科技大学试卷' + order + '卷', {font_face: 'Arial', font_size: 40});
    pObj.addLineBreak();

    var pObj = docx.createP({align: 'left'});
    pObj.addText('选择题', {font_face: 'Arial', font_size: 14});
    pObj.addLineBreak();
    for (let i = 0; i < type1_list.length; i++) {

        var pObj = docx.createListOfNumbers();
        pObj.addText(type1_list[i].question);
        if ((type1_list[i].filepath).length>0) {
            for(let j=0;j<(type1_list[i].filepath).length;j++){
                pObj.addImage(path.join(__dirname, (type1_list[i].filepath)[j]), {cx: 100, cy: 100});
            }

        }

    }
    var pObj = docx.createP({align: 'left'});
    pObj.addText('填空题', {font_face: 'Arial', font_size: 14});
    pObj.addLineBreak();
    for (let i = 0; i < type2_list.length; i++) {

        var pObj = docx.createListOfNumbers();

        pObj.addText(type2_list[i].question);
        if ((type2_list[i].filepath).length>0) {
            for(let j=0;j<(type2_list[i].filepath).length;j++){
                pObj.addImage(path.join(__dirname, (type2_list[i].filepath)[j]), {cx: 100, cy: 100});
            }

        }


    }

    var pObj = docx.createP({align: 'left'});
    pObj.addText('判断题', {font_face: 'Arial', font_size: 14});
    pObj.addLineBreak();
    for (let i = 0; i < type3_list.length; i++) {

        var pObj = docx.createListOfNumbers();

        pObj.addText(type3_list[i].question);
        if ((type3_list[i].filepath).length>0) {
            for(let j=0;j<(type3_list[i].filepath).length;j++){
                pObj.addImage(path.join(__dirname, (type3_list[i].filepath)[j]), {cx: 100, cy: 100});
            }

        }

    }

    var pObj = docx.createP({align: 'left'});
    pObj.addText('简答题', {font_face: 'Arial', font_size: 14});
    pObj.addLineBreak();
    for (let i = 0; i < type4_list.length; i++) {
        var pObj = docx.createListOfNumbers();

        pObj.addText(type4_list[i].question);
        if ((type4_list[i].filepath).length>0) {
            for(let j=0;j<(type4_list[i].filepath).length;j++){
                pObj.addImage(path.join(__dirname, (type4_list[i].filepath)[j]), {cx: 100, cy: 100});
            }

        }

    }

    var pObj = docx.createP({align: 'left'});
    pObj.addText('解答题', {font_face: 'Arial', font_size: 14});
    pObj.addLineBreak();
    for (let i = 0; i < type5_list.length; i++) {
        var pObj = docx.createListOfNumbers();

        pObj.addText(type5_list[i].question);
        if ((type5_list[i].filepath).length>0) {
            for(let j=0;j<(type5_list[i].filepath).length;j++){
                pObj.addImage(path.join(__dirname, (type5_list[i].filepath)[j]), {cx: 100, cy: 100});
            }

        }


    }

    var pObj = docx.createP({align: 'left'});
    pObj.addText('名词解释', {font_face: 'Arial', font_size: 14});
    pObj.addLineBreak();
    for (let i = 0; i < type6_list.length; i++) {
        var pObj = docx.createListOfNumbers();

        pObj.addText(type6_list[i].question);
        if ((type6_list[i].filepath).length>0) {
            for(let j=0;j<(type6_list[i].filepath).length;j++){
                pObj.addImage(path.join(__dirname, (type6_list[i].filepath)[j]), {cx: 100, cy: 100});
            }

        }


    }

    var pObj = docx.createP({align: 'center'});
    pObj.addText(' 答案', {font_face: 'Arial', font_size: 40});
    pObj.addLineBreak();

    var pObj = docx.createP({align: 'left'});
    pObj.addText('选择题', {font_face: 'Arial', font_size: 14});
    pObj.addLineBreak();
    for (let i = 0; i < type1_list.length; i++) {

        var pObj = docx.createListOfNumbers();

        pObj.addText(type1_list[i].answer);


    }

    var pObj = docx.createP({align: 'left'});
    pObj.addText('填空题', {font_face: 'Arial', font_size: 14});
    pObj.addLineBreak();
    for (let i = 0; i < type2_list.length; i++) {

        var pObj = docx.createListOfNumbers();

        pObj.addText(type2_list[i].answer);


    }

    var pObj = docx.createP({align: 'left'});
    pObj.addText('判断题', {font_face: 'Arial', font_size: 14});
    pObj.addLineBreak();
    for (let i = 0; i < type3_list.length; i++) {

        var pObj = docx.createListOfNumbers();

        pObj.addText(type3_list[i].answer);


    }

    var pObj = docx.createP({align: 'left'});
    pObj.addText('简答题', {font_face: 'Arial', font_size: 14});
    pObj.addLineBreak();
    for (let i = 0; i < type4_list.length; i++) {
        var pObj = docx.createListOfNumbers();

        pObj.addText(type4_list[i].answer);

    }

    var pObj = docx.createP({align: 'left'});
    pObj.addText('解答题', {font_face: 'Arial', font_size: 14});
    pObj.addLineBreak();
    for (let i = 0; i < type5_list.length; i++) {
        var pObj = docx.createListOfNumbers();

        pObj.addText(type5_list[i].answer);
    }

    var pObj = docx.createP({align: 'left'});
    pObj.addText('名词解释', {font_face: 'Arial', font_size: 14});
    pObj.addLineBreak();
    for (let i = 0; i < type6_list.length; i++) {
        var pObj = docx.createListOfNumbers();

        pObj.addText(type6_list[i].answer);
    }

    let out = fs.createWriteStream(filePath + "/" + id + time + order + ".docx");

    out.on('error', function (err) {
        console.log(err);
    });

    async.parallel([
        function (done) {
            out.on('close', function () {
                console.log('Finish to create a DOCX file.');
                done(null);
            });
            docx.generate(out);
        }

    ], function (err) {
        if (err) {
            console.log('error: ' + err);
        } // Endif.
    });
}