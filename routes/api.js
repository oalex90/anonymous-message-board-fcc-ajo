/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var bcrypt = require('bcrypt');
var ObjectId = require('mongodb').ObjectId;
var uniqid = require('uniqid');

const SALT_ROUNDS = 10;

module.exports = function (app, db) {
  
  app.route('/api/threads/functionaltest/delete')
  .get(function (req, res){
    let criteria = {board: "functionaltest"}
    db.collection('board').deleteMany({board: "functionaltest"}, (err, doc)=>{
      res.send("Success");
    }) 
  });
  
  app.route('/api/threads/:board')
  .get(function (req, res){
    var board = req.params.board;
    //console.log("board:", board);
    
    db.collection("board")
    .find({board: board})
    .sort({bumped_on: -1})
    .limit(10)
    .toArray((err, results)=>{
      //console.log("results", results);
      let out = results.map(d =>{
        //console.log("d", d);
        d.replies.sort((a,b)=>{
          a = new Date(a.bumped_on);
          b = new Date(b.bumped_on);
          return a>b ? -1 : a<b ? 1 : 0;
        });
        let replycount = d.replies.length;
        let replies;
        if(replycount > 3){
          replies = [
            d.replies[replycount - 1],
            d.replies[replycount - 2],
            d.replies[replycount - 3]
          ];
        }else{
          replies = d.replies.reverse();
        }
        return {
          _id: d._id,
          board: d.board,
          text: d.text,
          created_on: d.created_on,
          bumped_on: d.bumped_on,
          replycount : replycount,
          replies: replies
        };
      });
      res.json(out);
    });
    
  })
  
  .post(function (req, res){
    var board = req.params.board;
    //console.log("board", board);
    var text = req.body.text;
    var pass = req.body.delete_password;
    //console.log("req.body", req.body);
    
    let newThread = {
      board: board,
      text: text,
      delete_password: bcrypt.hashSync(pass, SALT_ROUNDS),
      created_on: new Date(),
      bumped_on: new Date(),
      reported: false,
      replies: []
    };
    
    db.collection("board").insertOne(newThread, (err, document)=>{
      if (err) throw err;
      //console.log("document", document);
      res.redirect("/b/" + board);
    });
    
  })
  
  .put(function (req,res){
    var _id = req.body.thread_id;
    let criteria;
    try{
      criteria = {_id: ObjectId(_id)};
    } catch (e){
      res.send("_id error");
      return
    }
    if(!criteria) return;
    let update = {$set: {reported: true}};
    
    db.collection("board").findOneAndUpdate(criteria, update, (err, result)=>{
      //console.log("result:", result);
      if (err || result.lastErrorObject.n == 0){
        res.send("could not update " + _id);
        return;
      } 
      res.send("Thread reported successfully");
    })
  })
  
  .delete(function (req, res){
    var _id = req.body.thread_id;
    var pass = req.body.delete_password;
    
    let criteria;
    try{
      criteria = {_id: ObjectId(_id)};
    } catch (e){
      res.send("_id error");
      return
    }
    if(!criteria) return;
    //console.log("_id:", _id);
    //console.log("delete pass:", pass);
    
    db.collection("board").findOne(criteria, (err, document)=>{
      //console.log("document:", document);
      if (err || document == [] || document == null){
        res.send("could not delete " + _id);
        return;
      } 
      
      if (bcrypt.compareSync(pass, document.delete_password)){ //remove from database
        //console.log("TRUE!");
        db.collection("board").deleteOne({_id: new ObjectId(_id)}, (er, doc)=>{
          //alert("Successfully deleted theread");
          res.send("Delete successful");
        });
      }
      else{
        //console.log("FALSE!");
        //alert("Delete password is incorrect");
        res.send("Incorrect delete password");
      }
      
    })
  });//
  
    
  app.route('/api/replies/:board')
  .get(function (req, res){
    var board = req.params.board;
    var thread_id = req.query.thread_id;
    //console.log("req.query:", req.query);
    //console.log("req.params:", req.params);
    //console.log("thread_id:", thread_id);
    
    let criteria;
    try{
      criteria = {_id: ObjectId(thread_id)};
    } catch (e){
      res.send("_id error");
      return
    }
    if(!criteria) return;
       
    db.collection("board").findOne(criteria,(err, result)=>{
      //console.log("result", result);
      if (err || result== [] || result == null){
        res.send("could not find " + thread_id);
        return;
      } 
      let replies = result.replies.map(d =>{
        return {
          _id: d._id,
          text: d.text,
          created_on: d.created_on,
          reported: d.reported
        };
      });
      let out = {
        _id: result._id,
        created_on: result.created_on,
        text: result.text,
        reported: result.reported,
        replies:  replies.reverse()
      }
      res.json(out);
    });
  })
  
  .post(function (req, res){
    var board = req.params.board;
    //console.log("board", board);
    var thread_id = req.body.thread_id;
    var text = req.body.text;
    var pass = req.body.delete_password;
    //console.log("req.body", req.body);
    
    let newReply = {
      _id: uniqid(), 
      text: text,
      delete_password: bcrypt.hashSync(pass, SALT_ROUNDS),
      created_on: new Date(),
      reported: false
    };
    let criteria;
    try{
      criteria = {_id: ObjectId(thread_id)};
    } catch (e){
      res.send("_id error");
      return
    }
    if(!criteria) return;
    
    let modify = {
      $push: {replies: newReply}, 
      $set: {bumped_on: new Date()}
    };
    
    db.collection("board").findOneAndUpdate(criteria, modify, (err, document)=>{
      if (err || document.lastErrorObject.n == 0){
        res.send("could not find " + thread_id);
        return;
      } 
      console.log("document", document);
      res.redirect("/b/" + board);
    });
    
  })
  
  .put(function (req, res){
    var reply_id = req.body.reply_id;
    var thread_id = req.body.thread_id;
    
    let criteria;
    try{
      criteria = {_id: new ObjectId(thread_id), "replies._id": reply_id};
    } catch (e){
      res.send("_id error");
      return
    }
    if(!criteria) return;
    
    let update = {$set: {"replies.$.reported": true}};
    console.log("criteria:", criteria);
    
    db.collection("board").findOneAndUpdate(criteria, update, (err, result)=>{
      //console.log("result:", result);
      if (err || result.lastErrorObject.n == 0){
        res.send("could not report");
        return;
      } 
      res.send("Reply reported successfully");
    })
  })
  
  .delete(function (req, res){
    var reply_id = req.body.reply_id;
    var thread_id = req.body.thread_id;
    var pass = req.body.delete_password;
    //console.log("pass:", pass);
    //console.log("reply_id", reply_id);
    
    let criteria;
    try{
      criteria = {_id: new ObjectId(thread_id), "replies._id": reply_id};
    } catch (e){
      res.send("_id error");
      return
    }
    if(!criteria) return;

    //console.log("criteria:", criteria);
    
    /*
    let criteria;
    try{
      criteria = {_id: new ObjectId(thread_id)};
    } catch (e){
      res.send("_id error");
      return
    }
    if(!criteria) return;
    
    
    //let update = {$pull: {replies: {_id: reply_id}}};
    */
    let update = {$set: {"replies.$.text": "[deleted]"}};
    
    db.collection("board").findOne(criteria, (err, document)=>{
      //console.log("document:", document.replies);
      
      
      let thread = document.replies.filter(t => t._id == reply_id)[0];
      //console.log("thread:", thread);
      
      if(thread == null || thread == undefined){
        res.send("could not find reply " + reply_id);
        return;
      }
      
      if (bcrypt.compareSync(pass, thread.delete_password)){ //remove from database
        //console.log("TRUE!");
        db.collection("board").findOneAndUpdate(criteria, update, (er, result)=>{
        //console.log("result:", result);
        res.send("Delete successful");
        });
      }
      else{
        //console.log("FALSE!");
        //alert("Delete password is incorrect");
        res.send("Incorrect delete password");
      }
      
    
      
    })
  });
};
