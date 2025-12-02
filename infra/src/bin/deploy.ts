#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { RdsStack } from '../lib/rds-stack';
import { S3Stack } from '../lib/s3-stack';
import { Ec2Stack } from '../lib/ec2-stack';

const app = new cdk.App();

const myIp = app.node.tryGetContext('myIp') || process.env.MY_IP || '';
if (!myIp) {
  console.error('[ERROR] Please provide your public IP for RDS access:');
  console.error('   cdk deploy LawRdsStack -c myIp=YOUR_PUBLIC_IP');
  console.error('   OR set MY_IP environment variable');
  console.error('');
  console.error('TIP: Find your IP with: curl ifconfig.me');
  process.exit(1);
}

// CRITICAL: All resources deployed to us-east-1 for consistency
// DO NOT CHANGE THE REGION unless you plan to migrate ALL resources
const env = { 
  account: process.env.CDK_DEFAULT_ACCOUNT, 
  region: 'us-east-1', // FIXED REGION for all resources
};

console.log('[INFO] Deploying TAMU Law Portal Infrastructure');
console.log(`[INFO] Account: ${env.account}`);
console.log(`[INFO] Region: ${env.region}`);
console.log(`[INFO] Authorized IP: ${myIp}\n`);

// RDS PostgreSQL Database (REQUIRED)
new RdsStack(app, 'LawRdsStack', { 
  env, 
  myIp,
  description: 'TAMU Law Portal - PostgreSQL 16 with pgvector',
});

// S3 bucket for resume storage (REQUIRED)
// Note: Bucket already exists, manage it with CDK for infrastructure as code
new S3Stack(app, 'LawS3Stack', { 
  env,
  description: 'TAMU Law Portal - S3 resume storage',
});

// EC2 instance for hosting (OPTIONAL)
// Only deploy this if hosting on AWS instead of Render
// Uncomment below to enable:
/*
new Ec2Stack(app, 'LawEc2Stack', { 
  env,
  description: 'TAMU Law Portal - EC2 web server (OPTIONAL)',
});
*/

// Global tags for all resources
cdk.Tags.of(app).add('Project', 'TAMU-Law-Adjunct-Portal');
cdk.Tags.of(app).add('Environment', 'production');
cdk.Tags.of(app).add('ManagedBy', 'AWS-CDK');
