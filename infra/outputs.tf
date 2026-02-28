output "app_public_ip" {
  description = "EC2 퍼블릭 IP (Elastic IP)"
  value       = aws_eip.app.public_ip
}

output "backend_url" {
  description = "백엔드 API URL"
  value       = "http://${aws_eip.app.public_ip}:8080"
}

output "vercel_env" {
  description = "Vercel에 설정할 BACKEND_API_BASE_URL 값"
  value       = "http://${aws_eip.app.public_ip}:8080"
}
