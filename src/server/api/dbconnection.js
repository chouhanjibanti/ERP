let mongo=require("mongoose");
let connection;

exports.erp = () => {
  if (!connection) {
    const mongoUri = process.env.MONGODB_URI ;
    connection = mongo.connect(mongoUri).catch((error) => {
      connection = undefined;
      throw error;
    });
  }

  return connection;
};