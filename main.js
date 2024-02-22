const props = PropertiesService.getScriptProperties();
var Access_Token = props.getProperty("ACCESS_TOKEN");
var TestCh = props.getProperty("TEST_CH");
var WebhookToken = props.getProperty("WEBHOOK_TOKEN")

//https://q.trap.jp/api/1.0/oauth2/authorize にPOSTすればよい？

function doPost(e){
  var json = JSON.parse(e.postData.contents).events[0];
  Logger.log(json)

  return ContentService.createTextOutput(JSON.stringify({'content': 'post ok'})).setMimeType(ContentService.MimeType.JSON);

}

//↑bot↓webhook

var secret = "gps_gohan_oishi";
var sheetData = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Data");
var num = sheetData.getRange(2,5).getValue();
//var meshiYesterday = sheetData.getRange(5,5).getValue();
var historyCount=3;
var meshiHistory = sheetData.getRange(5,5,5+historyCount-1,5).getValues();

var list = sheetData.getRange(2,1,num,2).getValues();

function Sendmessage(message){


  var signature = Utilities.computeHmacSignature(Utilities.MacAlgorithm.HMAC_SHA_1,message,secret, Utilities.Charset.UTF_8);
  var sign = signature.reduce(function(str,chr){
    chr = (chr < 0 ? chr + 256 : chr).toString(16);
    return str + (chr.length==1?'0':'') + chr;
  },'');

  UrlFetchApp.fetch(`https://q.trap.jp/api/v3/webhooks/${WebhookToken}`,{
    'headers': {
      'Content-Type': 'text/plain',
      'charset' : 'utf-8',
      "X-TRAQ-Signature": sign
    },
    'method': 'POST',
    'payload': message
  }
                   )

}

function mainichi_bot(){
  var today = new Date()
  var day = today.getDate();
  var now = today.getHours();
  var youbi = today.getDay();

  if(now == 8 && youbi>=1 && youbi<=5){
      while(1){
          var meshiyaID = Math.floor(Math.random() * Math.floor(num));
          var todaymeshi = list[meshiyaID][0];
          var meshiplace = list[meshiyaID][1];

          var flag=true;
          for(var i=0; i<historyCount; i++){
              if(todaymeshi.length == 0 || todaymeshi == meshiHistory[i][0]){
                  flag=false;
              }
          }
          if(flag){
              break;
          }
          //if (todaymeshi != meshiYesterday){
              //break;
          //}
      }
      var meshiData = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(todaymeshi);
      var meshinum = meshiData.getRange(2,4).getValue();
      var meshilist = meshiData.getRange(1,1,meshinum,3).getValues();
      var todayosusume = Math.floor(Math.random() * Math.floor(meshinum));

      var message = "今日の飯屋は「";

      if(meshiplace.length > 0){  // 場所あり
          message = message + "[";
      }
      message = message + todaymeshi;
      if(meshiplace.length > 0){  // 場所あり
          message = message + "](" + meshiplace + ")";
      }
      message = message + "」！\nおすすめメニューは"+meshilist[todayosusume][0]+"("+meshilist[todayosusume][1]+"円)です！";



      if(meshilist[todayosusume][2].length > 0){
          message = message + "\n" + meshilist[todayosusume][2];
      }

      for(var i=0; i<historyCount-1; i++){
          meshiHistory[i][0] = meshiHistory[i+1][0];
      }
      meshiHistory[historyCount-1][0] = todaymeshi;
      sheetData.getRange(5,5,5+historyCount-1,5).setValues(meshiHistory);
      sheetData.getRange(5,6).setValue(message);
  }


  if(message){
      Sendmessage(message);

  }
}
