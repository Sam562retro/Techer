const express = require('express');
const router = express.Router();
const AUDcontroller = require('../controller/AUDcontroller');
const AUview = require('../controller/AUview');
const CLASScontroller = require('../controller/CLASScontroller');
const validator = require('./../services/validationMiddleware');
const schema = require('../model/schema');
const uid = require('uniqid');
const assignmentController = require('./../controller/assignmentController');
var multer  = require('multer')
const path = require('path');
var maxSize = 16 * 1000 * 1000 * 1000;
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.resolve(__dirname, './upload'))
    },
    filename: function (req, file, cb) {
        cb(null, uid() + '.' +file.mimetype.split("/")[1]) //Appending .jpg
}})
  
var upload = multer({ storage: storage , limits: { fileSize: maxSize }});

router.get('/login', async (req, res) => {
    res.render('login');
});

router.get('/classes/:idType/:id', validator.valId, CLASScontroller.classMenuView);
router.get('/classroom/:idType/:id/:classId/people', validator.valId, CLASScontroller.classRoomPeopleView);
router.get('/classroom/:idType/:id/:classId/work', validator.valId, assignmentController.getAllAssignmentView);
router.get('/classroom/:idType/:id/:classId/work/add', validator.valId, assignmentController.addAssignmentView);
router.post('/classroom/:idType/:id/:classId/work/add', upload.array('fileAssignment'), (req, res) => {
    res.send(req.body);
});
router.get('/classroom/:idType/:id/:classId/addPeople', validator.valId, CLASScontroller.classRoomPeopleAddView);


router.get('/add/:what/:idType/:id', validator.valId, AUview.viewAdd);
router.post('/add/:what/:idType/:id', validator.valId, AUDcontroller.controllerAdd);


router.get('/update/:what/:idType/:id/:whatId', validator.valId, validator.validateAndFind, AUview.viewUpdate);
router.post('/update/:what/:idType/:id/:whatId', validator.valId, validator.validateAndFind, AUDcontroller.controllerUpdate);


router.post('/delete/:what/:idType/:id/:whatId', validator.valId, validator.validateAndFind, AUDcontroller.controllerDelete);


router.get('/error', (req, res) => {
    let message = req.query.msg;
    res.render('error', {errorMsg: message});
});

router.get('/sign-out', (req, res) => {
    res.render('signOut');
})


module.exports = router;
