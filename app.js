

//purpose : This is the main file it containts Knowladge Article.

const builder = require('botbuilder');
const restify = require('restify');
const Request = require('request');
const htmlToText = require('html-to-text');
const TurndownService = require('turndown');
var fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();


var inMemoryStorage = new builder.MemoryBotStorage();
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3979, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

var bot = new builder.UniversalBot(connector, [
    function (session) {
        session.beginDialog('QnAMaker');
    }
]).set('storage', inMemoryStorage); 

server.post('/api/messages', connector.listen());

//QnaMaker Dialog
bot.dialog('QnAMaker', [
    function (session, args, next) {
        var qnaMakerResult
        const question = session.message.text;
        if(question == 'hi' || question == 'Hi')
        {
             var jsonData = JSON.stringify(session.message);
             var jsonParse = JSON.parse(jsonData);
             session.conversationData.userName=jsonParse.address.user.name;      
             session.send("Hello %s I'm the Infor Knowladge Article Bot. How can I help you today? \n You can report an issue by entering your query",session.conversationData.userName);
           
        }
        else
        {
           const bodyText = JSON.stringify({ top: 5, question: question })
           const QnaMakerUrl = process.env.QnAEndpointHostName +'/qnamaker/knowledgebases/'+ process.env.QnAKnowledgebaseId +'/generateAnswer';
           try
           {
                Request.post({ url: QnaMakerUrl, body: bodyText, headers: {"Authorization": "EndpointKey"+ process.env.QnASubscriptionKey, "Content-Type": "application/json" } }, (err, code, body) => {
                const response = JSON.parse(body);
                if (response.answers.length > 0) {                   
                    //calculate length of question
                    session.dialogData.qnaMakerResult = qnaMakerResult = response;
                    var questionOptions = [];
                            qnaMakerResult.answers.forEach(function (qna) {
                                if (qna.score > 50) {
                                    questionOptions.push(qna.questions[0]);
                                }
                            });

                    console.log(questionOptions);
                    if(questionOptions.length == 1)
                    {

                        session.dialogData.qnaMakerResult = qnaMakerResult = response;                
                        var ans=response.answers[0].answer;                       
                           
                            // Create an instance of the turndown service
                            let turndownService = new TurndownService();                        
                            let markdown = turndownService.turndown(ans);
                            session.send(markdown);                     
                            session.endDialog();
                    }
                    else if(questionOptions.length > 1)
                    {
                        var questionOptionsList = [];
                        qnaMakerResult.answers.forEach(function (qna) {
                            if (qna.score > 50) {
                                questionOptionsList.push(qna.questions[0]);
                            }
                        });   

                        session.send("Multiple question returned for related topic.");
                        builder.Prompts.choice(session, "Select Name",questionOptionsList,{listStyle:2});                     
                       
                    }
                    else
                    {                       
                            session.send("Answer not found for given query");
                            session.endDialog();
                       
                    }
                }
                else {
                    session.send('No data found for given query.');                   
                    session.endDialog();
                }         
                });
           }
           catch
           {
            console.log("Exception when connecting with QNA Maker");
           }
       
        }
    } ,
    function (session, results) {          
        var str=results.response.entity;
         if(results.response.entity)
         {
                var qnaMakerResult
                const question = str;
                 
                    const bodyText = JSON.stringify({ top: 1, question: question })
                    const QnaMakerUrl = process.env.QnAEndpointHostName +'/qnamaker/knowledgebases/'+ process.env.QnAKnowledgebaseId +'/generateAnswer';
                    try
                    {
                        
                            Request.post({ url: QnaMakerUrl, body: bodyText, headers: {"Authorization": "EndpointKey"+ process.env.QnASubscriptionKey, "Content-Type": "application/json" } }, (err, code, body) => {
                            const response = JSON.parse(body);
                            if (response.answers.length > 0) {

                                session.dialogData.qnaMakerResult = qnaMakerResult = response;                
                                var ans=response.answers[0].answer;              
                                // Create an instance of the turndown service
                                let turndownService = new TurndownService();                        
                                let markdown = turndownService.turndown(ans);
                                session.send(markdown);   
                                session.endDialog();           
                            }
                            else {
                                session.send('No data found for given query.');                   
                                session.endDialog();
                            }         
                            });
                    }
                    catch
                    {
                        console.log("Exception when connecting with QNA Maker");
                        session.endDialog();
                    }       
        }
        else
        {     
           session.send("Please Select Option"); 
           session.endDialog();
        }
    }
     
]).triggerAction({
    matches: 'QnAMaker'
})


