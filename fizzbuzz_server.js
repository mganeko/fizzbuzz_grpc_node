// @ts-check

'use strict'

const PROTO_PATH = __dirname + '/fizzbuzz.proto';

const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const packageDefinition = protoLoader.loadSync(
  PROTO_PATH,
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  });
const fizzbuzz_proto = grpc.loadPackageDefinition(packageDefinition).fizzbuzz;

/**
 * FizzBuzz RPC  for single request, single return
 * @param {object} call
 * @param {function} callback
 */
function singleFizzBuzz(call, callback) {
  const value = call.request.x;
  const result = fizzbuzz(value);
  console.log('fizzbuzz x=' + value + '--> result=' + result);
  callback(null, { result: result });
}

/**
 * FizzBuzz RPC for single request, stream return
 *  count up from 1 to specified number x
 * @param {object} call
 */
function loopFizzBuzz(call) {
  const upTo = call.request.x;
  console.log('loop fizzbuzz 1 to ' + upTo);

  for (let i = 1; i <= upTo; i++) {
    const result = fizzbuzz(i);
    call.write({ result: result });
  }
  call.end();
}

/**
 * FizzBuzz RPC for stream request, single return
 *  concat result for each request, and return whole result
 * @param {object} call
 * @param {function} callback
 */
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

/**
 * FizzBuzz RPC for stream request, stream return
 *  check result for each request, retuns as stream
 * @param {object} call
 */
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

/**
 * function to check fizz/buzz
 * @param {number} x
 * @return {string}
 */
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

  return x + '';
}

/**
 * Starts an RPC server that receives requests for the FizzBuzz service at the
 * sample server port
 */
function main() {
  const server = new grpc.Server();
  // @ts-ignore
  server.addService(fizzbuzz_proto.FizzBuzz.service,
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
