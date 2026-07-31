# This IAM policy and role is specifically for GitHub Actions OIDC integration
# It allows GitHub Actions to assume a role and push to ECR, and update EKS.

data "aws_iam_policy_document" "github_actions_assume_role" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/token.actions.githubusercontent.com"]
    }
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:YOUR_GITHUB_ORG/careerpilot-ai:*"] # Replace YOUR_GITHUB_ORG
    }
  }
}

data "aws_caller_identity" "current" {}

resource "aws_iam_role" "github_actions" {
  name               = "careerpilot-github-actions-role"
  assume_role_policy = data.aws_iam_policy_document.github_actions_assume_role.json
}

# Attach standard policies to the GitHub actions role (ECR PowerUser for pushing images)
resource "aws_iam_role_policy_attachment" "github_actions_ecr" {
  role       = aws_iam_role.github_actions.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser"
}

# (Optional) You can also attach EKS cluster admin policy to this role if terraform or helm is run from GitHub actions
