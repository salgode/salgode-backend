const aws = require('aws-sdk');

const BaseEmailConfirmationUrl = process.env.salgode_email_confirmation_base_url;
const UsersTableName = process.env.dynamodb_users_table_name;

const dynamoDB = new aws.DynamoDB.DocumentClient();
const ses = new aws.SES();

function parseConfirmationUrl(userId, token) {
  return `${BaseEmailConfirmationUrl}?user=${userId}&token=${token}`;
}

async function getUser(userId) {
  const params = {
    TableName: UsersTableName,
    Key: {
      user_id: userId
    },
    ProjectionExpression: 'first_name, email, email_token'
  };
  const data = await dynamoDB.get(params).promise();
  return data.Item;
}

async function sendConfirmationEmail(recipientAddress, recipientName, confirmationLink) {
  const params = {
    Destination: {
      ToAddresses: [recipientAddress]
    },
    Message: {
      Subject: { Data: 'Bienvenid@ a SALGODE - Confirma tu email' },
      Body: {
        Text:
        {
          Data:
`Hola ${recipientName}!

List@ para hacer del mundo un lugar mejor?

Confirma tu email con este link ${confirmationLink}

Atentamente,
Equipo #SalgoDe`
        }
      }
    },
    Source: 'noreply@salgode.cl'
  };

  const result = await ses.sendEmail(params).promise();
  return result;
}

exports.handler = async (event) => {
  const userId = event.requestContext.authorizer.user_id;
  const user = await getUser(userId);

  const confirmationUrl = parseConfirmationUrl(userId, user.email_token);

  await sendConfirmationEmail(user.email, user.first_name, confirmationUrl);

  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({
      action: 'resend email',
      success: true,
      resource: 'user',
      resource_id: userId
    })
  };
};
