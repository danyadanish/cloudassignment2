import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { SNS } from '@aws-sdk/client-sns';

const dynamo = DynamoDBDocument.from(new DynamoDB());
const sns = new SNS();

export const handler = async (event) => {
    for (const record of event.Records) {
        try {
            // Parse the incoming SQS message
            const messageBody = JSON.parse(record.body);

            const order = {
                orderId: messageBody.orderId,
                userId: messageBody.userId,
                itemName: messageBody.itemName,
                quantity: parseInt(messageBody.quantity, 0),
                status: messageBody.status,
                timestamp: messageBody.timestamp
            };

            // Insert order into DynamoDB
            await dynamo.put({
                TableName: "Orders",
                Item: order
            });

            console.log(`✅ Order ${order.orderId} stored in DynamoDB.`);

            // Publish success notification to SNS
            await sns.publish({
                TopicArn: "arn:aws:sns:eu-north-1:688567293311:OrderSuccess",
                Message: JSON.stringify(order),
            });

            console.log(`📢 Order ${order.orderId} published to SNS OrderSuccess.`);
        } catch (error) {
            console.error(`❌ Error processing order:`, error);
        }
    }

    return { statusCode: 200, body: "Orders processed successfully." };
};