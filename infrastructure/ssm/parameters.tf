resource "aws_ssm_parameter" "db_password" {
  name  = "/ai-game/db/password"
  type  = "SecureString"
  value = random_password.db.result
}

resource "aws_ssm_parameter" "database_url" {
  name = "/ai-game/db/url"
  type = "SecureString"
  value = "postgresql://postgres:${random_password.db.result}@${aws_db_instance.postgres.address}:5432/ai_game"
}

resource "aws_ssm_parameter" "gemini_api_key" {
  name  = "/ai-game/gemini/api_key"
  type  = "SecureString"
  value = var.gemini_api_key
}

resource "aws_ssm_parameter" "slack_webhook" {
  name  = "/ai-game/slack/webhook"
  type  = "SecureString"
  value = var.slack_webhook_url
}
