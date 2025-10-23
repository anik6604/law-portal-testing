#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { RdsStack } from '../lib/rds-stack';

const app = new cdk.App();

const myIp = app.node.tryGetContext('myIp') || process.env.MY_IP || '';
if (!myIp) {
  console.error('Please provide your public IP via cdk context (cdk deploy -c myIp=1.2.3.4) or MY_IP env var');
  process.exit(1);
}

new RdsStack(app, 'LawRdsStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  myIp
});
