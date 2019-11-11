const aws = require('aws-sdk');
const moment = require('moment');

const UsersTableName = process.env.dynamodb_users_table_name;

const dynamoDB = new aws.DynamoDB.DocumentClient();
const ses = new aws.SES();

async function getUser(userId, imageField) {
  const params = {
    TableName: UsersTableName,
    Key: { user_id: userId },
    ProjectionExpression: 'email, first_name, user_identifications'
  };
  const data = await dynamoDB.get(params).promise();
  const [field, subfield] = imageField.split('.');
  if (subfield) {
    return [data.Item.email, data.Item.first_name, data.Item.user_identifications[field][subfield]];
  }
  return [data.Item.email, data.Item.first_name, data.Item.user_identifications[field]];
}

async function reviewImage(userId, imageField) {
  const timestamp = moment().format('YYYY-MM-DDTHH:mm:ss');
  const [field, subfield] = imageField.split('.');
  const params = {
    TableName: UsersTableName,
    Key: {
      user_id: userId
    },
    ExpressionAttributeNames: {},
    ExpressionAttributeValues: { ':t': true, ':now': timestamp }
  };
  if (subfield) {
    params.UpdateExpression = 'set user_verifications.#field.#subfield_checked = :t, updated_at = :now';
    params.ExpressionAttributeNames['#field'] = field;
    params.ExpressionAttributeNames['#subfield_checked'] = `${subfield}_checked`;
  } else {
    params.UpdateExpression = 'set user_verifications.#field_checked = :t, updated_at = :now';
    params.ExpressionAttributeNames['#field_checked'] = `${field}_checked`;
  }
  const data = await dynamoDB.update(params).promise();
  return data.Attributes;
}

async function notifyUser(recipientAddress, recipientName, imageField) {
  const mapFields = {
    selfie_image: 'selfie',
    'identification.front': 'la parte frontal de tu carnet de identidad',
    'identification.back': 'la parte trasera de tu carnet de identidad',
    'driver_license.front': 'la parte frontal de tu licencia de conducir',
    'driver_license.back': 'la parte trasera de tu licencia de conducir'
  };
  const params = {
    Destination: {
      ToAddresses: [recipientAddress]
    },
    Message: {
      Subject: { Data: 'SALGODE - Imagen con problemas' },
      Body: {
        Text:
        {
          Data:
`Hola ${recipientName}!

La imagen que subiste como ${mapFields[imageField]} no ha podido ser verificada.
Por favor, sube una foto que no deje dudas al respecto.

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

function parseImageField(rawField) {
  return rawField.replace('-', '.');
}

exports.handler = async (event) => {
  const userId = event.queryStringParameters.user;
  const imageFieldRaw = event.queryStringParameters.field;
  const imageId = event.pathParameters.image;

  const imageField = parseImageField(imageFieldRaw);
  const [email, firstName, realImageId] = await getUser(userId, imageField);
  if (realImageId !== imageId) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(
        {
          action: 'review',
          success: false,
          resource: 'image',
          resource_id: imageId,
          message: 'Wrong image id'
        }
      )
    };
  }

  await reviewImage(userId, imageField);
  await notifyUser(email, firstName, imageField);

  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(
      {
        action: 'review',
        success: true,
        resource: 'image',
        resource_id: imageId
      }
    )
  };
};
