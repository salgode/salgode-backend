const aws = require('aws-sdk');
const dynamoDB = new aws.DynamoDB.DocumentClient();
const uuidv4 = require('uuid/v4');
const moment = require('moment');
const bcrypt = require('bcryptjs');

function hashPassword(userPassword) {
  let Salt = bcrypt.genSaltSync(15);
  return bcrypt.hashSync(userPassword, Salt);
}

async function checkEmail(userEmail) {
  let params = {
    TableName: process.env.dynamodb_table_name,
    IndexName: process.env.dynamodb_index_name,
    ProjectionExpression: "user_id, email",
    KeyConditionExpression: "email = :email",
    ExpressionAttributeValues: {
      ":email": userEmail
    }
  };
  let data = await dynamoDB.query(params).promise();
  return data.Count;
}

async function createUser(userId, bearerToken, userEmail, passwordHash, firstName, lastName, userPhone, identificationImages, createdAt) {
  let params = {
    TableName: process.env.dynamodb_table_name,
    Item: {
      user_id: userId,
      email: userEmail,
      password_hash: passwordHash,
      bearer_token: bearerToken,
      first_name: firstName,
      last_name: lastName,
      phone: userPhone,
      user_identifications: {
        identification_image_front: identificationImages.identification_image_front,
        identification_image_back: identificationImages.identification_image_back,
        selfie_image: identificationImages.selfie_image
      },
      created_at: createdAt,
      updated_at: createdAt
    }
  };
  let data = await dynamoDB.put(params).promise();
  return data;
}

exports.handler = async (event) => {
    let body = JSON.parse(event.body);
    let userEmail = body.email;
    let userPassword = body.password;
    let firstName = body.first_name;
    let lastName = body.last_name;
    let userPhone = body.phone;
    let identificationImages = body.user_identifications;

    let emailIsUsed = await checkEmail(userEmail);

    if (emailIsUsed > 0) {
      let responseBody = {
        message: 'Email has already been used'
      };
      return {
          statusCode: 409,
          headers: {'Access-Control-Allow-Origin': '*'},
          body: JSON.stringify(responseBody)
      };
    }
    else {
      let userId = 'usr_' + uuidv4();
      let bearerToken = uuidv4();
      let createdAt = moment().format('YYYY-MM-DDTHH:mm:ss-04:00');
      let passwordHash = hashPassword(userPassword);
      await createUser(userId, bearerToken, userEmail, passwordHash, firstName, lastName, userPhone, identificationImages, createdAt);
      let responseBody = {
        message: 'User has been created',
        user: {
          user_id: userId,
          email: userEmail,
          bearer_token: bearerToken,
          first_name: firstName,
          last_name: lastName,
          phone: userPhone,
          user_identifications: {
            identification_image_front: identificationImages.identification_image_front,
            identification_image_back: identificationImages.identification_image_back,
            selfie_image: identificationImages.selfie_image
          },
          created_at: createdAt,
          updated_at: createdAt
        }
      };
      return {
          statusCode: 201,
          headers: {'Access-Control-Allow-Origin': '*'},
          body: JSON.stringify(responseBody)
      };
    }

};
