function onOpen() {
  SpreadsheetApp.getActiveSpreadsheet()
  .addMenu('GAS実行', [
    {name: '検索', functionName: 'getxml'},
  ]);
}    