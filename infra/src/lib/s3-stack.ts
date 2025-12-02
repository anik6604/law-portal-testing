import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';

export class S3Stack extends cdk.Stack {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket for resume storage (in us-east-1 to match all other resources)
    this.bucket = new s3.Bucket(this, 'ResumeStorageBucket', {
      bucketName: 'resume-storage-tamu-law',
      
      // Block all public access (resumes are private)
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      
      // Server-side encryption with S3-managed keys (AES256)
      encryption: s3.BucketEncryption.S3_MANAGED,
      bucketKeyEnabled: true, // Reduce KMS costs
      
      // CORS configuration for frontend uploads/downloads
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: [
            'http://localhost:5173', // Vite dev server
            'http://localhost:3000', // Alternative dev port
            'http://44.193.183.185', // EC2 instance IP (if using AWS hosting)
            // Add your production domain here when deployed:
            // 'https://yourdomain.com',
          ],
          allowedHeaders: ['*'],
          exposedHeaders: ['ETag'],
          maxAge: 3000,
        },
      ],
      
      // Lifecycle rules to manage storage costs
      lifecycleRules: [
        {
          id: 'transition-to-ia',
          enabled: true,
          // Move objects not accessed for 90 days to Infrequent Access (50% cheaper)
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
        {
          id: 'cleanup-incomplete-uploads',
          enabled: true,
          // Clean up failed multipart uploads after 7 days
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
      
      // Versioning disabled (not needed for resumes, reduces costs)
      versioned: false,
      
      // Object ownership (ACLs disabled, use bucket policies)
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      
      // Deletion policy (RETAIN for production to prevent data loss)
      removalPolicy: cdk.RemovalPolicy.RETAIN, // IMPORTANT: Bucket survives stack deletion
      autoDeleteObjects: false, // Never auto-delete objects
    });

    // Grant access to EC2 instance role if needed
    // Uncomment and replace with your EC2 instance role ARN:
    // const ec2Role = iam.Role.fromRoleArn(this, 'EC2Role', 'arn:aws:iam::ACCOUNT:role/ROLE_NAME');
    // this.bucket.grantReadWrite(ec2Role);

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', { 
      value: this.bucket.bucketName,
      description: 'S3 bucket name for resume storage',
      exportName: 'LawPortalBucketName',
    });
    
    new cdk.CfnOutput(this, 'BucketArn', { 
      value: this.bucket.bucketArn,
      description: 'S3 bucket ARN',
      exportName: 'LawPortalBucketArn',
    });

    new cdk.CfnOutput(this, 'BucketRegion', { 
      value: this.region,
      description: 'S3 bucket region',
    });
  }
}
