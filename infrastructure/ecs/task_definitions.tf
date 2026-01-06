resource "aws_ecs_task_definition" "backend" {
  family                   = "backend-task"
  cpu                      = "256"
  memory                   = "512"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]

  execution_role_arn = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn      = aws_iam_role.ecs_task_execution_role.arn

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = "557807210010.dkr.ecr.us-east-1.amazonaws.com/myapp-backend:latest"
      essential = true
      portMappings = [
        { containerPort = 3000, hostPort = 3000, protocol = "tcp" }
      ]
      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = "arn:aws:ssm:us-east-1:557807210010:parameter/ai-game/database-url"
        },
        {
          name      = "GEMINI_API_KEY"
          valueFrom = "arn:aws:ssm:us-east-1:557807210010:parameter/ai-game/gemini-api-key"
        },
        {
          name      = "SLACK_WEBHOOK_URL"
          valueFrom = "arn:aws:ssm:us-east-1:557807210010:parameter/ai-game/slack-webhook"
        },
        {
          name      = "MCP_SERVER_URL" 
          valueFrom = "arn:aws:ssm:us-east-1:557807210010:parameter/ai-game/mcp-server-url"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.backend.name
          "awslogs-region"        = "us-east-1"
          "awslogs-stream-prefix" = "backend"
        }
      }
    }
  ])
}

resource "aws_ecs_task_definition" "frontend" {
  family                   = "frontend-task"
  cpu                      = "256"
  memory                   = "512"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]

  execution_role_arn = aws_iam_role.ecs_task_execution_role.arn

  container_definitions = jsonencode([
    {
      name      = "frontend"
      image     = "557807210010.dkr.ecr.us-east-1.amazonaws.com/myapp-frontend:latest"
      essential = true
      portMappings = [
        { containerPort = 80, hostPort = 80, protocol = "tcp" }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.frontend.name
          "awslogs-region"        = "us-east-1"
          "awslogs-stream-prefix" = "frontend"
        }
      }
    }
  ])
}
