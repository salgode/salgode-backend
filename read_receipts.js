/* eslint-disable no-console */
/* eslint-disable no-restricted-syntax */
const aws = require('aws-sdk');
const moment = require('moment');
const { Expo } = require('expo-server-sdk');

const ReceiptsTableName = process.env.dynamodb_receipts_table_name;

const dynamoDB = new aws.DynamoDB.DocumentClient();
const expo = new Expo();

async function getReceipts() {
  const oneHourAgo = moment().subtract(1, 'hours').format('YYYY-MM-DDTHH:mm:ss');
  const fiveHoursAgo = moment().subtract(5, 'hours').format('YYYY-MM-DDTHH:mm:ss');
  console.log('oneHourAgo', oneHourAgo);
  const params = {
    TableName: ReceiptsTableName,
    FilterExpression:
      'created_at > :fiveHoursAgo and created_at < :oneHourAgo',
    ExpressionAttributeValues: {
      ':oneHourAgo': oneHourAgo,
      ':fiveHoursAgo': fiveHoursAgo
    }
  };
  const data = await dynamoDB.scan(params).promise();
  return data.Items;
}

exports.handler = async () => {
  console.log('getting receipts');
  const dbReceipts = await getReceipts();

  if (!dbReceipts || !dbReceipts.length) {
    console.log('no receipts found under conditions');
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'No mature unread receipts' })
    };
  }

  // eslint-disable-next-line
  const receiptIds = dbReceipts.map(rcp => rcp.receipt_id);
  console.log('receiptIds', receiptIds);
  const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
  console.log('receiptIdChunks', receiptIdChunks);

  for (const chunk of receiptIdChunks) {
    try {
    // eslint-disable-next-line no-await-in-loop
      let receipts = await expo.getPushNotificationReceiptsAsync(chunk);
      receipts = Object.values(receipts);
      console.log('receipts', receipts);

      for (const receipt of receipts) {
        if (receipt.status === 'error') {
          console.error(receipt.message);
          if (receipt.details && receipt.details.error) {
            console.error(receipt.details.error);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'All mature receipts have been read, details in logs above this message'
    })
  };
};
