terraform {
  backend "s3" {
    bucket         = "ai-game-terraform-state"
    key            = "ecs/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-locks"
    encrypt        = true
  }
}
