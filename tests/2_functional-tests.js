/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  const BOARD = "functionaltest";
  var threadId;
  var replyId;
  
  suite('Functional Test Prep', function() {
    test("Test GET /api/threads/functionaltest/delete", function(done){
      chai.request(server)
      .get('/api/threads/functionaltest/delete')
      .end(function(err, res){
        //console.log("testtesttest");
        //console.log("res.status", res.status);
        assert.equal(res.text,"Success");
        done();
      });
    });
  });

  suite('API ROUTING FOR /api/threads/:board', function() {
    
    suite('POST', function() {
      test('Test POST /api/threads/:board with text and delete_password', function(done) {
        chai.request(server)
        .post('/api/threads/'+ BOARD)
        .send({text: "Functional Test Title", delete_password: "password"})
        .end(function(err, res){
          //testId = res.body._id;
          //console.log("res.body", res);//
          assert.equal(res.status, 200);
          done();
        });
      });
    });
    
    suite('GET', function() {
      test('Test POST /api/threads/:board with text and delete_password', function(done) {
        chai.request(server)
        .get('/api/threads/'+ BOARD)
        .end(function(err, res){
          threadId = res.body[0]._id;
          //console.log("threadId:", threadId);
          //console.log("res.body:", res.body);//
          assert.equal(res.status, 200);
          assert.property(res.body[0], '_id');
          assert.property(res.body[0], 'created_on');
          assert.property(res.body[0], 'bumped_on');
          assert.equal(res.body[0].board, BOARD);
          assert.equal(res.body[0].text, 'Functional Test Title');
          assert.equal(res.body[0].replycount, 0);
          assert.isArray(res.body[0].replies);
          done();
        });
      });
    });
    
    
    suite('PUT', function() {
      test('Test PUT /api/threads/:board with valid thread_id', function(done) {
        chai.request(server)
        .put('/api/threads/'+ BOARD)
        .send({thread_id: threadId})
        .end(function(err, res){
          //console.log("res.text:", res.text);//
          assert.equal(res.status, 200);
          assert.equal(res.text, "Thread reported successfully")
          done();
        });
      });
      test('Test PUT /api/threads/:board with invalid thread_id', function(done) {
        chai.request(server)
        .put('/api/threads/'+ BOARD)
        .send({thread_id: "5d804a3c8b74ab520f44dd53"})
        .end(function(err, res){
          //console.log("res.text:", res.text);//
          assert.equal(res.status, 200);
          assert.equal(res.text, "could not update 5d804a3c8b74ab520f44dd53")
          done();
        });
      });
    });
  
  });
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    suite('POST', function() {
      test('Test POST /api/threads/:board with text and delete_password', function(done) {
        chai.request(server)
        .post('/api/replies/'+ BOARD)
        .send({thread_id: threadId, text: "Functional Test Reply Title", delete_password: "password"})
        .end(function(err, res){
          //console.log("res.body", res);
          assert.equal(res.status, 200);
          done();
        });
      });
    });
    
    suite('GET', function() {
      test('Test GET /api/replies/:board', function(done) {
        chai.request(server)
        .get('/api/replies/'+ BOARD + "/?thread_id="+threadId)
        .end(function(err, res){
          //console.log("res.body:", res.body);
          replyId = res.body.replies[0]._id;
          //console.log("replyId:", replyId);
          
          assert.equal(res.status, 200);
          assert.property(res.body, 'created_on');
          assert.equal(res.body._id, threadId);
          assert.equal(res.body.text, 'Functional Test Title');
          assert.equal(res.body.reported, true);
          assert.isArray(res.body.replies);
          assert.equal(res.body.replies.length, 1);
          assert.property(res.body.replies[0], '_id');
          assert.property(res.body.replies[0], 'created_on');
          assert.equal(res.body.replies[0].text, "Functional Test Reply Title");
          assert.equal(res.body.replies[0].reported, false);
          done();
        });
      });
    });
    
    suite('PUT', function() {
      test('Test PUT /api/threads/:board with correct thread_id and reply_id', function(done) {
        chai.request(server)
        .put('/api/replies/'+ BOARD)
        .send({thread_id: threadId, reply_id: replyId})
        .end(function(err, res){
          //console.log("res.body", res);
          assert.equal(res.status, 200);
          assert.equal(res.text, "Reply reported successfully");
          done();
        });
      });
    });
    
    suite('DELETE', function() {
      test('Test DELETE /api/threads/:board with correct thread_id and reply_id', function(done) {
        chai.request(server)
        .delete('/api/replies/'+ BOARD)
        .send({thread_id: threadId, reply_id: replyId, delete_password: "password"})
        .end(function(err, res){
          //console.log("res.body", res);//
          assert.equal(res.status, 200);
          assert.equal(res.text, "Delete successful");
          done();
        });
      });
    });
    
    suite('DELETE THREAD', function() {
      test('Test DELETE /api/threads/:board with correct thread_id and password', function(done) {
        chai.request(server)
        .delete('/api/threads/'+ BOARD)
        .send({thread_id: threadId, delete_password: "password"})
        .end(function(err, res){
          //console.log("res.body", res);//
          assert.equal(res.status, 200);
          assert.equal(res.text, "Delete successful");
          done();
        });
      });
    });
    
  });

});
