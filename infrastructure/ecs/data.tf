data "terraform_remote_state" "vpc" {
  backend = "s3"

  config = {
    bucket         = "ai-game-terraform-state"
    key            = "vpc/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-locks"
    encrypt        = true
  }
}