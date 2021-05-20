const express = require('express');
const router = express.Router();
const AUDcontroller = require('./AUDcontroller');
const VIEWcontroller = require('./VIEWcontroller');
const schema = require('./../model/schema');
const validator = require('./validate');
const uid = require('uniqid');


router.get('/login', (req, res) => {
    res.render('login');
})

router.post('/login/:idType', async (req, res) => {
    let idType = String(req.params.idType);
    if ("teach" === idType) {
        schema.teacher.find({
            Username: req.body.Username,
            Password: req.body.Password
        }).then(data => {
            if (data[0].Username === req.body.Username) {
                res.redirect(`/classes/${idType}/${data[0].t_Id}`)
            } else {
                res.redirect('/login');
            }
        }).catch(err => {
            res.redirect(`/error?msg=${err.msg}`);
        });
    } else if (idType === 'learn') {
        await schema.student.find({
            Username: req.body.Username,
            Password: req.body.Password
        }).then(data => {
            if (data[0].Username === req.body.Username) {
                res.redirect(`/classes/${idType}/${data[0].s_Id}`)
            } else {
                res.redirect('/login');
            }
        }).catch(err => {
            if (err) return handleError(err);
            res.redirect(`/error?msg=${err.msg}`);
        });
    } else {
        res.redirect(`/error?msg=${encodeURIComponent('id type used in url not found.')}`);
    }
})


router.get('/classes/:idType/:id', async (req, res) => {
    let idType = String(req.params.idType);
    let id = String(req.params.id);
    let allClasses
    let userClasses = []
    await schema.techerClass.find().then(data => {
        allClasses = data
    }).catch(err => {
        if (err) return handleError(err);
        res.redirect(`/error?msg=${encodeURIComponent('There was an error retrieving classes data from database ')}`)
    });
    let valid = false;
    if (idType === 'learn') {
        await schema.student.find({s_Id: id}).then(data => {
            if (data[0].s_Id !== id) {
                valid = false;
            } else {
                valid = true;
            }
        }).catch(err => {
            console.log(err);
            res.redirect(`/error?msg=${encodeURIComponent('Can not find student with the specified id')}`);
        });
        if (valid) {
            if (allClasses !== []) {
                for (let i = 0; i < allClasses.length; i++) {
                    let sClasses = allClasses[i].Students;
                    for (let j = 0; j <= sClasses.length; j++) {
                        if (sClasses[j] === id) {
                            userClasses.push(allClasses[i]);
                        }
                    }
                }
            }
            res.render('classMenu', {classData: userClasses, instruct: false, userId: id});
        } else {
            res.redirect(`/error?msg=${encodeURIComponent('Student classes from the given ID not found')}`);
        }
    } else if (idType === 'teach') {
        await schema.teacher.find({t_Id: id}).then(data => {
            if (data[0].t_Id !== id) {
                valid = false;
            } else {
                valid = true;
            }
        }).catch(err => {
            if (err) return handleError(err);
            res.redirect(`/error?msg=${encodeURIComponent('Can not find teacher with the specified id')}`);
        });
        if (valid) {
            if (allClasses !== []) {
                for (let i = 0; i < allClasses.length; i++) {
                    let tClasses = allClasses[i].Teachers;
                    for (let j = 0; j <= tClasses.length; j++) {
                        if (tClasses[j] === id) {
                            userClasses.push(allClasses[i]);
                        }
                    }
                }
            }
            res.render('classMenu', {classData: userClasses, instruct: true, userId: id});
        } else {
            res.redirect(`/error?msg=${encodeURIComponent('Teacher classes from the given ID not found')}`);
        }
    } else {
        res.redirect(`/error?msg=${encodeURIComponent('id type used in url not found. Test')}`);
    }
})

router.get('/classroom/:idType/:id/:classId/:where', (req, res) => {
})


router.get('/add/:what/:idType/:id', VIEWcontroller.viewAdd);
router.post('/add/:what/:idType/:id', AUDcontroller.controllerAdd);


router.get('/update/:what/:idType/:id/:whatId', (req, res) => {
    let data;
    let idType = req.params.idType;
    let id = req.params.id;
    let what = req.params.what;
    let whatId = req.params.whatId;
    if (idType === 'student') {
        res.redirect(`/error?msg=${encodeURIComponent('Students can not change accounts')}`);
    } else if (idType === 'teacher') {
        if (validator.valId(idType, id)) {
            if (what === 'class') {
                data = validator.validateAndFind('class', whatId);
                if (data === 'error') {
                    res.redirect(`/error?msg=${encodeURIComponent('Their was an error finding a class with the specified id')}`);
                } else {
                    res.render('updateForm', {type: 'techerClass', dataShow: data});
                }
            } else if (what === 'student') {
                data = validator.validateAndFind('student', whatId);
                if (data === 'error') {
                    res.redirect(`/error?msg=${encodeURIComponent('Their was an error finding a student account with the specified id')}`);
                } else {
                    res.render('updateForm', {type: 'student', dataShow: data});
                }
            } else if (what === 'teacher') {
                if (validator.valTeacherAdmin(id)) {
                    data = validator.validateAndFind('student', whatId);
                    if (data === 'error') {
                        res.redirect(`/error?msg=${encodeURIComponent('Their was an error finding a teacher account with the specified id')}`);
                    } else {
                        res.render('updateForm', {type: 'teacher', dataShow: data});
                    }
                } else {
                    res.redirect(`/error?msg=${encodeURIComponent('Only admin can change teacher accounts')}`);
                }
            } else {
                res.redirect(`/error?msg=${encodeURIComponent('The specified account type does not exist')}`);
            }
        }
    }else{
        res.redirect(`/error?msg=${encodeURIComponent('The specified account type does not exist')}`);
    }
})

router.post('/update/:what/:idType/:id/:whatId', (req, res) => {
    if (idType === 'student') {
        res.redirect(`/error?msg=${encodeURIComponent('Students can not change accounts')}`);
    } else if (idType === 'teacher') {
        if (validator.valId(idType, id)) {
            if (what === 'class') {
                schema.techerClass.findOneAndUpdate({c_Id: whatId}, {
                    Title: req.body.title
                }, null, function (err) {
                    if (err) return handleError(err);
                })
            } else if (what === 'student') {
                schema.student.findOneAndUpdate({s_Id: whatId}, {
                    Name: req.body.name,
                    Email: req.body.email,
                    Username: req.body.username,
                    Password: req.body.password
                }, null, function (err) {
                    if (err) return handleError(err);
                });
            } else if (what === 'teacher') {
                if (validator.valTeacherAdmin(id)) {
                    schema.teacher.findOneAndUpdate({t_Id: whatId}, {
                        Name: req.body.name,
                        Email: req.body.email,
                        Username: req.body.username,
                        Password: req.body.password,
                        Admin: req.body.admin
                    }, null, function (err) {
                        if (err) return handleError(err);
                    })
                } else {
                    res.redirect(`/error?msg=${encodeURIComponent('Only admin can change teacher accounts')}`);
                }
            } else {
                res.redirect(`/error?msg=${encodeURIComponent('The specified thing you are trying to change does not exist')}`);
            }
        }
    }else{
        res.redirect(`/error?msg=${encodeURIComponent('The specified ID type does not exist')}`);
    }
})


router.post('/delete/:what/:idType/:id/:whatId', (req, res) => {
    let id = req.params.id;
    let idType = req.params.idType;
    let whatId = req.params.whatId;
    let what = req.params.what;
    if (idType === 'student') {
        res.redirect('/error');
    } else if (idType === 'teacher') {
        if (validator.valId(idType, id)) {
            if (what === 'class') {
                schema.techerClass.findOneAndDelete({c_Id: whatId}, function (err, data) {
                    if (err) return handleError(err);
                    if (!data) {
                        res.redirect(`/error?msg=${encodeURIComponent('There was an error while deleting the class')}`);
                    } else {
                        res.redirect(`/classes/${idType}/${id}`)
                    }
                })
            } else if (what === 'student') {
                schema.techerClass.findOneAndDelete({s_Id: whatId}, function (err, data) {
                    if (err) return handleError(err);
                    if (!data) {
                        res.redirect(`/error?msg=${encodeURIComponent('There was an error while deleting the student account')}`);
                    } else {
                        res.redirect(`/classes/${idType}/${id}`)
                    }
                })
            } else if (what === 'teacher') {
                if (validator.valTeacherAdmin(id)) {
                    schema.techerClass.findOneAndDelete({t_Id: whatId}, function (err, data) {
                        if (err) return handleError(err);
                        if (!data) {
                            res.redirect(`/error?msg=${encodeURIComponent('There was an error while deleting the teacher account')}`);
                        } else {
                            res.redirect(`/classes/${idType}/${id}`)
                        }
                    })
                } else {
                    res.redirect(`/error?msg=${encodeURIComponent('Only admin can delete teacher accounts')}`);
                }
            } else {
                res.redirect(`/error?msg=${encodeURIComponent('The specified object you are trying to delete does not exist')}`);
            }
        }
    } else {
        res.redirect(`/error?msg=${encodeURIComponent('The specified ID type does not exist')}`);
    }
})

module.exports = router;