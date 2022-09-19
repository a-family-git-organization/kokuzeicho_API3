function getxml() {

  // シートをシート名で取得
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('適格請求書発行事業者検索用シート');

  // 以前の検索結果を削除
  // そのシートにある B7:E26 のセル範囲を取得
  let range2 = sheet.getRange("B7:E26");

  // そのセル範囲にある値のみクリア
  range2.clearContent();

  // 国税庁から発行される13桁のappIDを入力
  let appID = '●●●●●●●●●●●●●';

  // 検索したい文言を入力するセル(B2)の値を取得
  let range1 = sheet.getRange(2,2).getValue();

  // 形式(xml)を指定
  let type = 12;

  // 検索の方法を指定
  let mode = 2;

  // 法人番号検索用のURLを生成 
  let url = 'https://api.houjin-bangou.nta.go.jp/4/name?id=' + appID + '&name=' + range1 + '&type=' + type + '&mode=' + mode;

  try{
  // 生成したURLからUrlFetchAppでxmlデータを取得
  let corporatenumber_response = UrlFetchApp.fetch(url).getContentText();
  }
  // エラーの場合、エラーメッセージを表示
  catch (e) {
      sheet.getRange(7,2,1,1).setValue('法人番号検索に失敗しました。エラーメッセージを確認してください。半角英数字で検索していないかを確認してください');
  }
  finally{
      let corporatenumber_response = UrlFetchApp.fetch(url).getContentText();
      
      // xmlデータから検索結果件数を抽出
      let count = corporatenumber_response.match(/(?<=<count>)(.{1,30})(?=<\/count>)/g)[0];

      // 検索結果件数に合わせて処理を分岐させる
      // 0件の場合は「検索結果がありません」と表示
      if(count == 0){
      sheet.getRange(7,2,1,1).setValue('検索結果はありません');
      }

      // 20件以上の場合は検索結果を20件にするため19に変更
      if(count > 19){
        let result = 19;
        output(sheet,corporatenumber_response,result);
      }

      //それ以外の場合は件数に-1した値をresultに渡す
      else{
        let result = count - 1;
        output(sheet,corporatenumber_response,result);
      }
  }
}; 

// sheet,corporatenumber_response,resultをもらって検索結果を整理してシートに情報を記載
function output(sheet,corporatenumber_response,result){

  // 国税庁から発行される13桁のappIDを入力
  let appID = '●●●●●●●●●●●●●';

  // 形式(json)を指定
  let type = 21;

  // 変更履歴を含める
  let history = 1;

  //0からresult(countよりも1低い値)まで以下を繰り返す
  for (var i=0; i <= result; i++){

    // 会社名、法人番号、都道府県を取得
    let name = corporatenumber_response.match(/(?<=<name>)(.{1,30})(?=<\/name>)/g)[i];
    let corporatenumber = corporatenumber_response.match(/(?<=<corporateNumber>)(.{1,30})(?=<\/corporateNumber>)/g)[i];
    let prefecture = corporatenumber_response.match(/(?<=<prefectureName>)(.{1,30})(?=<\/prefectureName>)/g)[i];
    
    // 法人番号の頭文字に「T」を付け加える
    let registratedNumber = "T" + corporatenumber;
    console.log(registratedNumber);

    // 適格請求書発行事業者検索用のURLを生成 
    let url = 'https://web-api.invoice-kohyo.nta.go.jp/1/num?id=' + appID + '&number=' + registratedNumber + '&type=' + type + '&history' + history;
      
    // 生成したURLからUrlFetchAppでxmlデータを取得
    let registrated_response = UrlFetchApp.fetch(url);
    let json = JSON.parse(registrated_response);
      
    // 会社名、法人番号、都道府県を記載
    sheet.getRange(7+i,2,1,1).setValue(name);
    sheet.getRange(7+i,3,1,1).setValue(corporatenumber);
    sheet.getRange(7+i,4,1,1).setValue(prefecture);

    // 該当する適格請求書発行事業者の番号があれば番号を記載
    try{
      let is_registrated = json["announcement"][0]["registratedNumber"];
      sheet.getRange(7+i,5,1,1).setValue(is_registrated);
    }

    // 該当する適格請求書発行事業者の番号がなければ「現時点該当なし」と記載
    catch (e) {
      sheet.getRange(7+i,5,1,1).setValue("現時点該当なし");
    }
  }
};