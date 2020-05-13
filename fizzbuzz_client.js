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
 * call diffrent type of RPC for FizzBuzzs
 */
function main() {
  // @ts-ignore
  const client = new fizzbuzz_proto.FizzBuzz('localhost:50052',
    grpc.credentials.createInsecure());

  // --- single request, single return --
  for (let i = 1; i <= 20; i++) {
    client.singleFizzBuzz({ x: i }, function (err, response) {
      if (err) {
        console.error(err);
      }
      else {
        console.log('singleFizzBuzz i,result:', i, response.result);
      }
    });
  }

  // --- single request, stream return ---
  const call = client.loopFizzBuzz({ x: 30 });
  call.on('data', function (result) {
    console.log('loopFizzBuzz result:', result);
  });
  call.on('end', function () {
    console.log('end loopFizzBuzz');
  });

  // --- stream request, single return ---
  const callMulti = client.multiRequestSingleResult(function (err, response) {
    if (err) {
      console.error(err);
    }
    else {
      console.log('multiRequestSingleResult result:', response.result);
    }
  });
  for (let i = 1; i <= 15; i++) {
    console.log('calling multiRequestSingleResult x=' + i);
    callMulti.write({ x: i });
  }
  callMulti.end();

  // --- stream request, stream return ---
  const callWithStream = client.multiFizzBuzz();
  callWithStream.on('data', function (result) {
    console.log('multiFizzBuzz result:', result);
  });
  callWithStream.on('end', function () {
    console.log('end multiFizzBuzz');
  });
  for (let i = 1; i <= 45; i++) {
    console.log('calling multiFizzBuzz x=' + i);
    callWithStream.write({ x: i });
  }
  callWithStream.end();
}

main();
