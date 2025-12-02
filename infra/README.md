# TAMU Law Portal - AWS Infrastructure

AWS CDK infrastructure as code for the TAMU Law Adjunct Hiring Portal.

##  Current Infrastructure (All in `us-east-1`)

| Resource | Type | Cost/mo | Status | Purpose |
|----------|------|---------|--------|---------|
| **RDS** | PostgreSQL 16.8 (db.t3.micro) | ~$13-15 |  Running | Database with pgvector |
| **S3** | `resume-storage-tamu-law` | ~$0.10 |  Active | Resume storage |
| **Secrets Manager** | DB credentials | ~$0.40 |  Active | Secure password storage |
| **EC2** | t3.micro | ~$7.50 |  **OPTIONAL** | Web server (use Render instead) |
| **VPC** | Default VPC | FREE |  Active | Networking |

**Total: ~$21-23/month** (or ~$14/month without EC2)

---

##  Quick Start

### 1. Install Dependencies
```bash
cd infra
npm install
```

### 2. Bootstrap CDK (First Time Only)
```bash
cdk bootstrap aws://YOUR_ACCOUNT_ID/us-east-1
```

### 3. Deploy Infrastructure
```bash
# Get your public IP
MY_IP=$(curl -s ifconfig.me)

# Deploy RDS + S3 (required)
cdk deploy LawRdsStack LawS3Stack -c myIp=$MY_IP

# Deploy EC2 (optional - only if using AWS hosting)
# Uncomment EC2 stack in src/bin/deploy.ts first
cdk deploy LawEc2Stack -c myIp=$MY_IP
```

---

##  Infrastructure Stacks

### 1. RDS Stack - **REQUIRED**
PostgreSQL 16.8 with pgvector for AI-powered resume search.

**Features:**
-  Encrypted at rest (KMS)
-  Daily backups (1-day retention)
-  Public access with IP whitelisting
-  Secrets Manager integration
-  CloudWatch logs (7-day retention)

**Config:**
- Instance: db.t3.micro (2 vCPU, 1GB RAM)
- Storage: 20GB GP3 (auto-scales to 100GB)
- Backup: 08:57-09:27 UTC daily
- Maintenance: Saturday 05:10-05:40 UTC

### 2. S3 Stack - **REQUIRED**
Secure resume file storage.

**Features:**
-  AES-256 encryption
-  Private (no public access)
-  CORS for frontend uploads
-  Lifecycle: move to IA after 90 days

**Config:**
- Bucket: `resume-storage-tamu-law`
- Current size: 53.1 MiB (112 files)

### 3. EC2 Stack - **OPTIONAL**
Web server for AWS hosting (alternative to Render).

**Features:**
-  Amazon Linux 2023
-  Node.js 20 pre-installed
-  IAM roles for S3/Secrets access
-  SSH + HTTP/HTTPS access

**When to use:**
- You need full server control
- Custom OS configurations required
- OK with managing servers

**When NOT to use:**
- Use Render for managed hosting (saves $7.50/mo)
- Want automatic GitHub deployments

---

## ⚙️ Configuration

### Get Database Credentials
```bash
# Endpoint
aws rds describe-db-instances --region us-east-1 \
  --db-instance-identifier lawrdsstack-lawpostgres-enc \
  --query 'DBInstances[0].Endpoint.Address' --output text

# Password
aws secretsmanager get-secret-value --region us-east-1 \
  --secret-id DbSecret685A0FA5-BaG9GAuh6AYh \
  --query 'SecretString' --output text | jq -r '.password'
```

### Update `.env` Files
```bash
# server/.env
DATABASE_URL=postgresql://tamu:PASSWORD@ENDPOINT:5432/law_portal?ssl=true
AWS_REGION=us-east-1
S3_BUCKET_NAME=resume-storage-tamu-law
```

### Add Your IP to RDS Access
```bash
MY_IP=$(curl -s ifconfig.me)
SG_ID=$(aws rds describe-db-instances --region us-east-1 \
  --db-instance-identifier lawrdsstack-lawpostgres-enc \
  --query 'DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId' \
  --output text)

aws ec2 authorize-security-group-ingress --region us-east-1 \
  --group-id $SG_ID --protocol tcp --port 5432 --cidr $MY_IP/32
```

---

##  Cost Optimization

### Save ~$7.50/month: Use Render instead of EC2
```bash
# Stop EC2 instance
aws ec2 stop-instances --region us-east-1 --instance-ids i-0f6a391245b1f0d26

# Or terminate it completely
aws ec2 terminate-instances --region us-east-1 --instance-ids i-0f6a391245b1f0d26
```

### Delete Unused Elastic Beanstalk App
```bash
aws elasticbeanstalk delete-application --region us-east-1 \
  --application-name github-setup-tamu-law
```

---

## 🗑️ Cleanup

### Delete Specific Stacks
```bash
cdk destroy LawEc2Stack    # Remove EC2 only
cdk destroy LawRdsStack    # Remove database
cdk destroy LawS3Stack     # Remove S3 (bucket retained)
```

### Delete Everything
```bash
cdk destroy --all
```

**Note:** S3 bucket and KMS keys are set to `RETAIN` and must be manually deleted if needed.

---

## Security Notes

### Currently Secured
- RDS encrypted (KMS)
- S3 encrypted (AES-256)
- Secrets Manager for passwords
- Security groups restrict access
- No NAT gateways (cost control)

### For Production
1. Enable RDS deletion protection
2. Restrict SSH to specific IPs
3. Consider Multi-AZ for RDS (~+$15/mo)
4. Enable Performance Insights (~+$7/mo)

---

## Troubleshooting

### Can't Connect to RDS
1. Check your IP is whitelisted in security group
2. Verify RDS is publicly accessible
3. Test: `psql "postgresql://tamu:PASSWORD@ENDPOINT:5432/law_portal"`

### S3 Access Denied
1. Check IAM credentials
2. Verify bucket CORS settings
3. Ensure region matches (`us-east-1`)

### CDK Deploy Fails
```bash
# Check credentials
aws sts get-caller-identity

# Re-bootstrap
cdk bootstrap aws://ACCOUNT_ID/us-east-1 --verbose
```

---

## 📚 Resources

- [AWS CDK Docs](https://docs.aws.amazon.com/cdk/)
- [RDS PostgreSQL Guide](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)
- [S3 Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html)
- [AWS Pricing Calculator](https://calculator.aws/)

---

**Last Updated:** December 2, 2025  
**Team:** TAMU CSCE 482 Capstone (Fall 2025)
