//// @ts-check

//var PROTO_PATH = __dirname + '/../../protos/helloworld.proto';
var PROTO_PATH = __dirname + '/fizzbuzz.proto';

var grpc = require('grpc');
var protoLoader = require('@grpc/proto-loader');
var packageDefinition = protoLoader.loadSync(
  PROTO_PATH,
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  });
var fizzbuzz_proto = grpc.loadPackageDefinition(packageDefinition).fizzbuzz;


function singleFizzBuzz(call, callback) {
  const value = call.request.x;
  const result = fizzbuzz(value);
  console.log('fizzbuzz x=' + value + '--> result=' + result);
  callback(null, { result: result });
}

function loopFizzBuzz(call) {
  const upTo = call.request.x;
  console.log('loop fizzbuzz 1 to ' + upTo);

  for (let i = 1; i <= upTo; i++) {
    const result = fizzbuzz(i);
    call.write({ result: result });
  }
  call.end();
}

function multiRequestSingleResult(call, callback) {
  console.log('--- multiRequestSingleResult start ---')
  let resultTotal = '';

  call.on('data', function (request) {
    const value = request.x;
    const result = fizzbuzz(value);
    console.log('multiRequestSingleResult x=' + value + '--> result=' + result);
    resultTotal += (result + ', ');
  });
  call.on('end', function () {
    callback(null, { result: resultTotal });
  });
}

function multiFizzBuzz(call) {
  console.log('--- multiFizzBuzz start ---');
  call.on('data', function (request) {
    const value = request.x;
    const result = fizzbuzz(value);
    console.log('multiFizzBuzz x=' + value + '--> result=' + result);
    call.write({ result: result });
  });
  call.on('end', function () {
    console.log('--- multiFizzBuzz end ---');
    call.end();
  });
}

function fizzbuzz(x) {
  if ((x % 15) === 0) {
    return 'FizzBuzz';
  }
  if ((x % 3) === 0) {
    return 'Fizz';
  }
  if ((x % 5) === 0) {
    return 'Buzz';
  }

  return x;
}

/**
 * Starts an RPC server that receives requests for the Greeter service at the
 * sample server port
 */
function main() {
  var server = new grpc.Server();
  server.addService(fizzbuzz_proto.FizzBuzz.service,
    //server.addProtoService(fizzbuzz_proto.FizzBuzz.service,
    {
      singleFizzBuzz: singleFizzBuzz,
      loopFizzBuzz: loopFizzBuzz,
      multiRequestSingleResult: multiRequestSingleResult,
      multiFizzBuzz: multiFizzBuzz
    }
  );
  server.bind('0.0.0.0:50052', grpc.ServerCredentials.createInsecure());
  server.start();
}

main();
